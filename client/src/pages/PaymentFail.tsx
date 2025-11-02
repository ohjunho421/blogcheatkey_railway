import React from 'react';
import { useLocation, useNavigate } from 'wouter';
import { XCircle } from 'lucide-react';

export function PaymentFail() {
  const [, navigate] = useNavigate();
  const [location] = useLocation();

  // URL 파라미터에서 오류 정보 추출
  const searchParams = new URLSearchParams(window.location.search);
  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');

  const getErrorMessage = () => {
    if (errorMessage) {
      return decodeURIComponent(errorMessage);
    }
    
    switch (errorCode) {
      case 'PAY_PROCESS_CANCELED':
        return '사용자가 결제를 취소했습니다.';
      case 'PAY_PROCESS_ABORTED':
        return '결제 진행 중 오류가 발생했습니다.';
      case 'REJECT_CARD_COMPANY':
        return '카드사에서 승인을 거부했습니다.';
      default:
        return '결제 처리 중 오류가 발생했습니다.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <XCircle className="w-16 h-16 mx-auto text-red-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">결제 실패</h2>
          <p className="mt-2 text-gray-600">{getErrorMessage()}</p>

          {errorCode && (
            <div className="mt-4 bg-red-50 rounded-lg p-3">
              <p className="text-sm text-red-600">오류 코드: {errorCode}</p>
            </div>
          )}

          <div className="mt-8 space-y-3">
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              다시 시도하기
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p>문제가 계속되면 고객센터로 문의해주세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
