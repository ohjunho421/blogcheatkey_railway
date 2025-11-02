import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { PortOnePaymentWidget } from "@/components/PortOnePaymentWidget";
import { useState } from "react";

export default function Subscribe() {
  const { user, isAuthenticated } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      name: "베이직",
      price: "20,000원",
      amount: 20000,
      period: "월",
      description: "기본적인 블로그 콘텐츠 생성",
      features: [
        { name: "블로그 콘텐츠 생성", included: true },
        { name: "인포그래픽 이미지 생성", included: true },
        { name: "SEO 최적화", included: true },
        { name: "키워드 분석", included: true },
        { name: "AI 챗봇 상담", included: false },
      ],
      popular: false,
    },
    {
      name: "프리미엄",
      price: "50,000원",
      amount: 50000,
      period: "월",
      description: "모든 기능을 포함한 완전한 서비스",
      features: [
        { name: "블로그 콘텐츠 생성", included: true },
        { name: "인포그래픽 이미지 생성", included: true },
        { name: "SEO 최적화", included: true },
        { name: "키워드 분석", included: true },
        { name: "AI 챗봇 상담", included: true },
      ],
      popular: true,
    },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>로그인이 필요합니다</CardTitle>
            <CardDescription>
              구독 플랜을 확인하려면 먼저 로그인해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login">
              <Button className="w-full">로그인하기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            구독 플랜 선택
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            블로그치트키의 AI 기반 콘텐츠 생성 서비스를 통해 
            고품질 블로그 포스트를 효율적으로 제작하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name}
              className={`relative ${
                plan.popular ? "border-blue-500 shadow-lg scale-105" : "border-gray-200"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1">
                  추천
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 ml-1">/{plan.period}</span>
                </div>
                <CardDescription className="mt-2 text-base">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "bg-gray-800 hover:bg-gray-900"
                  }`}
                  onClick={() => {
                    setSelectedPlan(plan.name);
                    // 스크롤을 결제 섹션으로 이동
                    setTimeout(() => {
                      document.getElementById('payment-section')?.scrollIntoView({ 
                        behavior: 'smooth' 
                      });
                    }, 100);
                  }}
                >
                  {plan.name} 플랜 선택
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 결제 안내 섹션 */}
        <div id="payment-info" className="mt-16 max-w-2xl mx-auto">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-blue-900">
                결제 안내
              </CardTitle>
              <CardDescription className="text-blue-700">
                아래 계좌로 구독료를 입금해주시면 수동으로 권한을 부여해드립니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-lg mb-4 text-center">계좌 정보</h3>
                <div className="space-y-3 text-center">
                  <div>
                    <span className="font-medium text-gray-700">은행명:</span>
                    <span className="ml-2 text-lg font-mono">카카오뱅크</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">예금주:</span>
                    <span className="ml-2 text-lg font-mono">블로그치트키</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">계좌번호:</span>
                    <span className="ml-2 text-xl font-mono font-bold text-blue-600">
                      3333-17-9948665
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">입금 시 유의사항</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 입금 후 카카오톡 채팅방에서 입금자명을 알려주세요</li>
                  <li>• 구독 승인 및 계정 활성화를 즉시 도와드립니다</li>
                  <li>• 문의사항도 카카오톡 채팅방에서 편리하게 문의하세요</li>
                </ul>
              </div>

              <div className="text-center space-y-4">
                {/* 온라인 결제 버튼 */}
                <Button 
                  onClick={() => {
                    // 자동 결제 섹션으로 스크롤
                    document.getElementById('payment-section')?.scrollIntoView({ 
                      behavior: 'smooth' 
                    });
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 text-lg"
                  size="lg"
                >
                  💳 온라인 결제하기 (카드/계좌이체)
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-blue-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-blue-50 px-2 text-blue-600">또는</span>
                  </div>
                </div>

                {/* 카카오톡 채팅방 버튼 */}
                <Button 
                  onClick={() => window.open('https://open.kakao.com/o/saPv2yUg', '_blank')}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-8 text-lg"
                  size="lg"
                  variant="outline"
                >
                  💬 카카오톡 채팅방 입장하기
                </Button>
                
                <div>
                  <p className="text-gray-600 mb-2">
                    현재 계정: <span className="font-semibold">{user?.email || user?.name}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    입금 후 채팅방에서 입금자명과 이 계정 정보를 알려주세요.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PortOne 자동 결제 시스템 */}
        {selectedPlan && (
          <div id="payment-section" className="mt-8 max-w-2xl mx-auto">
            <Card className="border-green-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-green-900">
                  {selectedPlan} 플랜 결제
                </CardTitle>
                <CardDescription className="text-green-700">
                  안전한 PortOne 결제 시스템을 통해 간편하게 결제하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PortOnePaymentWidget
                  amount={plans.find(p => p.name === selectedPlan)?.amount || 0}
                  orderName={`블로그치트키 ${selectedPlan} 플랜`}
                  buyerName={user?.name}
                  buyerEmail={user?.email}
                  planType={selectedPlan}
                  onSuccess={(response) => {
                    alert('결제가 완료되었습니다!');
                    window.location.href = '/';
                  }}
                  onFail={(error) => {
                    alert(`결제 실패: ${error.message}`);
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}