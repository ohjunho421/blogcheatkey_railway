import axios from 'axios';

// 포트원 API 설정
const { PORTONE_API_KEY, PORTONE_API_SECRET } = process.env;

if (!PORTONE_API_KEY || !PORTONE_API_SECRET) {
  throw new Error('포트원 API 키가 설정되지 않았습니다. PORTONE_API_KEY와 PORTONE_API_SECRET을 환경변수에 설정해주세요.');
}

// 포트원 API 베이스 URL
const PORTONE_API_BASE = 'https://api.iamport.kr';

export interface PaymentData {
  merchant_uid: string;
  amount: number;
  name: string;
  planType: string;
}

export interface PaymentVerification {
  imp_uid: string;
  merchant_uid: string;
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
 * 포트원 액세스 토큰 획득
 */
async function getAccessToken(): Promise<string> {
  try {
    const response = await axios.post(`${PORTONE_API_BASE}/users/getToken`, {
      imp_key: PORTONE_API_KEY,
      imp_secret: PORTONE_API_SECRET,
    });

    if (response.data.code !== 0) {
      throw new Error(`토큰 획득 실패: ${response.data.message}`);
    }

    return response.data.response.access_token;
  } catch (error) {
    console.error('Access token error:', error);
    throw new Error('포트원 인증 실패');
  }
}

/**
 * 결제 검증 - 포트원에서 결제 정보 조회하여 위변조 방지
 */
export async function verifyPayment(verificationData: PaymentVerification) {
  try {
    const accessToken = await getAccessToken();
    
    // 포트원에서 결제 정보 조회
    const response = await axios.get(`${PORTONE_API_BASE}/payments/${verificationData.imp_uid}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (response.data.code !== 0) {
      throw new Error('결제 정보 조회 실패');
    }

    const payment = response.data.response;

    // 결제 상태 확인
    if (payment.status !== 'paid') {
      throw new Error(`결제가 완료되지 않았습니다. 상태: ${payment.status}`);
    }

    // 주문번호 일치 확인
    if (payment.merchant_uid !== verificationData.merchant_uid) {
      throw new Error('주문번호가 일치하지 않습니다');
    }

    return {
      success: true,
      payment: {
        imp_uid: payment.imp_uid,
        merchant_uid: payment.merchant_uid,
        amount: payment.amount,
        status: payment.status,
        paid_at: payment.paid_at,
        name: payment.name,
        buyer_email: payment.buyer_email,
        buyer_name: payment.buyer_name,
      },
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
    };
  }
}

/**
 * 결제 취소
 */
export async function cancelPayment(imp_uid: string, reason: string = '사용자 요청') {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios.post(`${PORTONE_API_BASE}/payments/cancel`, {
      imp_uid,
      reason,
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: response.data.code === 0,
      data: response.data.response,
      error: response.data.message,
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
 * 결제 내역 조회
 */
export async function getPaymentHistory(merchantUidPrefix?: string) {
  try {
    const accessToken = await getAccessToken();
    
    // 최근 결제 내역 조회 (최대 100개)
    const response = await axios.get(`${PORTONE_API_BASE}/payments/status/all`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      params: {
        limit: 100,
        ...(merchantUidPrefix && { merchant_uid: merchantUidPrefix }),
      },
    });

    return {
      success: response.data.code === 0,
      payments: response.data.response?.list || [],
      error: response.data.message,
    };
  } catch (error) {
    console.error('Payment history error:', error);
    return {
      success: false,
      payments: [],
      error: error instanceof Error ? error.message : '결제 내역 조회 중 오류가 발생했습니다',
    };
  }
}