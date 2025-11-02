import { Router } from 'express';
import {
  preparePayment,
  verifyPayment,
  cancelPayment,
  getPaymentHistory,
  type PaymentData,
  type PaymentVerification,
} from './services/portone';
import { requireAuth } from './auth';

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
    const verificationData: PaymentVerification = req.body;
    
    if (!verificationData.imp_uid || !verificationData.merchant_uid) {
      return res.status(400).json({
        success: false,
        error: '결제 고유번호와 주문번호는 필수입니다.',
      });
    }

    const result = await verifyPayment(verificationData);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    // TODO: 결제 성공 시 데이터베이스에 저장하고 사용자 권한 업데이트
    // await storage.createPaymentRecord(...)
    // await storage.updateUserPermissions(...)

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
    const { imp_uid, reason } = req.body;
    
    if (!imp_uid) {
      return res.status(400).json({
        success: false,
        error: '결제 고유번호는 필수입니다.',
      });
    }

    const result = await cancelPayment(imp_uid, reason || '사용자 요청');
    
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
    const { imp_uid, merchant_uid, status } = req.body;
    
    console.log('PortOne webhook received:', { imp_uid, merchant_uid, status });
    
    // 웹훅 데이터로 결제 상태 재검증
    if (imp_uid && merchant_uid) {
      const verification = await verifyPayment({ imp_uid, merchant_uid });
      
      if (verification.success) {
        // TODO: 결제 상태 업데이트
        // await storage.updatePaymentStatus(...)
        console.log('Webhook verification successful:', verification.payment);
      } else {
        console.error('Webhook verification failed:', verification.error);
      }
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
