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

    // PortOne SDK 로드 확인
    if (!(window as any).PortOne) {
      console.error('PortOne SDK가 로드되지 않았습니다.');
      return;
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

      // PortOne 결제 요청
      const IMP = (window as any).IMP;
      if (!IMP) {
        throw new Error('PortOne SDK를 찾을 수 없습니다.');
      }

      IMP.init(storeId);

      IMP.request_pay(
        {
          pg: 'kakaopay.TC0ONETIME', // PG사 (예: kakaopay, tosspay, inicis 등)
          pay_method: 'card', // 결제 방법
          merchant_uid, // 주문번호
          name: orderName, // 상품명
          amount, // 결제 금액
          buyer_email: buyerEmail,
          buyer_name: buyerName,
          buyer_tel: buyerTel,
          m_redirect_url: `${window.location.origin}/payment/complete`, // 모바일 리다이렉트
        },
        async (response: any) => {
          if (response.success) {
            // 결제 성공 - 서버에서 검증
            try {
              const verifyResponse = await fetch('/api/payments/portone/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  imp_uid: response.imp_uid,
                  merchant_uid: response.merchant_uid,
                }),
              });

              const verifyData = await verifyResponse.json();

              if (verifyData.success) {
                alert('결제가 완료되었습니다!');
                onSuccess?.(verifyData.payment);
              } else {
                throw new Error(verifyData.error || '결제 검증 실패');
              }
            } catch (error: any) {
              console.error('Payment verification error:', error);
              alert(`결제 검증 오류: ${error.message}`);
              onFail?.(error);
            }
          } else {
            // 결제 실패
            const errorMsg = response.error_msg || '결제에 실패했습니다.';
            alert(errorMsg);
            onFail?.(new Error(errorMsg));
          }
        }
      );
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
