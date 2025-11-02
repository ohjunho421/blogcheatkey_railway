import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'wouter';
import { CheckCircle, Loader2 } from 'lucide-react';

export function PaymentSuccess() {
  const [, navigate] = useNavigate();
  const [location] = useLocation();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      // URL 파라미터에서 결제 정보 추출
      const searchParams = new URLSearchParams(window.location.search);
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');

      if (!paymentKey || !orderId || !amount) {
        setError('결제 정보가 올바르지 않습니다.');
        setIsProcessing(false);
        return;
      }

      try {
        // 서버에 결제 승인 요청
        const response = await fetch('/api/payments/toss/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount),
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || '결제 승인에 실패했습니다.');
        }

        setPaymentInfo(data.payment);
        setIsProcessing(false);

        // 3초 후 메인 페이지로 이동
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } catch (err: any) {
        console.error('Payment confirmation error:', err);
        setError(err.message || '결제 처리 중 오류가 발생했습니다.');
        setIsProcessing(false);
      }
    };

    confirmPayment();
  }, [navigate]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">결제를 처리하고 있습니다...</h2>
          <p className="mt-2 text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">결제 처리 실패</h2>
            <p className="mt-2 text-red-600">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">결제가 완료되었습니다!</h2>
          <p className="mt-2 text-gray-600">구매해주셔서 감사합니다.</p>

          {paymentInfo && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">주문번호</span>
                  <span className="font-medium">{paymentInfo.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">상품명</span>
                  <span className="font-medium">{paymentInfo.orderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">결제 금액</span>
                  <span className="font-medium">{paymentInfo.totalAmount?.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">결제 방법</span>
                  <span className="font-medium">{paymentInfo.method}</span>
                </div>
              </div>
            </div>
          )}

          <p className="mt-6 text-sm text-gray-500">3초 후 자동으로 홈으로 이동합니다...</p>
          
          <button
            onClick={() => navigate('/')}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            지금 홈으로 가기
          </button>
        </div>
      </div>
    </div>
  );
}
