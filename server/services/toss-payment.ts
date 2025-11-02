import axios from 'axios';

// Toss Payments API 설정
const { TOSS_PAYMENTS_SECRET_KEY } = process.env;

if (!TOSS_PAYMENTS_SECRET_KEY) {
  console.warn('Toss Payments API 키가 설정되지 않았습니다. TOSS_PAYMENTS_SECRET_KEY를 환경변수에 설정해주세요.');
}

// Toss Payments API 베이스 URL
const TOSS_API_BASE = 'https://api.tosspayments.com/v1';

// Base64 인코딩된 시크릿 키 (Basic Auth용)
const getAuthHeader = () => {
  if (!TOSS_PAYMENTS_SECRET_KEY) {
    throw new Error('Toss Payments Secret Key가 설정되지 않았습니다.');
  }
  const encodedKey = Buffer.from(`${TOSS_PAYMENTS_SECRET_KEY}:`).toString('base64');
  return `Basic ${encodedKey}`;
};

export interface TossPaymentData {
  orderId: string;
  orderName: string;
  amount: number;
  customerEmail?: string;
  customerName?: string;
  planType?: string;
}

export interface TossPaymentConfirm {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface TossPaymentCancel {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number; // 부분 취소용 (선택사항)
}

/**
 * 결제 준비 - 고유한 주문번호 생성
 */
export function prepareTossPayment(paymentData: TossPaymentData) {
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    orderId,
    orderName: paymentData.orderName,
    amount: paymentData.amount,
    customerEmail: paymentData.customerEmail,
    customerName: paymentData.customerName,
    planType: paymentData.planType,
  };
}

/**
 * 결제 승인 (결제창에서 결제 완료 후 서버에서 승인)
 * 클라이언트에서 paymentKey, orderId, amount를 받아서 승인 처리
 */
export async function confirmTossPayment(confirmData: TossPaymentConfirm) {
  try {
    const response = await axios.post(
      `${TOSS_API_BASE}/payments/confirm`,
      {
        paymentKey: confirmData.paymentKey,
        orderId: confirmData.orderId,
        amount: confirmData.amount,
      },
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      payment: {
        paymentKey: response.data.paymentKey,
        orderId: response.data.orderId,
        orderName: response.data.orderName,
        method: response.data.method,
        totalAmount: response.data.totalAmount,
        status: response.data.status,
        requestedAt: response.data.requestedAt,
        approvedAt: response.data.approvedAt,
        customerEmail: response.data.customerEmail,
        customerName: response.data.customerName,
      },
    };
  } catch (error: any) {
    console.error('Toss Payment confirmation error:', error.response?.data || error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || '결제 승인 중 오류가 발생했습니다',
      code: error.response?.data?.code,
    };
  }
}

/**
 * 결제 조회
 */
export async function getTossPayment(paymentKey: string) {
  try {
    const response = await axios.get(
      `${TOSS_API_BASE}/payments/${paymentKey}`,
      {
        headers: {
          'Authorization': getAuthHeader(),
        },
      }
    );

    return {
      success: true,
      payment: response.data,
    };
  } catch (error: any) {
    console.error('Toss Payment retrieval error:', error.response?.data || error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || '결제 정보 조회 중 오류가 발생했습니다',
    };
  }
}

/**
 * 주문번호로 결제 조회
 */
export async function getTossPaymentByOrderId(orderId: string) {
  try {
    const response = await axios.get(
      `${TOSS_API_BASE}/payments/orders/${orderId}`,
      {
        headers: {
          'Authorization': getAuthHeader(),
        },
      }
    );

    return {
      success: true,
      payment: response.data,
    };
  } catch (error: any) {
    console.error('Toss Payment retrieval by order ID error:', error.response?.data || error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || '결제 정보 조회 중 오류가 발생했습니다',
    };
  }
}

/**
 * 결제 취소
 */
