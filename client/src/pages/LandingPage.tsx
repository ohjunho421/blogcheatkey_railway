import { useState, useEffect, useRef } from "react";
import blogCheatKeyLogo from "@assets/blogcheatkey-logo.png";
import { useLocation } from "wouter";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Zap,
  Sparkles,
  Clock,
  Search,
  FileText,
  BarChart3,
  MessageSquare,
  Smartphone,
  Check,
  Menu,
  X,
  AlertTriangle,
  XCircle,
  Store,
  Users,
  ShieldCheck,
  TrendingUp,
  Crown,
  Keyboard,
  Brain,
  Database,
  Briefcase,
  Copy,
  Bot,
  Save,
  Wrench,
  Building2,
  Star,
  Quote,
} from "lucide-react";

// Animated counter hook
function useCountUp(target: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView) return;
    if (target <= 0) { setCount(target); return; }
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return { count, ref };
}

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const fadeUp = (delay = 0) =>
    prefersReducedMotion
      ? {}
      : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.8 } };

  const fadeUpInView = (delay = 0) =>
    prefersReducedMotion
      ? {}
      : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay, duration: 0.6 } };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background" itemScope itemType="https://schema.org/WebPage">
      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-[100]">
        메인 콘텐츠로 건너뛰기
      </a>
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-200 bg-background/80 backdrop-blur-md border-b border-border/50" role="banner">
        <div className="container px-4 mx-auto">
          <div className="flex items-center justify-between h-16 md:h-20">
            <a href="/" className="flex items-center gap-2" aria-label="블로그치트키 홈으로 이동">
              <img
                src={blogCheatKeyLogo}
                alt="블로그치트키 로고"
                className="h-8 w-auto object-contain"
              />
            </a>
            
            <nav className="hidden md:flex items-center gap-8" role="navigation" aria-label="메인 네비게이션">
              <button 
                onClick={() => scrollToSection("pain-points")} 
                className="text-muted-foreground hover:text-foreground transition-colors duration-150"
                aria-label="자영업자 고민 섹션으로 이동"
              >
                자영업자 고민
              </button>
              <button 
                onClick={() => scrollToSection("features")} 
                className="text-muted-foreground hover:text-foreground transition-colors duration-150"
                aria-label="기능 섹션으로 이동"
              >
                기능
              </button>
              <button 
                onClick={() => scrollToSection("pricing")} 
                className="text-muted-foreground hover:text-foreground transition-colors duration-150"
                aria-label="요금제 섹션으로 이동"
              >
                요금제
              </button>
              <button 
                onClick={() => scrollToSection("faq")} 
                className="text-muted-foreground hover:text-foreground transition-colors duration-150"
                aria-label="자주 묻는 질문 섹션으로 이동"
              >
                FAQ
              </button>
              <Button 
                onClick={() => navigate("/login")}
                className="bg-primary hover:bg-primary/90 shadow-lg transition-all duration-200 hover:scale-105"
                aria-label="무료로 시작하기 - 로그인 페이지로 이동"
              >
                <Zap className="w-4 h-4 mr-2" aria-hidden="true" />
                무료로 시작하기
              </Button>
            </nav>

            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav id="mobile-menu" className="md:hidden bg-background border-t border-border/50" role="navigation" aria-label="모바일 네비게이션">
            <div className="container px-4 py-4 flex flex-col gap-4">
              <button 
                onClick={() => scrollToSection("pain-points")} 
                className="text-left text-muted-foreground hover:text-foreground transition-colors duration-150 py-2"
              >
                자영업자 고민
              </button>
              <button 
                onClick={() => scrollToSection("features")} 
                className="text-left text-muted-foreground hover:text-foreground transition-colors duration-150 py-2"
              >
                기능
              </button>
              <button 
                onClick={() => scrollToSection("pricing")} 
                className="text-left text-muted-foreground hover:text-foreground transition-colors duration-150 py-2"
              >
                요금제
              </button>
              <button 
                onClick={() => scrollToSection("faq")} 
                className="text-left text-muted-foreground hover:text-foreground transition-colors duration-150 py-2"
              >
                FAQ
              </button>
              <Button 
                onClick={() => navigate("/login")}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Zap className="w-4 h-4 mr-2" aria-hidden="true" />
                무료로 시작하기
              </Button>
            </div>
          </nav>
        )}
      </header>

      <main id="main-content" role="main">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden" aria-labelledby="hero-heading" style={{ background: "linear-gradient(135deg, hsl(210,40%,98%) 0%, hsl(215,80%,96%) 35%, hsl(255,60%,97%) 65%, hsl(210,40%,98%) 100%)" }}>
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/4 rounded-full blur-3xl" />
            {/* Decorative grid */}
            <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "radial-gradient(circle, hsl(207,90%,54%) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          </div>

          <div className="container relative z-10 px-4 py-20 pt-32">
            <div className="max-w-5xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left: Copy */}
                <motion.div
                  {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8 } })}
                  className="text-left"
                >
                  {/* Badge */}
                  <motion.div
                    {...(prefersReducedMotion ? {} : { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { delay: 0.2, duration: 0.5 } })}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6"
                  >
                    <Store className="w-4 h-4" aria-hidden="true" />
                    <span className="text-sm font-medium">자영업자를 위한 AI 블로그 마케팅 솔루션</span>
                  </motion.div>

                  {/* Headline - H1 for SEO */}
                  <motion.h1
                    id="hero-heading"
                    {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3, duration: 0.8 } })}
                    className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-foreground leading-[1.1]"
                  >
                    AI 블로그 콘텐츠
                    <br />
                    <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                      자동 생성
                    </span>
                  </motion.h1>

                  {/* Sub-headline */}
                  <motion.p
                    {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.45, duration: 0.8 } })}
                    className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed"
                  >
                    SEO 몰라도 괜찮아요. 키워드 하나만 입력하면
                    {" "}<span className="text-primary font-semibold">상위노출 조건을 완벽히 충족</span>하는 글이
                    {" "}<span className="font-bold text-foreground">3분 만에</span> 완성됩니다.
                  </motion.p>

                  {/* CTA Buttons */}
                  <motion.div
                    {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.6, duration: 0.8 } })}
                    className="flex flex-col sm:flex-row gap-4 items-start"
                  >
                    <Button
                      size="lg"
                      onClick={() => navigate("/login")}
                      className="text-lg px-8 py-6 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/40 cursor-pointer"
                      aria-label="무료로 시작하기 - 로그인 페이지로 이동"
                    >
                      <Zap className="w-5 h-5 mr-2" aria-hidden="true" />
                      무료로 시작하기
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => scrollToSection("pain-points")}
                      className="text-lg px-8 py-6 border-border hover:bg-muted/50 transition-all duration-200 cursor-pointer"
                    >
                      이런 고민 있으신가요?
                    </Button>
                  </motion.div>

                  {/* Trust Badges */}
                  <motion.div
                    {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.75, duration: 0.6 } })}
                    className="flex flex-wrap gap-3 mt-5"
                  >
                    {[
                      { label: "무료 체험 3회 제공" },
                      { label: "신용카드 불필요" },
                      { label: "언제든 해지 가능" },
                    ].map((badge) => (
                      <span
                        key={badge.label}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/80 border border-border/60 text-xs font-medium text-muted-foreground backdrop-blur shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" aria-hidden="true" />
                        {badge.label}
                      </span>
                    ))}
                  </motion.div>
                </motion.div>

                {/* Right: Product Mockup */}
                <motion.div
                  {...(prefersReducedMotion ? {} : { initial: { opacity: 0, x: 30, y: 10 }, animate: { opacity: 1, x: 0, y: 0 }, transition: { delay: 0.5, duration: 0.9, ease: "easeOut" } })}
                  className="hidden lg:block"
                  aria-hidden="true"
                >
                  {/* Browser chrome frame */}
                  <div className="rounded-2xl overflow-hidden shadow-2xl shadow-primary/15 border border-border/60 bg-card">
                    {/* Browser top bar */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-muted/70 border-b border-border/50">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                        <div className="w-3 h-3 rounded-full bg-green-400/80" />
                      </div>
                      <div className="flex-1 mx-4 h-6 rounded-full bg-background/80 border border-border/50 flex items-center px-3">
                        <span className="text-xs text-muted-foreground truncate">blogcheatkey.com/generate</span>
                      </div>
                    </div>
                    {/* App UI mockup */}
                    <div className="p-5 bg-background space-y-4">
                      {/* Input row */}
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1.5">키워드 입력</div>
                        <div className="flex gap-2">
                          <div className="flex-1 h-9 rounded-lg bg-muted/60 border border-border/50 flex items-center px-3">
                            <span className="text-sm text-foreground/70">벤츠 엔진경고등 원인</span>
                          </div>
                          <div className="h-9 px-4 rounded-lg bg-primary flex items-center">
                            <Zap className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>AI 콘텐츠 생성 중...</span>
                          <span className="text-primary font-medium">87%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-primary to-purple-500" />
                        </div>
                      </div>
                      {/* Generated content preview */}
                      <div className="rounded-xl bg-muted/40 border border-border/40 p-4 space-y-2">
                        <div className="h-3 rounded-full bg-foreground/10 w-3/4" />
                        <div className="h-3 rounded-full bg-foreground/8 w-full" />
                        <div className="h-3 rounded-full bg-foreground/8 w-5/6" />
                        <div className="h-3 rounded-full bg-foreground/6 w-4/5" />
                        <div className="h-3 rounded-full bg-foreground/8 w-full" />
                        <div className="h-3 rounded-full bg-foreground/6 w-2/3" />
                      </div>
                      {/* SEO badges row */}
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { label: "SEO 최적화", color: "bg-primary/10 text-primary border-primary/20" },
                          { label: "형태소 17회", color: "bg-green-500/10 text-green-600 border-green-500/20" },
                          { label: "1,847자", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
                        ].map((b) => (
                          <span key={b.label} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${b.color}`}>{b.label}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Stats Cards - 자영업자 관점*/}
              <motion.div
                {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.9, duration: 0.8 } })}
                className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5"
              >
                {[
                  { icon: Clock, value: "98%", label: "글 작성 시간 단축 (6시간 → 3분)" },
                  { icon: ShieldCheck, value: "100%", label: "직접 생성 — 대행업체 사기 걱정 NO" },
                  { icon: TrendingUp, value: "SEO 자동", label: "전문지식 필요 없음" },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    {...(prefersReducedMotion ? {} : { whileHover: { scale: 1.04, y: -4 } })}
                    className="flex items-center gap-4 p-5 rounded-2xl bg-card/70 backdrop-blur border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <stat.icon className="w-6 h-6 text-primary" aria-hidden="true" />
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-sm text-muted-foreground leading-snug">{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pain Points Section - 자영업자의 현실 */}
        <section id="pain-points" className="py-24 bg-gradient-to-b from-background to-muted/30" aria-labelledby="pain-points-heading">
          <div className="container px-4 mx-auto">
            <motion.div
              {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } })}
              className="text-center mb-16"
            >
              <h2 id="pain-points-heading" className="text-3xl md:text-4xl font-bold mb-4">
                <span className="text-foreground">자영업자 블로그 마케팅, 이런 고민 있으신가요?</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                "블로그 상위노출이 중요하다는 건 알겠는데..."
              </p>
            </motion.div>

            {/* Pain Points Grid */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
              {[
                { icon: AlertTriangle, title: "SEO가 뭔지도 모르겠어요", description: "형태소 빈도? 키워드 최적화? 처음 듣는 용어뿐이에요" },
                { icon: Clock, title: "글 하나 쓰는데 6시간 이상", description: "본업하면서 이걸 언제 해요? 시간이 없어요" },
                { icon: XCircle, title: "대행업체 믿기 어려워요", description: "사기 당했다는 얘기도 많고, 효과도 의문이에요" },
                { icon: Users, title: "체험단 블로거와는 달라요", description: "우리는 직접 내 사업을 알려야 해요" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.02, y: -3 }}
                  className="p-6 rounded-2xl bg-card border border-border/50 hover:border-orange-500/30 hover:shadow-lg transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Comparison Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                  <XCircle className="w-4 h-4" />
                  블로그치트키는 체험단 서비스가 아닙니다
                </span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* 체험단 블로거 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="p-6 rounded-2xl bg-muted/50 border border-border/50"
                >
                  <h3 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    체험단 블로거
                  </h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground/50">•</span>
                      블로그 글쓰기가 <span className="font-medium">본업</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground/50">•</span>
                      SEO 노하우 보유
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground/50">•</span>
                      하루 여러 글 작성 가능
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground/50">•</span>
                      다양한 업체 홍보
                    </li>
                  </ul>
                </motion.div>

                {/* 자영업자 (우리의 고객) */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border-2 border-primary/30 shadow-lg shadow-primary/5"
                >
                  <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    자영업자 (우리의 고객)
                  </h3>
                  <ul className="space-y-3 text-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      블로그는 <span className="font-semibold text-primary">마케팅 수단</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      SEO? 그게 뭔데?
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      글 하나에 반나절
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="font-semibold text-primary">내 가게만</span> 알리고 싶음
                    </li>
                  </ul>
                </motion.div>
              </div>
            </motion.div>

            {/* Solution CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-16 text-center"
            >
              <div className="inline-block p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 shadow-xl shadow-primary/5">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                  블로그치트키가 해결합니다
                </h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  {[
                    { icon: Search, text: "SEO 몰라도 OK" },
                    { icon: Clock, text: "6시간 → 3분" },
                    { icon: ShieldCheck, text: "사기 걱정 NO" },
                    { icon: Store, text: "내 전문성 담기" },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-primary/10 text-primary border border-primary/20"
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
                <Button
                  size="lg"
                  onClick={() => navigate("/login")}
                  className="text-lg px-8 py-6 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 transition-all duration-200 hover:scale-105 cursor-pointer"
                >
                  <Zap className="w-5 h-5 mr-2" aria-hidden="true" />
                  지금 바로 시작하기
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-muted/30" aria-labelledby="features-heading">
          <div className="container px-4 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 id="features-heading" className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">AI 블로그 자동 생성 주요 기능</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                블로그치트키가 제공하는 강력한 AI 기반 SEO 최적화 도구들을 만나보세요
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
              {[
                { icon: Search, title: "AI 키워드 분석", description: "검색 의도 자동 파악, SEO 최적화 소제목 4개 자동 제안, 사용자 고민 포인트 분석", color: "primary", gradient: "from-primary to-blue-500", result: "키워드 적합도 +94%" },
                { icon: FileText, title: "SEO 최적화 콘텐츠", description: "형태소 15-17회 정확한 출현, 1,700-2,000자 자동 조절, 구조화된 콘텐츠 생성", color: "purple", gradient: "from-purple-500 to-violet-600", result: "상위노출 조건 100% 충족" },
                { icon: BarChart3, title: "실시간 연구 데이터", description: "Perplexity AI로 신뢰할 수 있는 최신 정보 수집, 연구 자료 기반 콘텐츠", color: "green", gradient: "from-green-500 to-emerald-600", result: "신뢰도 높은 정보 자동 반영" },
                { icon: MessageSquare, title: "AI 챗봇 편집", description: "자연어로 콘텐츠 수정, SSR 평가 기반 제목 추천, 톤앤매너 조정", color: "orange", gradient: "from-orange-400 to-orange-600", result: "수정 시간 80% 단축" },
                { icon: Smartphone, title: "모바일 최적화", description: "25-30자 단위 자동 줄바꿈, AI 스마트 포맷팅, 원클릭 복사", color: "blue", gradient: "from-sky-400 to-blue-600", result: "모바일 가독성 최적화" },
                { icon: Save, title: "세션 관리", description: "작업 내용 자동/수동 저장, 이전 세션 불러오기, 프로젝트 히스토리", color: "pink", gradient: "from-pink-400 to-rose-500", result: "언제든지 이어서 작업" },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay: index * 0.1, duration: 0.5 }, whileHover: { y: -6 } })}
                  className="group relative p-6 rounded-2xl bg-card border border-border/50 hover:shadow-xl hover:border-primary/20 transition-all duration-250 overflow-hidden"
                >
                  {/* Gradient top border accent */}
                  <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} aria-hidden="true" />
                  {/* Static thin border always visible */}
                  <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl bg-gradient-to-r ${feature.gradient} opacity-40`} aria-hidden="true" />

                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 ${
                    feature.color === 'primary' ? 'bg-primary/12 text-primary' :
                    feature.color === 'purple' ? 'bg-purple-500/12 text-purple-500' :
                    feature.color === 'green' ? 'bg-green-500/12 text-green-600' :
                    feature.color === 'orange' ? 'bg-orange-500/12 text-orange-500' :
                    feature.color === 'blue' ? 'bg-sky-500/12 text-sky-600' :
                    'bg-pink-500/12 text-pink-500'
                  }`}>
                    <feature.icon className="w-7 h-7" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">{feature.description}</p>
                  {/* Result metric */}
                  <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                    feature.color === 'primary' ? 'bg-primary/10 text-primary' :
                    feature.color === 'purple' ? 'bg-purple-500/10 text-purple-600' :
                    feature.color === 'green' ? 'bg-green-500/10 text-green-700' :
                    feature.color === 'orange' ? 'bg-orange-500/10 text-orange-600' :
                    feature.color === 'blue' ? 'bg-sky-500/10 text-sky-700' :
                    'bg-pink-500/10 text-pink-600'
                  }`}>
                    <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                    결과: {feature.result}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* AI Models Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 mb-4">
                  <Bot className="w-4 h-4" />
                  <span className="text-sm font-medium">최첨단 AI 모델 통합</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">AI 모델 통합</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: "Claude Opus 4.6", role: "메인 콘텐츠 생성, SEO 최적화" },
                  { name: "Gemini 2.5 Pro", role: "키워드 분석" },
                  { name: "Perplexity Sonar", role: "실시간 연구 데이터 수집" },
                ].map((model, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15, duration: 0.5 }}
                    whileHover={{ scale: 1.03 }}
                    className="p-5 rounded-xl bg-gradient-to-br from-card to-muted/50 border border-border/50 text-center hover:shadow-lg transition-all duration-200"
                  >
                    <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h4 className="font-semibold text-foreground mb-2">{model.name}</h4>
                    <p className="text-sm text-muted-foreground">{model.role}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-gradient-to-b from-muted/30 to-background" aria-labelledby="testimonials-heading">
          <div className="container px-4 mx-auto">
            <motion.div
              {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } })}
              className="text-center mb-14"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 mb-4">
                <Star className="w-4 h-4 fill-orange-500 text-orange-500" aria-hidden="true" />
                <span className="text-sm font-medium">실제 자영업자 후기</span>
              </div>
              <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  사장님들의 생생한 후기
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                블로그치트키를 사용하는 자영업자분들의 실제 경험을 확인하세요
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  name: "김민정",
                  business: "헤어살롱 원장",
                  businessType: "미용실",
                  initial: "김",
                  color: "bg-pink-500",
                  rating: 5,
                  quote: "블로그 글 하나 쓰는 데 반나절씩 걸렸는데, 이제는 3분이면 끝나요. 키워드만 넣으면 SEO 최적화된 글이 바로 나오니까 정말 편하고, 실제로 네이버 상위에 노출되기 시작했어요. 손님이 '블로그 보고 왔어요'라고 할 때 뿌듯합니다.",
                  stat: "예약 문의 월 +40% 증가",
                },
                {
                  name: "이준혁",
                  business: "치과 원장",
                  businessType: "치과의원",
                  initial: "이",
                  color: "bg-primary",
                  rating: 5,
                  quote: "의료 분야는 전문 용어도 많고 콘텐츠 품질이 중요한데, 블로그치트키가 Perplexity로 최신 연구 데이터까지 반영해줘서 신뢰감 있는 글이 나와요. 대행업체에 월 30만원 주던 걸 직접 하니까 비용 절감이 확실하게 됩니다.",
                  stat: "마케팅 비용 월 25만원 절약",
                },
                {
                  name: "박소연",
                  business: "한식당 대표",
                  businessType: "식당",
                  initial: "박",
                  color: "bg-green-500",
                  rating: 5,
                  quote: "전에는 SNS 홍보만 했는데 블로그는 엄두도 못 냈어요. 블로그치트키로 메뉴 소개 글 몇 개 올렸더니 검색해서 오시는 손님이 생겼어요. AI 챗봇으로 우리 가게 분위기에 맞게 톤을 바꿀 수 있어서 내 글처럼 느껴져요.",
                  stat: "블로그 유입 방문객 월 +65명",
                },
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  {...(prefersReducedMotion ? {} : {
                    initial: { opacity: 0, y: 24 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { delay: index * 0.12, duration: 0.55 },
                    whileHover: { y: -6 },
                  })}
                  className="group relative flex flex-col p-6 rounded-2xl bg-card border border-border/50 hover:shadow-xl transition-all duration-250 overflow-hidden"
                >
                  {/* Hover gradient border */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: "linear-gradient(135deg, hsl(207,90%,54%,0.08), hsl(270,60%,65%,0.08))", border: "1.5px solid hsl(207,90%,54%,0.25)" }} aria-hidden="true" />

                  {/* Quote icon */}
                  <Quote className="w-8 h-8 text-primary/20 mb-4 flex-shrink-0" aria-hidden="true" />

                  {/* Star rating */}
                  <div className="flex gap-1 mb-4" role="img" aria-label={`별점 ${testimonial.rating}점`}>
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-orange-400 text-orange-400" aria-hidden="true" />
                    ))}
                  </div>

                  {/* Review text */}
                  <blockquote className="text-muted-foreground text-sm leading-relaxed flex-1 mb-5">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Result stat badge */}
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/8 text-primary border border-primary/15 mb-5 self-start">
                    <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                    {testimonial.stat}
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                    <div
                      className={`w-10 h-10 rounded-full ${testimonial.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                      aria-hidden="true"
                    >
                      {testimonial.initial}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.business} · {testimonial.businessType}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section className="py-24 bg-background">
          <div className="container px-4 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">사용 워크플로우</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                7단계로 완성되는 SEO 최적화 블로그 콘텐츠
              </p>
            </motion.div>

            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Connection line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-purple-500 to-pink-500 hidden md:block" />
                
                <div className="space-y-6">
                  {[
                    { icon: Keyboard, title: "키워드 입력", description: "원하는 키워드 하나만 입력하세요", example: '예: "벤츠엔진경고등"' },
                    { icon: Brain, title: "AI 키워드 분석", description: "검색 의도 파악 + 소제목 4개 자동 제안" },
                    { icon: Database, title: "연구 데이터 수집", description: "Perplexity로 실시간 신뢰성 있는 정보 수집" },
                    { icon: Briefcase, title: "비즈니스 정보", description: "업종, 전문성, 차별화 요소 입력" },
                    { icon: FileText, title: "콘텐츠 생성", description: "Claude가 SEO 최적화 콘텐츠 자동 생성" },
                    { icon: MessageSquare, title: "AI 편집 (프리미엄)", description: "챗봇으로 수정 및 제목 추천" },
                    { icon: Copy, title: "복사 & 발행", description: "모바일 최적화 포맷 → 블로그 발행" },
                  ].map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className="relative flex items-start gap-6"
                    >
                      <div className="relative z-10 flex-shrink-0">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-card to-muted/50 border border-border/50 flex items-center justify-center shadow-lg"
                        >
                          <step.icon className="w-7 h-7 text-primary" />
                        </motion.div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 pt-3">
                        <h3 className="text-lg font-semibold text-foreground mb-1">{step.title}</h3>
                        <p className="text-muted-foreground">{step.description}</p>
                        {step.example && (
                          <p className="text-sm text-primary/80 mt-1 font-mono bg-primary/5 px-2 py-1 rounded inline-block">{step.example}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-muted/30" aria-labelledby="pricing-heading">
          <div className="container px-4 mx-auto">
            <motion.div
              {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } })}
              className="text-center mb-12"
            >
              <h2 id="pricing-heading" className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">블로그치트키 요금제</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                대행업체 월 수십만원 vs 블로그치트키 월 2-5만원
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                직접 생성하고, 직접 확인하고, 내 전문성을 담으세요
              </p>
            </motion.div>

            {/* Cost Comparison Visual */}
            <motion.div
              {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay: 0.1, duration: 0.6 } })}
              className="max-w-2xl mx-auto mb-12 p-6 rounded-2xl bg-card border border-border/50 shadow-sm"
              aria-label="대행업체 대비 비용 비교"
            >
              <h3 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-5">대행업체 대비 비용 비교</h3>
              <div className="space-y-4">
                {/* Agency bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-muted-foreground">블로그 대행업체</span>
                    <span className="font-bold text-muted-foreground">₩300,000 / 월</span>
                  </div>
                  <div className="h-8 rounded-lg bg-muted/60 border border-border/40 overflow-hidden">
                    <motion.div
                      className="h-full rounded-lg bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/20 flex items-center justify-end pr-3"
                      style={{ width: "100%" }}
                      {...(prefersReducedMotion ? {} : { initial: { width: 0 }, whileInView: { width: "100%" }, viewport: { once: true }, transition: { delay: 0.4, duration: 0.8, ease: "easeOut" } })}
                    >
                      <span className="text-xs text-muted-foreground font-medium">사기 위험 있음</span>
                    </motion.div>
                  </div>
                </div>
                {/* Cheatkey bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold text-primary">블로그치트키 프리미엄</span>
                    <span className="font-bold text-primary">₩50,000 / 월</span>
                  </div>
                  <div className="h-8 rounded-lg bg-primary/8 border border-primary/20 overflow-hidden">
                    <motion.div
                      className="h-full rounded-lg bg-gradient-to-r from-primary to-blue-500 flex items-center justify-end pr-3"
                      style={{ width: "17%" }}
                      {...(prefersReducedMotion ? {} : { initial: { width: 0 }, whileInView: { width: "17%" }, viewport: { once: true }, transition: { delay: 0.6, duration: 0.7, ease: "easeOut" } })}
                    >
                      <span className="text-xs text-white font-bold whitespace-nowrap">83% 저렴</span>
                    </motion.div>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/8 text-primary border border-primary/15">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  무료 체험 3회 포함 — 신용카드 없이 시작
                </span>
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Basic Plan */}
              <motion.div
                {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay: 0.1, duration: 0.6 }, whileHover: { y: -5 } })}
                className="p-8 rounded-2xl bg-card border border-border/50 hover:shadow-xl transition-all duration-200"
              >
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-muted text-muted-foreground">
                    <Zap className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">베이직</h3>
                  <p className="text-muted-foreground text-sm mb-4">SEO 최적화 콘텐츠 생성의 시작</p>
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-4xl font-bold text-foreground">20,000</span>
                    <span className="text-muted-foreground mb-1">원/월</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {["콘텐츠 생성", "SEO 최적화", "키워드 분석", "세션 저장", "모바일 최적화 포맷팅", "실시간 연구 데이터 수집"].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-muted/80 text-muted-foreground">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="w-full py-6 text-lg transition-all duration-200 hover:scale-[1.02] hover:bg-muted cursor-pointer"
                  onClick={() => navigate("/login")}
                >
                  베이직 시작하기
                </Button>
              </motion.div>

              {/* Premium Plan */}
              <motion.div
                {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay: 0.2, duration: 0.6 }, whileHover: { y: -5 } })}
                className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border-2 border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-200 relative"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg shadow-primary/25">
                    인기
                  </span>
                </div>
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-primary/20 text-primary">
                    <Crown className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">프리미엄</h3>
                  <p className="text-muted-foreground text-sm mb-4">AI 챗봇 편집으로 완벽한 콘텐츠</p>
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-4xl font-bold text-primary">50,000</span>
                    <span className="text-muted-foreground mb-1">원/월</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {["베이직의 모든 기능", "AI 챗봇 편집", "SSR 평가 기반 제목 추천", "톤앤매너 조정", "설득력/가독성 최적화", "실시간 SEO 재검증"].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center bg-primary/20 text-primary">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full py-6 text-lg bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                  onClick={() => navigate("/login")}
                >
                  프리미엄 시작하기
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section - SEO 최적화를 위한 자주 묻는 질문 */}
        <section id="faq" className="py-24 bg-background" aria-labelledby="faq-heading">
          <div className="container px-4 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 id="faq-heading" className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">자주 묻는 질문</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                블로그치트키에 대해 궁금한 점을 확인하세요
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto"
            >
              <Accordion type="single" collapsible className="space-y-3">
                {[
                  {
                    value: "faq-1",
                    question: "블로그치트키는 어떤 서비스인가요?",
                    lines: [
                      "블로그치트키는 자영업자를 위한 AI 기반 SEO 최적화 블로그 콘텐츠 자동 생성 서비스입니다.",
                      "키워드 하나만 입력하면 네이버 상위노출 조건을 완벽히 충족하는 고품질 블로그 글이 3분 만에 완성됩니다.",
                    ],
                  },
                  {
                    value: "faq-2",
                    question: "SEO를 몰라도 사용할 수 있나요?",
                    lines: [
                      "네, 전혀 문제없습니다.",
                      "블로그치트키가 형태소 빈도(15-17회), 글자수(1,700-2,000자), 키워드 최적화 등 모든 SEO 조건을 자동으로 맞춰줍니다.",
                      "사용자는 키워드만 입력하면 됩니다.",
                    ],
                  },
                  {
                    value: "faq-3",
                    question: "대행업체와 비교했을 때 장점은 무엇인가요?",
                    lines: [
                      "대행업체는 월 수십만원의 비용이 들고 사기 위험이 있습니다.",
                      "블로그치트키는 월 2-5만원으로 직접 생성하고 확인할 수 있어 투명하고 경제적입니다.",
                      "또한 내 전문성과 차별화 요소를 직접 담을 수 있습니다.",
                    ],
                  },
                  {
                    value: "faq-4",
                    question: "어떤 AI 모델을 사용하나요?",
                    lines: [
                      "Claude Opus 4.6 — 메인 콘텐츠 생성 및 SEO 최적화",
                      "Gemini 2.5 Pro — 키워드 분석",
                      "Perplexity Sonar — 실시간 연구 데이터 수집",
                    ],
                  },
                  {
                    value: "faq-5",
                    question: "베이직과 프리미엄 플랜의 차이는 무엇인가요?",
                    lines: [
                      "베이직(월 20,000원): 콘텐츠 생성, SEO 최적화, 키워드 분석, 세션 저장, 모바일 포맷팅",
                      "프리미엄(월 50,000원): 베이직의 모든 기능 + AI 챗봇 편집, SSR 평가 기반 제목 추천, 톤앤매너 조정, 실시간 SEO 재검증",
                    ],
                  },
                ].map((faq) => (
                  <AccordionItem
                    key={faq.value}
                    value={faq.value}
                    className="rounded-2xl bg-card border border-border/50 px-6 hover:border-primary/20 transition-all duration-200 data-[state=open]:border-primary/30 data-[state=open]:shadow-sm"
                  >
                    <AccordionTrigger className="text-base font-semibold text-foreground hover:no-underline py-5 text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5">
                      <ul className="space-y-2">
                        {faq.lines.map((line, i) => (
                          <li key={i} className="flex items-start gap-2 text-muted-foreground leading-relaxed">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0" />
                            {line}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-muted/50 to-background border-t border-border/50" role="contentinfo">
        {/* CTA Section */}
        <div className="container px-4 py-20 mx-auto">
          <motion.div
            {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } })}
            className="max-w-3xl mx-auto text-center"
          >
            {/* Social proof counter */}
            <FooterBlogCounter prefersReducedMotion={prefersReducedMotion ?? false} />

            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              블로그 마케팅, 이러지도 저러지도 못하셨다면
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              SEO 공부할 시간도 없고, 대행업체 맡기기도 불안하셨죠?
            </p>
            <p className="text-xl text-primary font-semibold mb-8">
              블로그치트키로 직접 해보세요. 3분이면 충분합니다.
            </p>
            <motion.div {...(prefersReducedMotion ? {} : { whileHover: { scale: 1.03 } })}>
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="text-lg px-10 py-6 bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-500/25 transition-all duration-200 cursor-pointer"
              >
                <Zap className="w-5 h-5 mr-2" aria-hidden="true" />
                무료체험 시작하기
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Business Info */}
        <div className="border-t border-border/50">
          <div className="container px-4 py-8 mx-auto">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                    사업자 정보
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><span className="font-medium text-foreground">상호명:</span> 블로그치트키</p>
                    <p><span className="font-medium text-foreground">사업자번호:</span> 456-05-03530</p>
                    <p><span className="font-medium text-foreground">대표자:</span> 오준호</p>
                    <p><span className="font-medium text-foreground">연락처:</span> 010-5001-2143</p>
                    <p><span className="font-medium text-foreground">사업장주소:</span> 경기도 의정부시 안말로 85번길 27-1</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                    기술 스택
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {["React", "TypeScript", "Vite", "TailwindCSS", "Node.js", "Express", "PostgreSQL"].map((tech) => (
                      <span 
                        key={tech}
                        className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border/50">
          <div className="container px-4 py-6 mx-auto">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
              <p className="text-sm text-muted-foreground">
                © 2026 블로그치트키. All rights reserved.
              </p>
              <a href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground underline transition-colors duration-150">
                개인정보처리방침
              </a>
              <a href="/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground underline transition-colors duration-150">
                운영방침
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Footer blog counter with count-up animation
function FooterBlogCounter({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const TARGET = 1847;
  const { count, ref } = useCountUp(TARGET, 1800);

  return (
    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/8 border border-primary/20 text-primary mb-8">
      <Sparkles className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span className="text-sm font-semibold">
        지금까지{" "}
        <span ref={ref} aria-live="polite" aria-atomic="true">
          {prefersReducedMotion ? TARGET.toLocaleString() : count.toLocaleString()}
        </span>
        개의 블로그 생성 완료
      </span>
    </div>
  );
}
