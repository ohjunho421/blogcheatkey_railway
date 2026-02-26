import { useLocation } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PaymentModal from "@/components/PaymentModal";
import {
  ArrowLeft,
  Zap,
  Crown,
  Check,
  X as XIcon,
  ShieldCheck,
  CreditCard,
  RefreshCcw,
  Star,
  TrendingUp,
} from "lucide-react";
import { Link } from "wouter";

// ─── Feature comparison data ──────────────────────────────────────────────────
const comparisonRows: {
  feature: string;
  basic: boolean | string;
  premium: boolean | string;
}[] = [
  { feature: "AI 키워드 분석 (Gemini 2.5 Pro)", basic: true, premium: true },
  { feature: "SEO 최적화 콘텐츠 자동 생성", basic: true, premium: true },
  { feature: "형태소 15-17회 정확 출현", basic: true, premium: true },
  { feature: "1,700-2,000자 자동 조절", basic: true, premium: true },
  { feature: "Perplexity 실시간 연구 데이터", basic: true, premium: true },
  { feature: "모바일 최적화 포맷팅", basic: true, premium: true },
  { feature: "세션 저장 및 불러오기", basic: true, premium: true },
  { feature: "AI 챗봇 편집 (Claude)", basic: false, premium: true },
  { feature: "SSR 평가 기반 제목 추천", basic: false, premium: true },
  { feature: "톤앤매너 조정", basic: false, premium: true },
  { feature: "설득력 / 가독성 최적화", basic: false, premium: true },
  { feature: "실시간 SEO 재검증", basic: false, premium: true },
];