export async function cancelTossPayment(cancelData: TossPaymentCancel) {
  try {
    const requestBody: any = {
      cancelReason: cancelData.cancelReason,
    };

    // 부분 취소인 경우 금액 포함
    if (cancelData.cancelAmount) {
      requestBody.cancelAmount = cancelData.cancelAmount;
    }

    const response = await axios.post(
      `${TOSS_API_BASE}/payments/${cancelData.paymentKey}/cancel`,
      requestBody,
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: {
        paymentKey: response.data.paymentKey,
        orderId: response.data.orderId,
        status: response.data.status,
        cancels: response.data.cancels,
      },
    };
  } catch (error: any) {
    console.error('Toss Payment cancellation error:', error.response?.data || error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || '결제 취소 중 오류가 발생했습니다',
    };
  }
}

/**
 * 가상계좌 발급 (가상계좌 결제용)
 */
export async function createVirtualAccount(paymentData: TossPaymentData & {
  validHours: number; // 입금 유효 시간
  bank?: string; // 은행 코드
}) {
  try {
    const response = await axios.post(
      `${TOSS_API_BASE}/virtual-accounts`,
      {
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        amount: paymentData.amount,
        customerEmail: paymentData.customerEmail,
        customerName: paymentData.customerName,
        validHours: paymentData.validHours,
        ...(paymentData.bank && { bank: paymentData.bank }),
      },
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      virtualAccount: {
        orderId: response.data.orderId,
        accountNumber: response.data.accountNumber,
        bank: response.data.bank,
        customerName: response.data.customerName,
        dueDate: response.data.dueDate,
      },
    };
  } catch (error: any) {
    console.error('Virtual account creation error:', error.response?.data || error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || '가상계좌 발급 중 오류가 발생했습니다',
    };
  }
}

/**
 * 카드 빌링키 발급 (정기 결제용)
 */
export async function issueBillingKey(billingData: {
  customerKey: string; // 고객 고유 키
  authKey: string; // 카드 인증 키 (카드 등록 시 받은 값)
  customerName?: string;
  customerEmail?: string;
}) {
  try {
    const response = await axios.post(
      `${TOSS_API_BASE}/billing/authorizations/issue`,
      {
        customerKey: billingData.customerKey,
        authKey: billingData.authKey,
        customerName: billingData.customerName,
        customerEmail: billingData.customerEmail,
      },
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      billingKey: response.data.billingKey,
      cardInfo: response.data.card,
    };
  } catch (error: any) {
    console.error('Billing key issuance error:', error.response?.data || error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || '빌링키 발급 중 오류가 발생했습니다',
    };
  }
}

/**
 * 빌링키로 결제 (정기 결제 실행)
 */
export async function chargeWithBillingKey(chargeData: {
  billingKey: string;
  customerKey: string;
  orderId: string;
  orderName: string;
  amount: number;
  customerEmail?: string;
  customerName?: string;
}) {
  try {
    const response = await axios.post(
      `${TOSS_API_BASE}/billing/${chargeData.billingKey}`,
      {
        customerKey: chargeData.customerKey,
        orderId: chargeData.orderId,
        orderName: chargeData.orderName,
        amount: chargeData.amount,
        customerEmail: chargeData.customerEmail,
        customerName: chargeData.customerName,
      },
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      payment: {
        paymentKey: response.data.paymentKey,
        orderId: response.data.orderId,
        status: response.data.status,
        totalAmount: response.data.totalAmount,
      },
    };
  } catch (error: any) {
    console.error('Billing charge error:', error.response?.data || error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || '정기 결제 실행 중 오류가 발생했습니다',
    };
  }
}

/**
 * 웹훅 서명 검증 (보안을 위한 웹훅 검증)
 */
export function verifyWebhookSignature(signature: string, data: string): boolean {
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', TOSS_PAYMENTS_SECRET_KEY!)
      .update(data)
      .digest('base64');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}
