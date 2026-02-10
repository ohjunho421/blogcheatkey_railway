import axios from 'axios';

// 포트원 V2 API 설정
const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET;

// 환경변수 체크 함수
function checkPortOneConfig() {
  if (!PORTONE_API_SECRET) {
    console.warn('포트원 V2 API Secret이 설정되지 않았습니다. 결제 기능이 비활성화됩니다.');
    return false;
  }
  return true;
}

// 포트원 V2 API 베이스 URL
const PORTONE_V2_API_BASE = 'https://api.portone.io';

export interface PaymentData {
  merchant_uid: string;
  amount: number;
  name: string;
  planType: string;
}

export interface PaymentVerificationV2 {
  paymentId: string;
}

/**
 * 결제 준비 - 고유한 주문번호 생성
 */
export function preparePayment(paymentData: PaymentData) {
  const merchant_uid = `subscription_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    merchant_uid,
    amount: paymentData.amount,
    name: paymentData.name,
    planType: paymentData.planType,
  };
}

/**
 * 포트원 V2 API에서 결제 정보 단건 조회
 */
async function fetchPayment(paymentId: string) {
  const url = `${PORTONE_V2_API_BASE}/payments/${encodeURIComponent(paymentId)}`;
  const response = await axios.get(url, {
    headers: {
      'Authorization': `PortOne ${PORTONE_API_SECRET}`,
    },
  });
  return response.data;
}

function extractPaymentResult(payment: any) {
  return {
    success: true as const,
    payment: {
      paymentId: payment.id,
      merchant_uid: payment.id,
      amount: payment.amount?.total ?? 0,
      status: payment.status,
      paid_at: payment.paidAt ? Math.floor(new Date(payment.paidAt).getTime() / 1000) : 0,
      name: payment.orderName,
      buyer_email: payment.customer?.email ?? '',
      buyer_name: payment.customer?.name ?? '',
    },
  };
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 결제 검증 (V2 API) - 포트원에서 결제 정보 조회하여 위변조 방지
 * INICIS_V2 등 비동기 PG는 READY 상태에서 PAID로 전환되기까지 시간이 걸림
 * 최대 10초간 폴링하여 PAID 상태를 확인
 */
export async function verifyPayment(verificationData: PaymentVerificationV2) {
  if (!checkPortOneConfig()) {
    return {
      success: false,
      error: '포트원 V2 API Secret이 설정되지 않았습니다. 관리자에게 문의해주세요.',
    };
  }

  try {
    console.log('[PortOne V2] Verifying payment:', verificationData.paymentId);

    const MAX_RETRIES = 15;
    const RETRY_INTERVAL_MS = 2000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const payment = await fetchPayment(verificationData.paymentId);
      console.log(`[PortOne V2] Attempt ${attempt}/${MAX_RETRIES} - status: ${payment.status}`);

      if (payment.status === 'PAID') {
        return extractPaymentResult(payment);
      }

      if (payment.status !== 'READY') {
        return {
          success: false,
          error: `결제가 완료되지 않았습니다. 상태: ${payment.status}`,
        };
      }

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_INTERVAL_MS);
      }
    }

    return {
      success: false,
      error: '결제 승인 대기 중입니다. 잠시 후 새로고침 해주세요.',
    };
  } catch (error) {
    console.error('[PortOne V2] Payment verification error:', error instanceof Error ? error.message : error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('[PortOne V2] API response status:', error.response.status);
      console.error('[PortOne V2] API response data:', JSON.stringify(error.response.data, null, 2));
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
    };
  }
}

/**
 * 결제 취소 (V2 API)
 */
export async function cancelPayment(paymentId: string, reason: string = '사용자 요청') {
  if (!checkPortOneConfig()) {
    return {
      success: false,
      error: '포트원 V2 API Secret이 설정되지 않았습니다.',
    };
  }

  try {
    const response = await axios.post(
      `${PORTONE_V2_API_BASE}/payments/${encodeURIComponent(paymentId)}/cancel`,
      { reason },
      {
        headers: {
          'Authorization': `PortOne ${PORTONE_API_SECRET}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return {
      success: true,
      data: response.data,
      error: null,
    };
  } catch (error) {
    console.error('Payment cancellation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '결제 취소 중 오류가 발생했습니다',
    };
  }
}

/**
 * 결제 내역 조회는 V2에서 별도 API 없이 개별 조회로 처리
 */
export async function getPaymentHistory(merchantUidPrefix?: string) {
  return {
    success: true,
    payments: [],
    error: null,
  };
}
