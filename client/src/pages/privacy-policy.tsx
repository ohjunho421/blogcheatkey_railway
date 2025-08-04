import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              메인으로 돌아가기
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            개인정보처리방침
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            최종 업데이트: 2025년 1월 16일
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              1. 개인정보의 처리 목적
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              블로그치트키("회사" 또는 "서비스")는 다음의 목적을 위하여 개인정보를 처리합니다:
            </p>
            <ul className="mt-3 ml-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>• 회원가입 및 서비스 이용에 따른 본인확인</li>
              <li>• AI 기반 블로그 콘텐츠 생성 서비스 제공</li>
              <li>• 서비스 이용내역 관리 및 결제처리</li>
              <li>• 고객상담 및 불만처리</li>
              <li>• 서비스 개선 및 신규 서비스 개발</li>
              <li>• 마케팅 및 광고에의 활용 (동의 시에만)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              2. 처리하는 개인정보의 항목
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  가. 필수항목
                </h3>
                <ul className="ml-6 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• 구글 계정 정보 (이메일, 이름, 프로필 이미지)</li>
                  <li>• 서비스 이용기록, 접속로그, 쿠키, 접속 IP 정보</li>
                  <li>• 결제정보 (결제수단, 거래내역 등)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  나. 선택항목
                </h3>
                <ul className="ml-6 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• 업체정보 (사업자명, 업종, 제품/서비스 정보)</li>
                  <li>• 생성된 블로그 콘텐츠 및 키워드</li>
                  <li>• 채팅 내역 및 피드백</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              3. 개인정보의 처리 및 보유기간
            </h2>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• 회원정보: 회원탈퇴 시까지</li>
              <li>• 결제정보: 결제완료 후 5년 (전자상거래법)</li>
              <li>• 서비스 이용기록: 3개월</li>
              <li>• 고객상담 기록: 3년</li>
              <li>• 생성된 콘텐츠: 회원탈퇴 또는 삭제요청 시까지</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              4. 개인정보의 제3자 제공
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 
              다만, 다음의 경우에는 예외로 합니다:
            </p>
            <ul className="mt-3 ml-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>• 이용자가 사전에 동의한 경우</li>
              <li>• 법령의 규정에 의한 경우</li>
              <li>• 수사기관의 수사목적으로 법령에 정해진 절차에 따라 요구한 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              5. 개인정보처리의 위탁
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              회사는 서비스 제공을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-600">
                    <th className="text-left py-2 text-gray-900 dark:text-white">수탁업체</th>
                    <th className="text-left py-2 text-gray-900 dark:text-white">위탁업무</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-300">
                  <tr className="border-b dark:border-gray-600">
                    <td className="py-2">Google LLC</td>
                    <td className="py-2">소셜 로그인, AI 서비스 제공</td>
                  </tr>
                  <tr className="border-b dark:border-gray-600">
                    <td className="py-2">Anthropic</td>
                    <td className="py-2">AI 콘텐츠 생성</td>
                  </tr>
                  <tr className="border-b dark:border-gray-600">
                    <td className="py-2">포트원</td>
                    <td className="py-2">결제 처리</td>
                  </tr>
                  <tr>
                    <td className="py-2">Neon Database</td>
                    <td className="py-2">데이터 저장 및 관리</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              6. 정보주체의 권리·의무 및 행사방법
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다:
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• 개인정보 처리현황 통지요구</li>
              <li>• 개인정보 열람요구</li>
              <li>• 개인정보 정정·삭제요구</li>
              <li>• 개인정보 처리정지 요구</li>
            </ul>
            <p className="mt-4 text-gray-700 dark:text-gray-300">
              위 권리 행사는 개인정보보호법 시행령 제41조제1항에 따라 서면, 전자우편을 통하여 하실 수 있으며, 
              회사는 이에 대해 지체없이 조치하겠습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              7. 개인정보의 안전성 확보조치
            </h2>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• 관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</li>
              <li>• 기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
              <li>• 물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              8. 개인정보보호책임자
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">
                개인정보보호책임자: 블로그치트키 운영팀<br/>
                연락처: support@blogcheatkey.com<br/>
                개인정보보호 담당부서: 운영팀
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              9. 개인정보처리방침의 변경
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 
              변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              10. 개인정보의 열람청구
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              정보주체는 개인정보보호법 제35조에 따른 개인정보의 열람 청구를 개인정보보호책임자에게 할 수 있습니다. 
              회사는 정보주체의 개인정보 열람청구가 신속하게 처리되도록 노력하겠습니다.
            </p>
          </section>

          <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              본 방침은 2025년 1월 16일부터 시행됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}