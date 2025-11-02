import React, { useEffect, useRef, useState } from 'react';
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';

interface TossPaymentWidgetProps {
  orderId: string;
  orderName: string;
  amount: number;
  customerEmail?: string;
  customerName?: string;
  onSuccess: (paymentKey: string, orderId: string, amount: number) => void;
  onFail: (error: any) => void;
}

export function TossPaymentWidget({
  orderId,
  orderName,
  amount,
  customerEmail,
  customerName,
  onSuccess,
  onFail,
}: TossPaymentWidgetProps) {
  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const clientKey = import.meta.env.VITE_TOSS_PAYMENTS_CLIENT_KEY;
    
    if (!clientKey) {
      setError('Toss Payments 클라이언트 키가 설정되지 않았습니다.');
      setIsLoading(false);
      return;
    }

    const loadWidget = async () => {
      try {
        const paymentWidget = await loadPaymentWidget(clientKey, customerEmail || 'anonymous');
        paymentWidgetRef.current = paymentWidget;

        // 결제 UI 렌더링
        await paymentWidget.renderPaymentMethods(
          '#payment-widget',
          { value: amount },
          { variantKey: 'DEFAULT' }
        );

        // 이용약관 UI 렌더링
        await paymentWidget.renderAgreement('#agreement');

        setIsLoading(false);
      } catch (err: any) {
        console.error('Widget loading error:', err);
        setError('결제 위젯을 불러오는 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };

    loadWidget();
  }, [amount, customerEmail]);

  const handlePayment = async () => {
    if (!paymentWidgetRef.current) {
      setError('결제 위젯이 로드되지 않았습니다.');
      return;
    }

    try {
      await paymentWidgetRef.current.requestPayment({
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail,
        customerName,
      });
    } catch (err: any) {
      console.error('Payment request error:', err);
      onFail(err);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">결제 정보를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div id="payment-widget" className="w-full" />
      <div id="agreement" className="w-full" />
      
      <button
        onClick={handlePayment}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        결제하기
      </button>
    </div>
  );
}
