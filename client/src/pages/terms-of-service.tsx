import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
            운영방침 (이용약관)
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            최종 업데이트: 2025년 3월 3일
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 space-y-8">

          {/* 제1조 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              제1조 (목적)
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              이 약관은 블로그치트키(이하 "회사")가 제공하는 AI 기반 블로그 콘텐츠 생성 서비스(이하 "서비스")의
              이용 조건 및 절차, 회사와 회원 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          {/* 제2조 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              제2조 (용어의 정의)
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>
                <span className="font-medium">① "서비스"</span>란 회사가 제공하는 AI 기반 블로그 콘텐츠 생성,
                키워드 분석, AI 이미지 생성, 콘텐츠 편집 챗봇 등 일체의 서비스를 의미합니다.
              </li>
              <li>
                <span className="font-medium">② "회원"</span>이란 이 약관에 동의하고 회원가입을 완료한 자를 의미합니다.
              </li>
              <li>
                <span className="font-medium">③ "크레딧"</span>이란 서비스 내에서 각종 기능을 이용하기 위한
                가상의 사용 단위를 의미합니다.
              </li>
              <li>
                <span className="font-medium">④ "생성 콘텐츠"</span>란 회원의 요청에 따라 AI가 생성한 블로그 글,
                이미지, 키워드 분석 결과물 등을 의미합니다.
              </li>
              <li>
                <span className="font-medium">⑤ "계정"</span>이란 회원이 서비스에 접근하기 위해 사용하는
                이메일 주소와 비밀번호의 조합을 의미합니다.
              </li>
            </ul>
          </section>

          {/* 제3조 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              제3조 (약관의 효력 및 변경)
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>① 이 약관은 서비스 화면에 게시하거나 기타 방법으로 공지함으로써 효력이 발생합니다.</li>
              <li>
                ② 회사는 합리적인 사유가 발생할 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내
                공지사항을 통해 공지합니다. 변경 약관은 공지 후 7일이 경과하면 효력이 발생합니다.
              </li>
              <li>
                ③ 회원이 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.
                변경 공지 후 7일 이내에 거부 의사를 표명하지 않으면 약관에 동의한 것으로 간주합니다.
              </li>
            </ul>
          </section>

          {/* 제4조 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              제4조 (서비스의 제공 및 변경)
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>
                ① 회사는 다음 서비스를 제공합니다.
                <ul className="mt-2 ml-4 space-y-1">
                  <li>• SEO 최적화 블로그 콘텐츠 자동 생성</li>
                  <li>• AI 기반 키워드 분석 및 추천</li>
                  <li>• AI 이미지 생성</li>
                  <li>• 콘텐츠 편집 챗봇</li>
                  <li>• 기타 회사가 추가로 개발하거나 제휴를 통해 제공하는 서비스</li>
                </ul>
              </li>
              <li>
                ② 서비스는 연중무휴 24시간 제공을 원칙으로 합니다. 단, 시스템 점검·업그레이드·장애 등의
                사유로 서비스가 일시 중단될 수 있으며, 이 경우 사전 공지합니다.
              </li>
              <li>
                ③ 회사는 서비스의 내용, 기능, 이용 조건 등을 변경할 수 있으며, 변경 사항은 공지사항을 통해 안내합니다.
              </li>
            </ul>
          </section>

          {/* 제5조 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              제5조 (회원가입 및 계정 관리)
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>① 회원가입은 이 약관에 동의하고 가입 신청서를 작성하여 제출함으로써 완료됩니다.</li>
              <li>② 회원은 정확하고 최신의 정보를 제공해야 하며, 허위 정보 제공으로 인한 불이익은 회원 본인이 부담합니다.</li>
              <li>③ 계정의 관리 책임은 회원에게 있으며, 제3자의 무단 이용으로 인한 손해에 대해 회사는 책임을 지지 않습니다.</li>
              <li>④ 계정 도용이나 보안 침해가 발생한 경우 즉시 회사에 신고해야 합니다.</li>
              <li>
                ⑤ 다음에 해당하는 경우 가입 신청을 거절할 수 있습니다.
                <ul className="mt-2 ml-4 space-y-1">
                  <li>• 실명이 아닌 명의로 신청한 경우</li>
                  <li>• 타인의 정보를 도용한 경우</li>
                  <li>• 이전에 이용약관 위반으로 이용이 제한된 경우</li>
                </ul>
              </li>
            </ul>
          </section>

          {/* 제6조 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              제6조 (이용 요금 및 결제)
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>① 서비스는 무료 체험과 유료 크레딧으로 구성됩니다. 무료 체험 횟수는 회사의 정책에 따라 변경될 수 있습니다.</li>
              <li>
                ② 유료 크레딧 구매는 회사가 지정한 결제 수단을 통해 이루어집니다.
                <ul className="mt-2 ml-4 space-y-1">
                  <li>• 무통장 입금: 카카오뱅크 3333-17-9948665 (예금주: 블로그치트키)</li>
                  <li>• 입금 확인 후 크레딧이 지급됩니다. 입금 후 연락처(010-5001-2143)로 연락 바랍니다.</li>
                </ul>
              </li>
              <li>③ 결제 금액과 크레딧 수량은 서비스 내 요금 안내 페이지에서 확인할 수 있으며, 변경 시 사전 공지합니다.</li>
              <li>④ 크레딧은 구매일로부터 30일간 유효하며, 유효기간 경과 후 소멸됩니다.</li>
            </ul>
          </section>

          {/* 제7조 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              제7조 (환불 정책)
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>① 구매한 크레딧 중 미사용 크레딧에 한하여 환불 신청이 가능합니다.</li>
              <li>
                ② 환불 요청은 구매 후 7일 이내에 연락처(010-5001-2143) 또는 이메일을 통해 신청해야 합니다.
              </li>
              <li>
                ③ 다음의 경우 환불이 제한될 수 있습니다.
                <ul className="mt-2 ml-4 space-y-1">
                  <li>• 크레딧을 일부 사용한 경우 미사용분에 대해서만 환불</li>
                  <li>• 이벤트, 할인 등을 통해 지급된 무상 크레딧</li>
                  <li>• 회원의 약관 위반으로 서비스 이용이 제한된 경우</li>
                </ul>
              </li>
              <li>④ 환불은 신청 후 영업일 기준 5일 이내에 처리됩니다.</li>
            </ul>
          </section>

          {/* 제8조 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              제8조 (AI 생성 콘텐츠의 저작권 및 이용)
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>
                ① 서비스를 통해 생성된 콘텐츠(블로그 글, 이미지 등)에 대한 이용 권한은 해당 크레딧을 소비한
                회원에게 귀속됩니다. 회원은 이를 상업적 목적을 포함하여 자유롭게 이용할 수 있습니다.
              </li>
              <li>
                ② 단, AI가 생성한 콘텐츠는 제3자의 저작물을 학습 데이터로 활용하여 생성될 수 있으므로,
                생성 콘텐츠를 외부에 게시하거나 상업적으로 활용할 경우 저작권 침해 여부는 회원 본인이
                확인할 책임이 있습니다.
              </li>
              <li>
                ③ 회사는 서비스 개선 및 품질 향상을 위해 익명화된 형태로 생성 콘텐츠 데이터를 분석할 수 있습니다.
              </li>
              <li>
                ④ 회원은 서비스를 통해 생성된 콘텐츠를 다음의 목적으로 사용할 수 없습니다.
                <ul className="mt-2 ml-4 space-y-1">
                  <li>• 타인을 비방하거나 명예를 훼손하는 내용</li>
                  <li>• 허위 정보, 스팸, 사기 목적의 콘텐츠</li>
                  <li>• 법령에 위반되는 내용</li>
                </ul>
              </li>
            </ul>
          </section>

          {/* 제9조 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              제9조 (회원의 의무 및 금지 행위)
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>① 회원은 서비스를 이용함에 있어 다음 행위를 하여서는 안 됩니다.</li>
              <ul className="ml-4 space-y-1">
                <li>• 타인의 계정을 무단으로 사용하거나 계정 정보를 공유하는 행위</li>
                <li>• 서비스를 자동화된 방법(봇, 스크립트 등)으로 대량 이용하는 행위</li>
                <li>• 서비스의 정상적인 운영을 방해하는 행위</li>
                <li>• 회사의 지식재산권을 침해하는 행위</li>
                <li>• 불법적인 목적으로 서비스를 이용하는 행위</li>
                <li>• 타인에게 불법적인 피해를 줄 수 있는 콘텐츠를 생성하는 행위</li>
                <li>• 음란물, 혐오 표현, 폭력적인 콘텐츠를 생성·유포하는 행위</li>
              </ul>
              <li>② 위 금지 행위 적발 시 사전 통지 없이 서비스 이용이 제한될 수 있습니다.</li>
            </ul>
          </section>

          {/* 제10조 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              제10조 (서비스 이용 제한 및 회원 탈퇴)
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>
                ① 회사는 회원이 약관을 위반하거나 서비스의 정상적인 운영을 방해한 경우 서비스 이용을
                제한하거나 계정을 해지할 수 있습니다.
              </li>
              <li>
                ② 회원은 언제든지 서비스 내 탈퇴 기능을 통해 탈퇴를 신청할 수 있습니다.
                탈퇴 시 미사용 크레딧은 환불 정책(제7조)에 따라 처리됩니다.
              </li>
              <li>
                ③ 탈퇴 시 회원 정보 및 생성 콘텐츠 이력은 관련 법령에서 정한 기간 동안 보관 후 삭제됩니다.
              </li>
            </ul>
          </section>

          {/* 제11조 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              제11조 (면책조항)
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>
                ① 회사는 AI가 생성한 콘텐츠의 정확성, 완전성, 적합성에 대해 보증하지 않습니다.
                생성된 콘텐츠를 활용하기 전에 내용의 정확성을 반드시 검토하시기 바랍니다.
              </li>
              <li>
                ② 천재지변, 전쟁, 테러, 해킹, 인터넷 서비스 장애 등 불가항력적 사유로 서비스 제공이
                불가능한 경우 회사는 책임을 지지 않습니다.
              </li>
              <li>
                ③ 회원이 서비스를 통해 생성·게시한 콘텐츠로 인한 제3자와의 분쟁에 대해 회사는
                책임을 지지 않습니다.
              </li>
              <li>
                ④ 회사는 회원 간 또는 회원과 제3자 사이에 발생한 분쟁에 개입하지 않습니다.
              </li>
            </ul>
          </section>

          {/* 제12조 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              제12조 (손해배상)
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>
                ① 회사의 귀책사유로 회원에게 손해가 발생한 경우 회사는 실제 발생한 손해를 배상합니다.
                단, 회사의 고의 또는 중과실이 없는 경우 배상 범위는 회원이 해당 기간 내 실제 결제한
                금액을 초과하지 않습니다.
              </li>
              <li>
                ② 회원의 약관 위반 또는 불법 행위로 회사에 손해가 발생한 경우 회원은 이를 배상해야 합니다.
              </li>
            </ul>
          </section>

          {/* 제13조 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              제13조 (분쟁 해결 및 관할)
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>
                ① 서비스 이용과 관련하여 분쟁이 발생한 경우 회사와 회원은 분쟁을 원만하게 해결하기 위해
                성실히 협의합니다.
              </li>
              <li>
                ② 협의로 해결되지 않는 분쟁은 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라
                소비자분쟁조정위원회 등에 조정을 신청할 수 있습니다.
              </li>
              <li>
                ③ 이 약관과 관련한 소송의 관할 법원은 회사 소재지를 관할하는 법원으로 합니다.
              </li>
              <li>④ 이 약관에 관한 준거법은 대한민국 법률로 합니다.</li>
            </ul>
          </section>

          {/* 부칙 */}
          <section className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              부칙
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              이 약관은 2025년 3월 3일부터 시행합니다.
            </p>
          </section>

          {/* 사업자 정보 */}
          <section className="border-t border-gray-200 dark:border-gray-600 pt-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
              사업자 정보
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>상호명: 블로그치트키</p>
              <p>대표자: 오준호</p>
              <p>사업자등록번호: 456-05-03530</p>
              <p>사업장 소재지: 경기도 의정부시 안말로 85번길 27-1</p>
              <p>연락처: 010-5001-2143</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
