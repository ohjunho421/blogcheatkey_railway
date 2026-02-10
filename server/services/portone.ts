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
  paymentToken?: string; // 수동 승인 모드에서 SDK 응답으로 받은 토큰
  txId?: string;         // 결제 시도 건 ID
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

/**
 * 포트원 V2 결제 승인 확인
 *
 * 포트원 V2 인증결제에서는 PG사가 자동으로 결제를 승인합니다.
 * confirm API는 paymentToken이 있는 경우에만 호출합니다.
 * 웹훅에서 READY 상태를 받으면 아직 결제가 완료되지 않은 것이므로 무시합니다.
 * @see https://developers.portone.io/opi/ko/integration/start/v2/checkout
 */
async function confirmPayment(paymentId: string, paymentToken?: string) {
  const url = `${PORTONE_V2_API_BASE}/payments/${encodeURIComponent(paymentId)}/confirm`;
  console.log(`[PortOne V2] Confirming payment: ${paymentId}, token: ${paymentToken ? 'present' : 'absent'}`);

  const body: Record<string, unknown> = {};
  if (paymentToken) {
    body.paymentToken = paymentToken;
  }

  const response = await axios.post(
    url,
    body,
    {
      headers: {
        'Authorization': `PortOne ${PORTONE_API_SECRET}`,
        'Content-Type': 'application/json',
      },
    },
  );
  console.log(`[PortOne V2] Confirm response:`, JSON.stringify(response.data));
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
 *
 * 플로우:
 * 1. 결제 단건 조회로 현재 상태 확인
 * 2. READY 상태 + paymentToken 있으면 → confirm API 호출 (클라이언트 verify)
 *    READY 상태 + paymentToken 없으면 → PENDING 반환 (웹훅 등)
 * 3. confirm 후 재조회하여 PAID 상태 확인
 * 4. 이미 PAID면 바로 반환
 */
export async function verifyPayment(verificationData: PaymentVerificationV2) {
  if (!checkPortOneConfig()) {
    return {
      success: false as const,
      error: '포트원 V2 API Secret이 설정되지 않았습니다. 관리자에게 문의해주세요.',
    };
  }

  try {
    console.log('[PortOne V2] Verifying payment:', verificationData.paymentId);

    // 1단계: 현재 결제 상태 조회
    const payment = await fetchPayment(verificationData.paymentId);
    console.log(`[PortOne V2] Current status: ${payment.status}`);

    if (payment.status === 'PAID') {
      return extractPaymentResult(payment);
    }

    if (payment.status === 'FAILED' || payment.status === 'CANCELLED') {
      return {
        success: false as const,
        error: `결제가 완료되지 않았습니다. 상태: ${payment.status}`,
      };
    }

    // 2단계: READY 상태 처리
    if (payment.status === 'READY') {
      // paymentToken이 없으면 아직 결제가 진행 중 (웹훅에서 호출된 경우)
      // PG사가 자동 승인하므로 confirm 호출 불필요 → PENDING 반환
      if (!verificationData.paymentToken) {
        console.log('[PortOne V2] READY status without paymentToken - returning PENDING (PG auto-approval pending)');
        return {
          success: false as const,
          status: 'PENDING' as const,
          error: '결제가 PG사에서 승인 처리 중입니다. 잠시 후 자동으로 완료됩니다.',
        };
      }

      // paymentToken이 있는 경우에만 confirm API 호출 (클라이언트 verify 요청)
      try {
        await confirmPayment(verificationData.paymentId, verificationData.paymentToken);
        console.log('[PortOne V2] Confirm API called successfully with paymentToken');
      } catch (confirmError) {
        // confirm 실패 시 상세 로그
        if (axios.isAxiosError(confirmError) && confirmError.response) {
          const errData = confirmError.response.data;
          console.error('[PortOne V2] Confirm failed:', confirmError.response.status, JSON.stringify(errData));

          // 이미 승인된 결제인 경우 (중복 confirm) - 정상 처리
          if (confirmError.response.status === 409) {
            console.log('[PortOne V2] Payment already confirmed (409), proceeding...');
          } else {
            return {
              success: false as const,
              error: `결제 승인 실패: ${errData?.message || confirmError.message}`,
            };
          }
        } else {
          throw confirmError;
        }
      }

      // 3단계: confirm 후 폴링으로 PAID 전환 확인
      const MAX_RETRIES = 5;
      const RETRY_INTERVAL_MS = 1500;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        await sleep(RETRY_INTERVAL_MS);
        const updatedPayment = await fetchPayment(verificationData.paymentId);
        console.log(`[PortOne V2] Post-confirm attempt ${attempt}/${MAX_RETRIES} - status: ${updatedPayment.status}`);

        if (updatedPayment.status === 'PAID') {
          return extractPaymentResult(updatedPayment);
        }

        if (updatedPayment.status === 'FAILED' || updatedPayment.status === 'CANCELLED') {
          return {
            success: false as const,
            error: `결제 승인 후 실패. 상태: ${updatedPayment.status}`,
          };
        }
      }

      // confirm 호출 후에도 PAID 안 됨 - pending 반환
      return {
        success: false as const,
        status: 'PENDING' as const,
        error: '결제 승인 처리 중입니다. 잠시 후 다시 확인됩니다.',
      };
    }

    // 기타 상태 (PAY_PENDING 등)
    return {
      success: false as const,
      status: 'PENDING' as const,
      error: `결제 처리 중입니다. 현재 상태: ${payment.status}`,
    };
  } catch (error) {
    console.error('[PortOne V2] Payment verification error:', error instanceof Error ? error.message : error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('[PortOne V2] API response status:', error.response.status);
      console.error('[PortOne V2] API response data:', JSON.stringify(error.response.data, null, 2));
    }
    return {
      success: false as const,
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
