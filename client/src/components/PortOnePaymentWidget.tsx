import React, { useEffect } from 'react';

interface PortOnePaymentWidgetProps {
  amount: number;
  orderName: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerTel?: string;
  planType?: string;
  onSuccess?: (response: any) => void;
  onFail?: (error: any) => void;
}

export function PortOnePaymentWidget({
  amount,
  orderName,
  buyerName,
  buyerEmail,
  buyerTel,
  planType,
  onSuccess,
  onFail,
}: PortOnePaymentWidgetProps) {
  const storeId = import.meta.env.VITE_PORTONE_STORE_ID;

  useEffect(() => {
    if (!storeId) {
      console.error('PortOne Store ID가 설정되지 않았습니다.');
      return;
    }

    if (!(window as any).PortOne) {
      console.warn('PortOne V2 SDK가 아직 로드되지 않았습니다.');
    }
  }, [storeId]);

  const handlePayment = async () => {
    if (!storeId) {
      alert('결제 설정이 올바르지 않습니다.');
      return;
    }

    try {
      // 서버에서 주문번호 생성
      const prepareResponse = await fetch('/api/payments/portone/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount,
          name: orderName,
          planType: planType || 'basic',
        }),
      });

      const prepareData = await prepareResponse.json();
      
      if (!prepareData.success) {
        throw new Error(prepareData.error || '결제 준비 실패');
      }

      const { merchant_uid } = prepareData.data;

      // PortOne V2 SDK 결제 요청
      const PortOne = (window as any).PortOne;
      if (!PortOne) {
        throw new Error('PortOne SDK를 찾을 수 없습니다.');
      }

      const channelKey = 'channel-key-60e08fc8-6f08-4e58-aa60-41f2a81e2e7a';

      const serverUrl = window.location.origin;

      const paymentResponse = await PortOne.requestPayment({
        storeId,
        channelKey,
        paymentId: merchant_uid,
        orderName,
        totalAmount: amount,
        currency: 'KRW',
        payMethod: 'CARD',
        noticeUrls: [`${serverUrl}/api/payments/portone/webhook`],
        customer: {
          email: buyerEmail || '',
          phoneNumber: buyerTel || '01000000000',
          fullName: buyerName || '구매자',
        },
      });

      if (paymentResponse.code !== undefined) {
        if (paymentResponse.code === 'FAILURE_TYPE_PG') {
          const errorMsg = paymentResponse.message || '결제에 실패했습니다.';
          alert(errorMsg);
          onFail?.(new Error(errorMsg));
        }
        return;
      }

      // 결제 성공 - 서버에서 V2 API로 검증 (비동기 PG 폴링 포함)
      const MAX_RETRIES = 20;
      const RETRY_INTERVAL = 3000;

      for (let retry = 0; retry < MAX_RETRIES; retry++) {
        try {
          const verifyResponse = await fetch('/api/payments/portone/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ paymentId: merchant_uid }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyResponse.ok && verifyData.success) {
            alert('결제가 완료되었습니다!');
            onSuccess?.(verifyData.payment);
            return;
          }

          if (verifyResponse.status === 202) {
            await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
            continue;
          }

          throw new Error(verifyData.error || '결제 검증 실패');
        } catch (error: any) {
          if (retry === MAX_RETRIES - 1) {
            console.error('Payment verification error:', error);
            alert('결제 승인 대기 중입니다. 잠시 후 새로고침 해주세요.');
            onFail?.(error);
          }
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(`결제 오류: ${error.message}`);
      onFail?.(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">결제 정보</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">상품명</span>
            <span className="font-medium">{orderName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">결제 금액</span>
            <span className="font-bold text-lg text-blue-600">{amount.toLocaleString()}원</span>
          </div>
        </div>
      </div>

      <button
        onClick={handlePayment}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        결제하기
      </button>

      <p className="text-xs text-gray-500 text-center">
        결제는 PortOne을 통해 안전하게 처리됩니다.
      </p>
    </div>
  );
}
