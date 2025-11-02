import { Router } from 'express';
import {
  prepareTossPayment,
  confirmTossPayment,
  getTossPayment,
  getTossPaymentByOrderId,
  cancelTossPayment,
  createVirtualAccount,
  issueBillingKey,
  chargeWithBillingKey,
  verifyWebhookSignature,
  type TossPaymentData,
  type TossPaymentConfirm,
  type TossPaymentCancel,
} from './services/toss-payment';
import { requireAuth } from './auth';

const router = Router();

/**
 * 결제 준비 - 주문번호 생성
 * POST /api/payments/toss/prepare
 */
router.post('/toss/prepare', requireAuth, async (req, res) => {
  try {
    const paymentData: TossPaymentData = req.body;
    
    if (!paymentData.orderName || !paymentData.amount) {
      return res.status(400).json({
        success: false,
        error: '주문명과 금액은 필수입니다.',
      });
    }

    const preparedPayment = prepareTossPayment(paymentData);
    
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
 * 결제 승인
 * POST /api/payments/toss/confirm
 */
router.post('/toss/confirm', requireAuth, async (req, res) => {
  try {
    const confirmData: TossPaymentConfirm = req.body;
    
    if (!confirmData.paymentKey || !confirmData.orderId || !confirmData.amount) {
      return res.status(400).json({
        success: false,
        error: '결제키, 주문번호, 금액은 필수입니다.',
      });
    }

    const result = await confirmTossPayment(confirmData);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    // TODO: 결제 성공 시 데이터베이스에 저장하고 사용자 권한 업데이트
    // await storage.createPaymentRecord(...)
    // await storage.updateUserPermissions(...)

    res.json(result);
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      error: '결제 승인 중 오류가 발생했습니다.',
    });
  }
});

/**
 * 결제 조회 (paymentKey로 조회)
 * GET /api/payments/toss/:paymentKey
 */
router.get('/toss/:paymentKey', requireAuth, async (req, res) => {
  try {
    const { paymentKey } = req.params;
    const result = await getTossPayment(paymentKey);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Payment retrieval error:', error);
    res.status(500).json({
      success: false,
      error: '결제 정보 조회 중 오류가 발생했습니다.',
    });
  }
});

/**
 * 결제 조회 (orderId로 조회)
 * GET /api/payments/toss/order/:orderId
 */
router.get('/toss/order/:orderId', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await getTossPaymentByOrderId(orderId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Payment retrieval error:', error);
    res.status(500).json({
      success: false,
      error: '결제 정보 조회 중 오류가 발생했습니다.',
    });
  }
});

/**
 * 결제 취소
 * POST /api/payments/toss/cancel
 */
router.post('/toss/cancel', requireAuth, async (req, res) => {
  try {
    const cancelData: TossPaymentCancel = req.body;
    
    if (!cancelData.paymentKey || !cancelData.cancelReason) {
      return res.status(400).json({
        success: false,
        error: '결제키와 취소 사유는 필수입니다.',
      });
    }

    const result = await cancelTossPayment(cancelData);
    
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
 * 가상계좌 발급
 * POST /api/payments/toss/virtual-account
 */
router.post('/toss/virtual-account', requireAuth, async (req, res) => {
  try {
    const { orderName, amount, customerEmail, customerName, validHours, bank } = req.body;
    
    if (!orderName || !amount || !validHours) {
      return res.status(400).json({
        success: false,
        error: '주문명, 금액, 유효시간은 필수입니다.',
      });
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await createVirtualAccount({
      orderId,
      orderName,
      amount,
      customerEmail,
      customerName,
      validHours,
      bank,
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Virtual account creation error:', error);
    res.status(500).json({
      success: false,
      error: '가상계좌 발급 중 오류가 발생했습니다.',
    });
  }
});

/**
 * 빌링키 발급 (정기결제용 카드 등록)
 * POST /api/payments/toss/billing/issue
 */
router.post('/toss/billing/issue', requireAuth, async (req, res) => {
  try {
    const { customerKey, authKey, customerName, customerEmail } = req.body;
    
    if (!customerKey || !authKey) {
      return res.status(400).json({
        success: false,
        error: '고객키와 인증키는 필수입니다.',
      });
    }

    const result = await issueBillingKey({
      customerKey,
      authKey,
      customerName,
      customerEmail,
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    // TODO: 빌링키를 데이터베이스에 저장
    // await storage.saveBillingKey(...)

    res.json(result);
  } catch (error) {
    console.error('Billing key issuance error:', error);
    res.status(500).json({
      success: false,
      error: '빌링키 발급 중 오류가 발생했습니다.',
    });
  }
});

/**
 * 빌링키로 결제 (정기결제 실행)
 * POST /api/payments/toss/billing/charge
 */
router.post('/toss/billing/charge', requireAuth, async (req, res) => {
  try {
    const { billingKey, customerKey, orderName, amount, customerEmail, customerName } = req.body;
    
    if (!billingKey || !customerKey || !orderName || !amount) {
      return res.status(400).json({
        success: false,
        error: '빌링키, 고객키, 주문명, 금액은 필수입니다.',
      });
    }

    const orderId = `billing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await chargeWithBillingKey({
      billingKey,
      customerKey,
      orderId,
      orderName,
      amount,
      customerEmail,
      customerName,
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    // TODO: 결제 기록 저장 및 권한 업데이트
    // await storage.createPaymentRecord(...)
    // await storage.updateUserPermissions(...)

    res.json(result);
  } catch (error) {
    console.error('Billing charge error:', error);
    res.status(500).json({
      success: false,
      error: '정기결제 실행 중 오류가 발생했습니다.',
    });
  }
});

/**
 * 웹훅 엔드포인트 (Toss Payments에서 결제 상태 변경 시 호출)
 * POST /api/payments/toss/webhook
 */
router.post('/toss/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-toss-signature'] as string;
    const data = JSON.stringify(req.body);
    
    // 서명 검증
    if (!verifyWebhookSignature(signature, data)) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 웹훅 서명입니다.',
      });
    }

    const { type, data: webhookData } = req.body;
    
    // 결제 상태에 따른 처리
    switch (type) {
      case 'PAYMENT_STATUS_CHANGED':
        // TODO: 결제 상태 변경 처리
        console.log('Payment status changed:', webhookData);
        // await storage.updatePaymentStatus(...)
        break;
        
      case 'VIRTUAL_ACCOUNT_DEPOSIT':
        // TODO: 가상계좌 입금 처리
        console.log('Virtual account deposit:', webhookData);
        // await storage.confirmVirtualAccountPayment(...)
        break;
        
      default:
        console.log('Unknown webhook type:', type);
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
