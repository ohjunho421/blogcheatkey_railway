import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    price: 30000,
    description: '기본 블로그 콘텐츠 생성',
    features: [
      '월 30개 블로그 생성',
      'SEO 최적화 콘텐츠', 
      '키워드 분석',
      '이메일 지원'
    ],
    planType: 'content_only'
  },
  {
    name: '프리미엄',
    price: 50000,
    description: '블로그 + 이미지 생성',
    features: [
      '월 30개 블로그 생성',
      'SEO 최적화 콘텐츠',
      '인포그래픽 자동 생성',
      '키워드 분석',
      '우선 지원'
    ],
    popular: true,
    planType: 'content_and_images'
  },
  {
    name: '프로',
    price: 100000,
    description: '올인원 AI 블로그 솔루션',
    features: [
      '월 30개 블로그 생성',
      'SEO 최적화 콘텐츠',
      '인포그래픽 자동 생성',
      'AI 챗봇 편집',
      '키워드 분석',
      '전담 지원',
      'API 접근'
    ],
    planType: 'full_service'
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {subscriptionPlans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    인기
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">₩{plan.price.toLocaleString()}</span>
                  <span className="text-muted-foreground ml-1">/월</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  매월 자동 갱신
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handleSubscription(plan)}
                  disabled={isProcessing && selectedPlan?.name === plan.name}
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isProcessing && selectedPlan?.name === plan.name 
                    ? '구독 진행중...' 
                    : `${plan.name} 월구독`
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center text-sm text-muted-foreground mt-4">
          <p>안전한 월구독 결제를 위해 포트원(PortOne)을 사용합니다</p>
          <p>카드, 계좌이체, 간편결제 모두 지원 | 언제든지 해지 가능</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}