import { Router } from 'express';
import {
  preparePayment,
  verifyPayment,
  cancelPayment,
  getPaymentHistory,
  type PaymentData,
  type PaymentVerificationV2,
} from './services/portone';
import { requireAuth } from './auth';
import { storage } from './storage';

const router = Router();

/**
 * 결제 준비 - 주문번호 생성
 * POST /api/payments/portone/prepare
 */
router.post('/portone/prepare', requireAuth, async (req, res) => {
  try {
    const paymentData: PaymentData = req.body;
    
    if (!paymentData.name || !paymentData.amount) {
      return res.status(400).json({
        success: false,
        error: '상품명과 금액은 필수입니다.',
      });
    }

    const preparedPayment = preparePayment(paymentData);
    
    res.json({
      success: true,
      data: preparedPayment,
    });
  } catch (error) {
    console.error('Payment preparation error:', error);
    res.status(500).json({
      success: false,
      error: '결제 준비 중 오류가 발생했습니다.',
    });
  }
});

/**
 * 결제 검증
 * POST /api/payments/portone/verify
 */
router.post('/portone/verify', requireAuth, async (req, res) => {
  try {
    const { paymentId, paymentToken, txId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'paymentId는 필수입니다.',
      });
    }

    const result = await verifyPayment({ paymentId, paymentToken, txId });

    if (!result.success) {
      // PENDING 상태면 202로 반환 (프론트에서 재시도 가능)
      const statusCode = (result as any).status === 'PENDING' ? 202 : 400;
      return res.status(statusCode).json(result);
    }

    // 결제 성공 시 사용자 구독 정보 업데이트
    const userId = (req as any).session?.userId;
    if (userId && result.payment) {
      try {
        // 결제일로부터 1개월 후를 만료일로 설정
        const paymentDate = new Date(result.payment.paid_at * 1000);
        const expiresAt = new Date(paymentDate);
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        const amount = result.payment.amount;
        const planType = amount >= 50000 ? 'premium' : 'basic';
        const isPremium = planType === 'premium';

        await storage.updateUser(userId, {
          subscriptionTier: planType,
          subscriptionExpiresAt: expiresAt,
          canGenerateContent: true,
          canGenerateImages: isPremium,
          canUseChatbot: isPremium,
        } as any);

        console.log(`User ${userId} subscription updated. Plan: ${planType}, Expires at: ${expiresAt.toISOString()}`);
      } catch (updateError) {
        console.error('Failed to update user subscription:', updateError);
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: '결제 검증 중 오류가 발생했습니다.',
    });
  }
});

/**
 * 결제 취소
 * POST /api/payments/portone/cancel
 */
router.post('/portone/cancel', requireAuth, async (req, res) => {
  try {
    const { paymentId, reason } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'paymentId는 필수입니다.',
      });
    }

    const result = await cancelPayment(paymentId, reason || '사용자 요청');
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    // TODO: 결제 취소 시 데이터베이스 업데이트
    // await storage.updatePaymentStatus(...)
    // await storage.updateUserPermissions(...)

    res.json(result);
  } catch (error) {
    console.error('Payment cancellation error:', error);
    res.status(500).json({
      success: false,
      error: '결제 취소 중 오류가 발생했습니다.',
    });
  }
});

/**
 * 결제 내역 조회
 * GET /api/payments/portone/history
 */
router.get('/portone/history', requireAuth, async (req, res) => {
  try {
    const { merchantUidPrefix } = req.query;
    
    const result = await getPaymentHistory(merchantUidPrefix as string);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({
      success: false,
      error: '결제 내역 조회 중 오류가 발생했습니다.',
    });
  }
});

/**
 * 웹훅 엔드포인트 (PortOne V2에서 결제 상태 변경 시 호출)
 * POST /api/payments/portone/webhook
 *
 * V2 웹훅 형식 (두 가지 페이로드 호환):
 *   표준: { type: "Transaction.Paid", data: { paymentId, transactionId } }
 *   간소: { tx_id, payment_id, status: "Ready" | "Paid" }
 *
 * READY 웹훅도 처리하여 수동 승인(confirm) 수행
 */
router.post('/portone/webhook', async (req, res) => {
  try {
    const body = req.body;
    console.log('[Webhook] Received:', JSON.stringify(body));

    // V2 웹훅 페이로드 파싱 - 두 가지 형식 호환
    const webhookType = body.type; // 표준 형식: "Transaction.Paid"
    const webhookStatus = body.status; // 간소 형식: "Ready", "Paid"
    const paymentId = body.data?.paymentId || body.payment_id || body.paymentId;

    if (!paymentId) {
      console.log('[Webhook] No paymentId found, ignoring');
      return res.json({ success: true });
    }

    // 처리 대상 이벤트 판별
    // - Transaction.Paid 또는 status=Paid → 결제 완료 확인
    // - Transaction.Ready 또는 status=Ready → 수동 승인이 필요한 결제
    const isPaid = webhookType === 'Transaction.Paid' || webhookStatus === 'Paid';
    const isReady = webhookType === 'Transaction.Ready' || webhookStatus === 'Ready';

    if (!isPaid && !isReady) {
      console.log(`[Webhook] type=${webhookType}, status=${webhookStatus} - skipping`);
      return res.json({ success: true });
    }

    console.log(`[Webhook] Processing ${isPaid ? 'PAID' : 'READY'} event for paymentId: ${paymentId}`);

    // verifyPayment가 READY 상태 시 자동으로 confirm API 호출함
    const verification = await verifyPayment({ paymentId });

    if (!verification.success || !verification.payment) {
      console.error('[Webhook] Verification failed:', (verification as any).error);
      return res.json({ success: true });
    }

    console.log('[Webhook] Payment verified:', verification.payment);

    const amount = verification.payment.amount;
    const planType = amount >= 50000 ? 'premium' : 'basic';
    const isPremium = planType === 'premium';

    const paymentDate = new Date(verification.payment.paid_at * 1000);
    const expiresAt = new Date(paymentDate);
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // 이메일로 사용자 조회하여 구독 업데이트
    if (verification.payment.buyer_email) {
      try {
        const user = await storage.getUserByEmail(verification.payment.buyer_email);
        if (user) {
          await storage.updateUser(user.id, {
            subscriptionTier: planType,
            subscriptionExpiresAt: expiresAt,
            canGenerateContent: true,
            canGenerateImages: isPremium,
            canUseChatbot: isPremium,
          } as any);
          console.log(`[Webhook] User ${user.id} subscription updated. Plan: ${planType}, Expires: ${expiresAt.toISOString()}`);
        } else {
          console.warn(`[Webhook] No user found for email: ${verification.payment.buyer_email}`);
        }
      } catch (updateError) {
        console.error('[Webhook] Failed to update user subscription:', updateError);
      }
    } else {
      console.warn('[Webhook] No buyer_email in payment data');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Webhook] Processing error:', error);
    res.status(500).json({
      success: false,
      error: '웹훅 처리 중 오류가 발생했습니다.',
    });
  }
});

export default router;
