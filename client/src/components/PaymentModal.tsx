import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface PaymentModalProps {
  children: React.ReactNode;
}

interface SubscriptionPlan {
  name: string;
  price: number;
  description: string;
  features: string[];
  planType: string;
  popular?: boolean;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    name: '베이직',
    price: 20000,
    description: '기본적인 블로그 콘텐츠 생성',
    features: [
      '블로그 콘텐츠 생성',
      '인포그래픽 이미지 생성',
      'SEO 최적화',
      '키워드 분석'
    ],
    planType: 'basic'
  },
  {
    name: '프리미엄',
    price: 50000,
    description: '모든 기능을 포함한 완전한 서비스',
    features: [
      '블로그 콘텐츠 생성',
      '인포그래픽 이미지 생성',
      'SEO 최적화',
      '키워드 분석',
      'AI 챗봇 상담'
    ],
    popular: true,
    planType: 'premium'
  }
];

export default function PaymentModal({ children }: PaymentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubscription = async (plan: SubscriptionPlan) => {
    setIsProcessing(true);
    setSelectedPlan(plan);

    try {
      // 포트원 결제 요청
      const response = await fetch('/api/payments/portone/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: plan.price,
          name: `${plan.name} 월구독`,
          planType: plan.planType
        }),
      });

      // 401 에러 체크 (로그인 필요)
      if (response.status === 401) {
        throw new Error('로그인이 필요합니다. 먼저 로그인해주세요.');
      }
      
      const result = await response.json();
      
      // 서버 응답 검증
      if (!response.ok || !result.success) {
        throw new Error(result.error || '결제 준비에 실패했습니다.');
      }
      
      const { merchant_uid, amount } = result.data;

      // 포트원 V2 SDK 로드 확인
      if (!(window as any).PortOne) {
        console.log('Loading PortOne V2 SDK...');
        const script = document.createElement('script');
        script.src = 'https://cdn.portone.io/v2/browser-sdk.js';
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error('PortOne SDK 로드 실패'));
        });
      }
      
      const PortOne = (window as any).PortOne;
      if (!PortOne) {
        throw new Error('PortOne SDK를 불러올 수 없습니다');
      }
      
      // 포트원 V2 Store ID 확인
      const storeId = import.meta.env.VITE_PORTONE_STORE_ID;
      console.log('PortOne Store ID:', storeId);
      
      if (!storeId) {
        throw new Error('PortOne Store ID가 설정되지 않았습니다');
      }
      
      // 포트원 V2 결제 요청 - KG이니시스 채널키 사용
      const channelKey = 'channel-key-60e08fc8-6f08-4e58-aa60-41f2a81e2e7a';
      
      // 결제창이 뜨기 전에 요금제 선택 모달 즉시 닫기
      setIsOpen(false);
      setIsProcessing(false);
      
      // 모달이 완전히 닫힐 때까지 대기
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const paymentResponse = await PortOne.requestPayment({
        storeId: storeId,
        channelKey: channelKey,
        paymentId: merchant_uid,
        orderName: `블로그치트키 ${plan.name} 월구독`,
        totalAmount: amount,
        currency: 'KRW',
        payMethod: 'CARD',
        customer: {
          email: user?.email || '',
          fullName: user?.name || '구매자',
        },
      });

      if (paymentResponse.code) {
        // 결제 실패
        toast({
          title: '결제 실패',
          description: paymentResponse.message || '결제 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      } else {
        // 결제 성공 - 서버에서 검증
        const verifyResponse = await fetch('/api/payments/portone/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imp_uid: (paymentResponse as any).imp_uid,
            merchant_uid: merchant_uid,
          }),
        });

        if (verifyResponse.ok) {
          toast({
            title: '결제 완료',
            description: `${plan.name} 플랜이 성공적으로 구매되었습니다!`,
          });
          setIsOpen(false);
          // 페이지 새로고침 또는 상태 업데이트
          window.location.reload();
        } else {
          toast({
            title: '결제 검증 실패',
            description: '결제는 완료되었지만 검증 중 문제가 발생했습니다. 고객센터에 문의해주세요.',
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: '결제 오류',
        description: error?.message || '결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">요금제 선택</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto p-6">
          {subscriptionPlans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'border-blue-500 shadow-lg scale-105' : 'border-gray-200'}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1">
                  추천
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                <CardDescription className="text-gray-600 mt-2">{plan.description}</CardDescription>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">{(plan.price / 1000).toFixed(0)},000원</span>
                  <span className="text-gray-500 text-lg">/월</span>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">입금 안내</h4>
                    <p className="text-sm text-blue-800 mb-2">
                      <span className="font-medium">카카오뱅크 3333-17-9948665</span><br/>
                      예금주: 블로그치트키
                    </p>
                    <p className="text-xs text-blue-700">
                      입금 후 카카오톡 채팅방에서 입금자명을 알려주세요<br/>
                      구독 승인 및 계정 활성화를 도와드리겠습니다
                    </p>
                  </div>
                  
                  {/* 온라인 결제 버튼 */}
                  <Button
                    onClick={() => handleSubscription(plan)}
                    disabled={isProcessing && selectedPlan?.name === plan.name}
                    className={`w-full py-3 text-lg font-semibold ${
                      plan.popular 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isProcessing && selectedPlan?.name === plan.name ? (
                      <>처리 중...</>
                    ) : (
                      <>💳 온라인 결제하기</>
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">또는</span>
                    </div>
                  </div>
                  
                  {/* 카카오톡 채팅방 버튼 */}
                  <Button
                    onClick={() => window.open('https://open.kakao.com/o/saPv2yUg', '_blank')}
                    className="w-full py-3 text-lg font-semibold bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300"
                    variant="outline"
                  >
                    💬 카카오톡 채팅방 입장하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center text-sm text-muted-foreground mt-4">
          <p>안전한 월구독 결제를 위해 포트원(PortOne)을 사용합니다</p>
          <p>카드, 계좌이체, 간편결제 모두 지원 | 언제든지 해지 가능</p>
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
            <p className="text-xs">⚠️ 테스트 환경: PG 설정 완료 후 실제 결제가 가능합니다</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}