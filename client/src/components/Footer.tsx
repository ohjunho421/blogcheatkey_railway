import { Building2, User, Phone, FileText, CreditCard } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* 회사 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              블로그치트키
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI 기반 블로그 콘텐츠 생성 플랫폼
            </p>
          </div>

          {/* 사업자 정보 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              사업자 정보
            </h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>상호명: 블로그치트키</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>사업자번호: 456-05-03530</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>대표자명: 오준호</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>연락처: 010-5001-2143</span>
              </div>
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 mt-0.5" />
                <span>사업장주소: 경기도 의정부시 안말로 85번길 27-1</span>
              </div>
            </div>
          </div>

          {/* 서비스 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              서비스
            </h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div>SEO 최적화 블로그 생성</div>
              <div>AI 이미지 생성</div>
              <div>키워드 분석</div>
              <div>콘텐츠 편집 챗봇</div>
            </div>
          </div>

          {/* 결제 정보 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              결제 안내
            </h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>무통장 입금</span>
              </div>
              <div className="font-medium text-primary">카카오뱅크</div>
              <div className="font-mono text-xs">3333-17-9948665</div>
              <div>예금주: 블로그치트키</div>
              <div className="text-xs text-orange-600 dark:text-orange-400">
                ※ 입금 후 연락주세요
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Phone className="h-3 w-3" />
                <span>010-5001-2143</span>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 저작권 */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                © 2025 블로그치트키. All rights reserved.
              </p>
              <Link href="/privacy-policy" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline">
                개인정보처리방침
              </Link>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 sm:mt-0">
              사업자등록번호: 456-05-03530 | 대표: 오준호
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}