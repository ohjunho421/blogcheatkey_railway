import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    price: 50000,
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
    price: 100000,
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

  const handleSubscription = async (plan: SubscriptionPlan) => {
    setIsProcessing(true);
    setSelectedPlan(plan);

    try {
      // 포트원 결제 요청
      const response = await fetch('/api/payment/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.price,
          name: `${plan.name} 월구독`,
          planType: plan.planType
        }),
      });

      const { merchant_uid, amount } = await response.json();

      // 포트원 결제 창 호출 (IMP 방식)
      const IMP = (window as any).IMP;
      if (!IMP) {
        // 포트원 스크립트 동적 로드
        const script = document.createElement('script');
        script.src = 'https://cdn.iamport.kr/v1/iamport.js';
        document.head.appendChild(script);
        
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }
      
      // 포트원 초기화
      (window as any).IMP.init(import.meta.env.VITE_PORTONE_STORE_ID || 'imp12345');
      
      // 결제 요청
      const paymentResponse = await new Promise((resolve) => {
        (window as any).IMP.request_pay({
          pg: 'html5_inicis',
          pay_method: 'card',
          merchant_uid: merchant_uid,
          name: `블로그치트키 ${plan.name} 월구독`,
          amount: amount,
          buyer_email: 'customer@example.com',
          buyer_name: '구매자',
          customer_uid: `customer_${Date.now()}`, // 정기결제용 고객 식별자
        }, resolve);
      });

      if ((paymentResponse as any).error_code) {
        // 결제 실패
        toast({
          title: '결제 실패',
          description: (paymentResponse as any).error_msg || '결제 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      } else {
        // 결제 성공 - 서버에서 검증
        const verifyResponse = await fetch('/api/payment/verify', {
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
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: '결제 오류',
        description: '결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
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
                      입금 후 카카오톡으로 연락주세요<br/>
                      구독 승인 및 계정 활성화를 도와드리겠습니다
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => window.open('https://open.kakao.com/o/your-kakao-link', '_blank')}
                    className={`w-full py-3 text-lg font-semibold ${
                      plan.popular 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    카카오톡으로 문의하기
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