// ─── FAQ data ─────────────────────────────────────────────────────────────────
const faqs = [
  {
    value: "faq-1",
    question: "무료 체험은 어떻게 진행되나요?",
    answer:
      "회원가입 후 별도의 신용카드 등록 없이 블로그 콘텐츠 생성을 3회 무료로 이용하실 수 있습니다. 무료 체험 종료 후 원하시는 요금제로 전환하시면 됩니다.",
  },
  {
    value: "faq-2",
    question: "결제는 어떻게 이루어지나요?",
    answer:
      "포트원(PortOne)을 통해 안전하게 월 구독 결제가 이루어집니다. 카드, 계좌이체, 간편결제를 모두 지원하며 매월 자동 청구됩니다.",
  },
  {
    value: "faq-3",
    question: "언제든지 해지할 수 있나요?",
    answer:
      "네, 언제든지 구독을 해지하실 수 있습니다. 해지 후에는 남은 구독 기간 동안 서비스를 계속 이용하실 수 있으며, 추가 청구는 발생하지 않습니다.",
  },
  {
    value: "faq-4",
    question: "베이직에서 프리미엄으로 업그레이드하면 어떻게 되나요?",
    answer:
      "업그레이드 시 남은 기간의 차액이 정산되며, 즉시 프리미엄 기능을 이용하실 수 있습니다. 이미 생성된 콘텐츠와 세션은 모두 유지됩니다.",
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PricingPage() {
  const [, navigate] = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const fadeUpInView = (delay = 0) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { delay, duration: 0.6 },
        };

  return (
    <div className="min-h-screen bg-background" itemScope itemType="https://schema.org/WebPage">
      {/* Skip link */}
      <a
        href="#pricing-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-[100]"
      >
        메인 콘텐츠로 건너뛰기
      </a>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50"
        role="banner"
      >
        <div className="container px-4 mx-auto">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
                aria-label="메인 페이지로 돌아가기"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                메인으로 돌아가기
              </Button>
            </Link>

            <a href="/" className="flex items-center gap-2" aria-label="블로그치트키 홈으로 이동">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                블로그치트키
              </span>
            </a>

            <Button
              onClick={() => navigate("/login")}
              className="bg-primary hover:bg-primary/90 shadow-sm transition-all duration-200 hover:scale-105"
              aria-label="무료로 시작하기"
            >
              <Zap className="w-4 h-4 mr-2" aria-hidden="true" />
              무료로 시작하기
            </Button>
          </div>
        </div>
      </header>

      <main id="pricing-main" role="main">
        {/* ── Hero ── */}
        <section
          className="relative py-20 overflow-hidden"
          aria-labelledby="pricing-hero-heading"
          style={{
            background:
              "linear-gradient(135deg, hsl(210,40%,98%) 0%, hsl(215,80%,96%) 40%, hsl(255,60%,97%) 100%)",
          }}
        >
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl" />
          </div>

          <div className="container relative z-10 px-4 mx-auto text-center">
            <motion.div
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, scale: 0.9 },
                    animate: { opacity: 1, scale: 1 },
                    transition: { duration: 0.5 },
                  })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 mb-6"
            >
              <Star className="w-4 h-4 fill-orange-500 text-orange-500" aria-hidden="true" />
              <span className="text-sm font-medium">대행업체보다 최대 83% 저렴</span>
            </motion.div>

            <motion.h1
              id="pricing-hero-heading"
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: 0.15, duration: 0.7 },
                  })}
              className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground"
            >
              합리적인 요금제로{" "}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                시작하세요
              </span>
            </motion.h1>

            <motion.p
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 16 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: 0.3, duration: 0.7 },
                  })}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            >
              키워드 하나면 3분 만에 완성되는 SEO 블로그 콘텐츠.
              <br className="hidden sm:block" />
              무료 체험 3회로 직접 확인해 보세요.
            </motion.p>

            {/* Trust badge row */}
            <motion.div
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 12 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: 0.45, duration: 0.6 },
                  })}
              className="flex flex-wrap gap-3 justify-center"
            >
              {[
                "무료 체험 3회 제공",
                "신용카드 불필요",
                "언제든 해지 가능",
                "안전한 포트원 결제",
              ].map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/80 border border-border/60 text-xs font-medium text-muted-foreground backdrop-blur shadow-sm"
                >
                  <Check
                    className="w-3.5 h-3.5 text-primary flex-shrink-0"
                    aria-hidden="true"
                  />
                  {badge}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Cost Comparison ── */}
        <section className="py-16 bg-background" aria-label="대행업체 대비 비용 비교">
          <div className="container px-4 mx-auto">
            <motion.div
              {...fadeUpInView(0)}
              className="max-w-2xl mx-auto p-7 rounded-2xl bg-card border border-border/50 shadow-sm"
            >
              <h2 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-6">
                대행업체 대비 비용 비교
              </h2>
              <div className="space-y-5">
                {/* Agency */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-muted-foreground">블로그 대행업체</span>
                    <span className="font-bold text-muted-foreground">₩300,000+ / 월</span>
                  </div>
                  <div className="h-9 rounded-xl bg-muted/60 border border-border/40 overflow-hidden">
                    <motion.div
                      className="h-full rounded-xl bg-gradient-to-r from-muted-foreground/25 to-muted-foreground/15 flex items-center px-4"
                      style={{ width: "100%" }}
                      {...(prefersReducedMotion
                        ? {}
                        : {
                            initial: { width: 0 },
                            whileInView: { width: "100%" },
                            viewport: { once: true },
                            transition: { delay: 0.3, duration: 0.9, ease: "easeOut" },
                          })}
                    >
                      <span className="text-xs text-muted-foreground font-medium ml-auto pr-2">
                        사기 위험 + 불투명한 과정
                      </span>
                    </motion.div>
                  </div>
                </div>

                {/* Basic */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-foreground">블로그치트키 베이직</span>
                    <span className="font-bold text-primary">₩20,000 / 월</span>
                  </div>
                  <div className="h-9 rounded-xl bg-primary/8 border border-primary/20 overflow-hidden">
                    <motion.div
                      className="h-full rounded-xl bg-gradient-to-r from-primary/60 to-primary flex items-center"
                      style={{ width: "7%" }}
                      {...(prefersReducedMotion
                        ? {}
                        : {
                            initial: { width: 0 },
                            whileInView: { width: "7%" },
                            viewport: { once: true },
                            transition: { delay: 0.5, duration: 0.7, ease: "easeOut" },
                          })}
                    />
                  </div>
                </div>

                {/* Premium */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-foreground">블로그치트키 프리미엄</span>
                    <span className="font-bold text-primary">₩50,000 / 월</span>
                  </div>
                  <div className="h-9 rounded-xl bg-primary/8 border border-primary/20 overflow-hidden">
                    <motion.div
                      className="h-full rounded-xl bg-gradient-to-r from-primary to-purple-500 flex items-center justify-end pr-3"
                      style={{ width: "17%" }}
                      {...(prefersReducedMotion
                        ? {}
                        : {
                            initial: { width: 0 },
                            whileInView: { width: "17%" },
                            viewport: { once: true },
                            transition: { delay: 0.6, duration: 0.7, ease: "easeOut" },
                          })}
                    >
                      <span className="text-xs text-white font-bold whitespace-nowrap">
                        83% 저렴
                      </span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Pricing Cards ── */}
        <section
          id="plans"
          className="py-16 bg-muted/30"
          aria-labelledby="plans-heading"
        >
          <div className="container px-4 mx-auto">
            <motion.div
              {...fadeUpInView(0)}
              className="text-center mb-12"
            >
              <h2
                id="plans-heading"
                className="text-3xl md:text-4xl font-bold mb-3"
              >
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  요금제 선택
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">
                지금 바로 무료 체험으로 시작하세요
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Basic Plan */}
              <motion.div
                {...(prefersReducedMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 24 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true },
                      transition: { delay: 0.1, duration: 0.6 },
                      whileHover: { y: -6 },
                    })}
                className="flex flex-col p-8 rounded-2xl bg-card border border-border/50 hover:shadow-xl transition-all duration-250"
              >
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-muted text-muted-foreground">
                    <Zap className="w-7 h-7" aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">베이직</h3>
                  <p className="text-muted-foreground text-sm mb-5">
                    SEO 최적화 콘텐츠 생성의 시작
                  </p>
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-5xl font-bold text-foreground">20,000</span>
                    <span className="text-muted-foreground mb-1.5 text-lg">원/월</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    무료 체험 3회 포함
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "AI 키워드 분석",
                    "SEO 최적화 콘텐츠 생성",
                    "Perplexity 실시간 데이터",
                    "모바일 최적화 포맷팅",
                    "세션 저장 및 불러오기",
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-primary/10 text-primary flex-shrink-0">
                        <Check className="w-3 h-3" aria-hidden="true" />
                      </div>
                      <span className="text-foreground text-sm">{feat}</span>
                    </li>
                  ))}
                </ul>

                <PaymentModal>
                  <Button
                    variant="outline"
                    className="w-full py-6 text-base font-semibold transition-all duration-200 hover:scale-[1.02] hover:bg-muted cursor-pointer"
                    aria-label="베이직 플랜 구독 시작"
                  >
                    베이직 시작하기
                  </Button>
                </PaymentModal>
              </motion.div>

              {/* Premium Plan */}
              <motion.div
                {...(prefersReducedMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 24 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true },
                      transition: { delay: 0.2, duration: 0.6 },
                      whileHover: { y: -6 },
                    })}
                className="relative flex flex-col p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border-2 border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-250"
              >
                {/* Popular badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2" aria-label="인기 요금제">
                  <span className="px-5 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/30">
                    인기
                  </span>
                </div>

                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-primary/20 text-primary">
                    <Crown className="w-7 h-7" aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">프리미엄</h3>
                  <p className="text-muted-foreground text-sm mb-5">
                    AI 챗봇 편집으로 완벽한 콘텐츠
                  </p>
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-5xl font-bold text-primary">50,000</span>
                    <span className="text-muted-foreground mb-1.5 text-lg">원/월</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    무료 체험 3회 포함
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "베이직의 모든 기능 포함",
                    "AI 챗봇 편집 (Claude)",
                    "SSR 평가 기반 제목 추천",
                    "톤앤매너 조정",
                    "설득력 / 가독성 최적화",
                    "실시간 SEO 재검증",
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-primary/20 text-primary flex-shrink-0">
                        <Check className="w-3 h-3" aria-hidden="true" />
                      </div>
                      <span className="text-foreground text-sm">{feat}</span>
                    </li>
                  ))}
                </ul>

                <PaymentModal>
                  <Button
                    className="w-full py-6 text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                    aria-label="프리미엄 플랜 구독 시작"
                  >
                    <Crown className="w-4 h-4 mr-2" aria-hidden="true" />
                    프리미엄 시작하기
                  </Button>
                </PaymentModal>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Feature Comparison Table ── */}
        <section
          className="py-16 bg-background"
          aria-labelledby="comparison-heading"
        >
          <div className="container px-4 mx-auto">
            <motion.div {...fadeUpInView(0)} className="text-center mb-10">
              <h2
                id="comparison-heading"
                className="text-3xl font-bold mb-3 text-foreground"
              >
                요금제 상세 비교
              </h2>
              <p className="text-muted-foreground">
                두 요금제의 기능 차이를 한눈에 확인하세요
              </p>
            </motion.div>

            <motion.div
              {...fadeUpInView(0.1)}
              className="max-w-3xl mx-auto rounded-2xl bg-card border border-border/50 overflow-hidden shadow-sm"
              role="table"
              aria-label="요금제 기능 비교표"
            >
              {/* Table header */}
              <div
                className="grid grid-cols-3 bg-muted/50 border-b border-border/50 px-6 py-4"
                role="row"
              >
                <div role="columnheader" className="text-sm font-semibold text-muted-foreground">
                  기능
                </div>
                <div
                  role="columnheader"
                  className="text-sm font-semibold text-center text-muted-foreground"
                >
                  베이직
                </div>
                <div
                  role="columnheader"
                  className="text-sm font-semibold text-center text-primary"
                >
                  프리미엄
                </div>
              </div>

              {/* Table rows */}
              {comparisonRows.map((row, index) => (
                <motion.div
                  key={index}
                  {...(prefersReducedMotion
                    ? {}
                    : {
                        initial: { opacity: 0, x: -8 },
                        whileInView: { opacity: 1, x: 0 },
                        viewport: { once: true },
                        transition: { delay: index * 0.04, duration: 0.4 },
                      })}
                  className={`grid grid-cols-3 px-6 py-3.5 border-b border-border/30 last:border-b-0 ${
                    index % 2 === 0 ? "bg-background" : "bg-muted/20"
                  }`}
                  role="row"
                >
                  <div
                    role="cell"
                    className="text-sm text-foreground flex items-center"
                  >
                    {row.feature}
                  </div>
                  <div role="cell" className="flex items-center justify-center">
                    {row.basic === true ? (
                      <Check
                        className="w-5 h-5 text-primary"
                        aria-label="포함"
                      />
                    ) : typeof row.basic === "string" ? (
                      <span className="text-xs text-primary font-medium">
                        {row.basic}
                      </span>
                    ) : (
                      <XIcon
                        className="w-4 h-4 text-muted-foreground/40"
                        aria-label="미포함"
                      />
                    )}
                  </div>
                  <div role="cell" className="flex items-center justify-center">
                    {row.premium === true ? (
                      <Check
                        className="w-5 h-5 text-primary"
                        aria-label="포함"
                      />
                    ) : typeof row.premium === "string" ? (
                      <span className="text-xs text-primary font-medium">
                        {row.premium}
                      </span>
                    ) : (
                      <XIcon
                        className="w-4 h-4 text-muted-foreground/40"
                        aria-label="미포함"
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Trust Indicators ── */}
        <section className="py-16 bg-muted/30" aria-labelledby="trust-heading">
          <div className="container px-4 mx-auto">
            <motion.div {...fadeUpInView(0)} className="text-center mb-10">
              <h2
                id="trust-heading"
                className="text-2xl font-bold text-foreground mb-2"
              >
                안심하고 시작하세요
              </h2>
              <p className="text-muted-foreground">
                투명하고 유연한 구독 정책을 운영합니다
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                {
                  icon: Zap,
                  title: "무료 체험 3회",
                  description:
                    "신용카드 없이 회원가입만으로 3회 무료 체험. 직접 사용해 보고 결정하세요.",
                  color: "bg-primary/10 text-primary",
                },
                {
                  icon: ShieldCheck,
                  title: "안전한 결제",
                  description:
                    "포트원(PortOne)을 통한 PCI-DSS 인증 결제. 카드, 계좌이체, 간편결제 지원.",
                  color: "bg-green-500/10 text-green-600",
                },
                {
                  icon: RefreshCcw,
                  title: "언제든 해지 가능",
                  description:
                    "약정 없는 월 단위 구독. 언제든 해지해도 남은 기간은 계속 이용 가능.",
                  color: "bg-purple-500/10 text-purple-600",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  {...(prefersReducedMotion
                    ? {}
                    : {
                        initial: { opacity: 0, y: 20 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: true },
                        transition: { delay: index * 0.12, duration: 0.55 },
                        whileHover: { y: -4 },
                      })}
                  className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/50 hover:shadow-lg transition-all duration-200"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${item.color}`}
                  >
                    <item.icon className="w-7 h-7" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section
          id="faq"
          className="py-16 bg-background"
          aria-labelledby="pricing-faq-heading"
        >
          <div className="container px-4 mx-auto">
            <motion.div {...fadeUpInView(0)} className="text-center mb-10">
              <h2
                id="pricing-faq-heading"
                className="text-3xl font-bold mb-3"
              >
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  자주 묻는 질문
                </span>
              </h2>
              <p className="text-muted-foreground">
                결제와 요금제에 대해 궁금한 점을 확인하세요
              </p>
            </motion.div>

            <motion.div
              {...fadeUpInView(0.1)}
              className="max-w-2xl mx-auto"
            >
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq) => (
                  <AccordionItem
                    key={faq.value}
                    value={faq.value}
                    className="rounded-2xl bg-card border border-border/50 px-6 hover:border-primary/20 transition-all duration-200 data-[state=open]:border-primary/30 data-[state=open]:shadow-sm"
                  >
                    <AccordionTrigger className="text-base font-semibold text-foreground hover:no-underline py-5 text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5">
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        {faq.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-20 bg-muted/30" aria-labelledby="pricing-cta-heading">
          <div className="container px-4 mx-auto text-center">
            <motion.div
              {...fadeUpInView(0)}
              className="max-w-2xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
                <TrendingUp className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm font-medium">지금 시작하면 오늘부터 콘텐츠 생성 가능</span>
              </div>

              <h2
                id="pricing-cta-heading"
                className="text-3xl md:text-4xl font-bold mb-4 text-foreground"
              >
                블로그 마케팅,{" "}
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  오늘부터 직접 하세요
                </span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                SEO 공부할 시간도 없고, 대행업체 맡기기도 불안하셨죠?
                <br className="hidden sm:block" />
                블로그치트키로 직접 3분이면 충분합니다.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => navigate("/login")}
                  className="text-lg px-8 py-6 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 transition-all duration-200 hover:scale-105 cursor-pointer"
                  aria-label="무료 체험 시작하기"
                >
                  <Zap className="w-5 h-5 mr-2" aria-hidden="true" />
                  무료 체험 시작하기
                </Button>

                <PaymentModal>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6 border-border hover:bg-muted/50 transition-all duration-200 cursor-pointer"
                    aria-label="바로 결제하기"
                  >
                    <CreditCard className="w-5 h-5 mr-2" aria-hidden="true" />
                    바로 결제하기
                  </Button>
                </PaymentModal>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer
        className="bg-gradient-to-b from-muted/30 to-background border-t border-border/50 py-10"
        role="contentinfo"
      >
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <a href="/" aria-label="블로그치트키 홈으로 이동">
                  <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    블로그치트키
                  </span>
                </a>
                <p className="text-sm text-muted-foreground mt-3 max-w-xs">
                  자영업자를 위한 AI 블로그 마케팅 솔루션.
                  키워드 하나로 SEO 최적화 블로그 3분 완성.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">사업자 정보</h3>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p><span className="font-medium text-foreground/70">상호명:</span> 블로그치트키</p>
                  <p><span className="font-medium text-foreground/70">사업자번호:</span> 456-05-03530</p>
                  <p><span className="font-medium text-foreground/70">대표자:</span> 오준호</p>
                  <p><span className="font-medium text-foreground/70">연락처:</span> 010-5001-2143</p>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-xs text-muted-foreground">
                © 2026 블로그치트키. All rights reserved.
              </p>
              <a
                href="/privacy-policy"
                className="text-xs text-muted-foreground hover:text-foreground underline transition-colors duration-150"
              >
                개인정보처리방침
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
