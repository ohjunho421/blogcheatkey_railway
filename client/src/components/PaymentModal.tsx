import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentModalProps {
  children: React.ReactNode;
}

interface PricingPlan {
  name: string;
  price: number;
  credits: number;
  description: string;
  features: string[];
  popular?: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    name: '베이직',
    price: 9900,
    credits: 10,
    description: '개인 블로거를 위한 기본 플랜',
    features: [
      '10개 블로그 생성',
      'SEO 최적화',
      '키워드 분석',
      '이미지 생성',
      '30일 지원'
    ]
  },
  {
    name: '프로',
    price: 29900,
    credits: 50,
    description: '비즈니스를 위한 전문 플랜',
    features: [
      '50개 블로그 생성',
      'SEO 최적화',
      '키워드 분석',
      '이미지 생성',
      '우선 지원',
      '고급 분석'
    ],
    popular: true
  },
  {
    name: '엔터프라이즈',
    price: 99900,
    credits: 200,
    description: '대규모 콘텐츠 제작을 위한 플랜',
    features: [
      '200개 블로그 생성',
      'SEO 최적화',
      '키워드 분석',
      '이미지 생성',
      '24/7 지원',
      '고급 분석',
      '전용 계정 매니저'
    ]
  }
];

export default function PaymentModal({ children }: PaymentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async (plan: PricingPlan) => {
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
          name: plan.name,
          credits: plan.credits
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
          name: `블로그치트키 ${plan.name} 플랜`,
          amount: amount,
          buyer_email: 'customer@example.com',
          buyer_name: '구매자',
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
          {pricingPlans.map((plan) => (
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
                  {plan.credits}개 블로그 생성 가능
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
                  onClick={() => handlePayment(plan)}
                  disabled={isProcessing && selectedPlan?.name === plan.name}
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isProcessing && selectedPlan?.name === plan.name 
                    ? '결제 진행중...' 
                    : `${plan.name} 구매하기`
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center text-sm text-muted-foreground mt-4">
          <p>안전한 결제를 위해 포트원(PortOne)을 사용합니다</p>
          <p>카드, 계좌이체, 간편결제 모두 지원</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}