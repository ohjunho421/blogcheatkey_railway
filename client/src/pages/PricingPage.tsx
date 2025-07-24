import React from 'react';
import { Button } from '@/components/ui/button';
import PaymentModal from '@/components/PaymentModal';
import Footer from '@/components/Footer';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { Link } from 'wouter';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              메인으로 돌아가기
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-center">요금제 선택</h1>
          <div className="w-32" /> {/* 레이아웃 균형을 위한 공간 */}
        </div>

        {/* 요금제 설명 */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            AI 블로그 생성 서비스
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            SEO 최적화된 고품질 블로그 콘텐츠를 AI로 자동 생성하세요. 
            키워드 분석부터 이미지 생성까지 모든 것이 포함되어 있습니다.
          </p>
        </div>

        {/* 결제 모달 트리거 */}
        <div className="text-center">
          <PaymentModal>
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <CreditCard className="h-5 w-5 mr-2" />
              요금제 선택하기
            </Button>
          </PaymentModal>
        </div>

        {/* 서비스 특징 */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">SEO 최적화</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              키워드 분석과 형태소 최적화로 검색 엔진 상위 노출을 보장합니다
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">빠른 생성</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Claude AI와 Gemini를 활용해 몇 분 만에 고품질 블로그를 완성합니다
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">이미지 생성</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              구글 Imagen AI로 블로그에 어울리는 인포그래픽을 자동 생성합니다
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h3 className="text-xl font-semibold text-center mb-8">자주 묻는 질문</h3>
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h4 className="font-semibold mb-2">결제는 어떻게 이루어지나요?</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                포트원(PortOne)을 통해 안전하게 결제됩니다. 카드, 계좌이체, 간편결제를 모두 지원합니다.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h4 className="font-semibold mb-2">크레딧은 언제까지 사용할 수 있나요?</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                구매한 크레딧은 구매일로부터 6개월간 사용 가능합니다.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h4 className="font-semibold mb-2">환불이 가능한가요?</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                크레딧 사용 전에는 7일 이내 100% 환불이 가능합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}