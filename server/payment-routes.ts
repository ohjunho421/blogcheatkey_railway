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
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'paymentId는 필수입니다.',
      });
    }

    const result = await verifyPayment({ paymentId });

    if (!result.success) {
      return res.status(400).json(result);
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
 * 웹훅 엔드포인트 (PortOne에서 결제 상태 변경 시 호출)
 * POST /api/payments/portone/webhook
 */
router.post('/portone/webhook', async (req, res) => {
  try {
    // 웹훅 시크릿 검증
    const webhookSecret = process.env.PORTONE_WEBHOOK_SECRET;
    const signature = req.headers['x-iamport-signature'] as string;
    
    if (webhookSecret && signature) {
      // PortOne V2 웹훅 검증
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.error('Webhook signature mismatch');
        return res.status(401).json({ 
          success: false, 
          error: '웹훅 서명 검증 실패' 
        });
      }
    }
    
    // V2 webhook 형식: body에 tx_id, payment_id, status 가 직접 옴
    const paymentId = req.body.payment_id || req.body.data?.paymentId || req.body.paymentId;
    const webhookStatus = req.body.status;

    console.log('PortOne webhook received:', { paymentId, webhookStatus, body: req.body });

    // Paid 상태일 때만 검증 및 구독 업데이트
    if (paymentId && webhookStatus === 'Paid') {
      const verification = await verifyPayment({ paymentId });

      if (verification.success && verification.payment) {
        console.log('Webhook verification successful:', verification.payment);

        const amount = verification.payment.amount;
        const planType = amount >= 50000 ? 'premium' : 'basic';
        const isPremium = planType === 'premium';

        const paymentDate = new Date(verification.payment.paid_at * 1000);
        const expiresAt = new Date(paymentDate);
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        // paymentId에서 userId를 직접 알 수 없으므로 DB에서 이메일로 조회
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
              console.log(`Webhook: User ${user.id} subscription updated. Plan: ${planType}, Expires: ${expiresAt.toISOString()}`);
            }
          } catch (updateError) {
            console.error('Webhook: Failed to update user subscription:', updateError);
          }
        }
      } else {
        console.error('Webhook verification failed:', verification.error);
      }
    } else {
      console.log(`Webhook: Skipping status=${webhookStatus} for paymentId=${paymentId}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      error: '웹훅 처리 중 오류가 발생했습니다.',
    });
  }
});

export default router;
