import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
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
  Star,
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
  Target,
  Hash,
  Layers,
  Save
} from "lucide-react";

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-background/80 backdrop-blur-md border-b border-border/50" role="banner">
        <div className="container px-4 mx-auto">
          <div className="flex items-center justify-between h-16 md:h-20">
            <a href="/" className="flex items-center gap-2" aria-label="블로그치트키 홈으로 이동">
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                블로그치트키
              </span>
            </a>
            
            <nav className="hidden md:flex items-center gap-8" role="navigation" aria-label="메인 네비게이션">
              <button 
                onClick={() => scrollToSection("pain-points")} 
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="자영업자 고민 섹션으로 이동"
              >
                자영업자 고민
              </button>
              <button 
                onClick={() => scrollToSection("features")} 
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="기능 섹션으로 이동"
              >
                기능
              </button>
              <button 
                onClick={() => scrollToSection("pricing")} 
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="요금제 섹션으로 이동"
              >
                요금제
              </button>
              <button 
                onClick={() => scrollToSection("faq")} 
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="자주 묻는 질문 섹션으로 이동"
              >
                FAQ
              </button>
              <Button 
                onClick={() => navigate("/login")}
                className="bg-primary hover:bg-primary/90 shadow-lg transition-all duration-300 hover:scale-105"
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
                className="text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                자영업자 고민
              </button>
              <button 
                onClick={() => scrollToSection("features")} 
                className="text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                기능
              </button>
              <button 
                onClick={() => scrollToSection("pricing")} 
                className="text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                요금제
              </button>
              <button 
                onClick={() => scrollToSection("faq")} 
                className="text-left text-muted-foreground hover:text-foreground transition-colors py-2"
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
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background" aria-labelledby="hero-heading">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl" />
          </div>

          <div className="container relative z-10 px-4 py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8"
              >
                <Store className="w-4 h-4" />
                <span className="text-sm font-medium">자영업자를 위한 AI 블로그 마케팅 솔루션</span>
              </motion.div>

              {/* Headline - H1 for SEO */}
              <motion.h1
                id="hero-heading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
              >
                <span className="text-foreground">자영업자를 위한 AI 블로그 자동 생성</span>
                <br />
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">본업에 집중하세요</span>
                <br />
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">블로그 글은 AI가 대신</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
              >
                SEO 몰라도 괜찮아요. 키워드 하나만 입력하면
                <br className="hidden md:block" />
                <span className="text-primary font-semibold">상위노출 조건을 완벽히 충족</span>하는 글이 3분 만에 완성됩니다.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Button 
                  size="lg"
                  onClick={() => navigate("/login")}
                  className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  무료로 시작하기
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection("pain-points")}
                  className="text-lg px-8 py-6 border-primary/30 hover:bg-primary/5 transition-all duration-300"
                >
                  이런 고민 있으신가요?
                </Button>
              </motion.div>

              {/* Stats Cards - 자영업자 관점 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.8 }}
                className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {[
                  { icon: Clock, value: "6시간 → 3분", label: "글 작성 시간 단축" },
                  { icon: ShieldCheck, value: "직접 생성", label: "대행업체 사기 걱정 NO" },
                  { icon: TrendingUp, value: "SEO 자동 최적화", label: "전문지식 필요 없음" },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="flex flex-col items-center p-6 rounded-2xl bg-card/50 backdrop-blur border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                  >
                    <stat.icon className="w-8 h-8 text-primary mb-3" />
                    <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Pain Points Section - 자영업자의 현실 */}
        <section id="pain-points" className="py-24 bg-gradient-to-b from-background to-muted/30" aria-labelledby="pain-points-heading">
          <div className="container px-4 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
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
                  className="p-6 rounded-2xl bg-card border border-border/50 hover:border-orange-500/30 hover:shadow-lg transition-all duration-300"
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
                  className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-105"
                >
                  <Zap className="w-5 h-5 mr-2" />
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
                { icon: Search, title: "AI 키워드 분석", description: "검색 의도 자동 파악, SEO 최적화 소제목 4개 자동 제안, 사용자 고민 포인트 분석", color: "primary" },
                { icon: FileText, title: "SEO 최적화 콘텐츠", description: "형태소 15-17회 정확한 출현, 1,700-2,000자 자동 조절, 구조화된 콘텐츠 생성", color: "purple" },
                { icon: BarChart3, title: "실시간 연구 데이터", description: "Perplexity AI로 신뢰할 수 있는 최신 정보 수집, 연구 자료 기반 콘텐츠", color: "green" },
                { icon: MessageSquare, title: "AI 챗봇 편집", description: "자연어로 콘텐츠 수정, SSR 평가 기반 제목 추천, 톤앤매너 조정", color: "orange" },
                { icon: Smartphone, title: "모바일 최적화", description: "25-30자 단위 자동 줄바꿈, AI 스마트 포맷팅, 원클릭 복사", color: "blue" },
                { icon: Save, title: "세션 관리", description: "작업 내용 자동/수동 저장, 이전 세션 불러오기, 프로젝트 히스토리", color: "pink" },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -5 }}
                  className="group p-6 rounded-2xl bg-card border border-border/50 hover:shadow-xl hover:border-primary/20 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${
                    feature.color === 'primary' ? 'bg-primary/10 text-primary' :
                    feature.color === 'purple' ? 'bg-purple-500/10 text-purple-500' :
                    feature.color === 'green' ? 'bg-green-500/10 text-green-500' :
                    feature.color === 'orange' ? 'bg-orange-500/10 text-orange-500' :
                    feature.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-pink-500/10 text-pink-500'
                  }`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
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
                <h3 className="text-2xl font-bold text-foreground">🤖 AI 모델 통합</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: "Claude Sonnet 4.5", role: "메인 콘텐츠 생성, SEO 최적화" },
                  { name: "Gemini 2.5 Pro", role: "키워드 분석, 챗봇 편집" },
                  { name: "Perplexity Sonar", role: "실시간 연구 데이터 수집" },
                ].map((model, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15, duration: 0.5 }}
                    whileHover={{ scale: 1.03 }}
                    className="p-5 rounded-xl bg-gradient-to-br from-card to-muted/50 border border-border/50 text-center hover:shadow-lg transition-all duration-300"
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
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">🔄 사용 워크플로우</span>
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
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 id="pricing-heading" className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">블로그치트키 요금제 - 대행업체보다 저렴하게</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                대행업체 월 수십만원 vs 블로그치트키 월 2-5만원
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                직접 생성하고, 직접 확인하고, 내 전문성을 담으세요
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Basic Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.6 }}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl bg-card border border-border/50 hover:shadow-xl transition-all duration-300"
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
                  className="w-full py-6 text-lg transition-all duration-300 hover:scale-[1.02] hover:bg-muted"
                  onClick={() => navigate("/login")}
                >
                  베이직 시작하기
                </Button>
              </motion.div>

              {/* Premium Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border-2 border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 relative"
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
                  className="w-full py-6 text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => navigate("/login")}
                >
                  프리미엄 시작하기
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section - SEO 최적화를 위한 자주 묻는 질문 */}
        <section id="faq" className="py-24 bg-background" aria-labelledby="faq-heading" itemScope itemType="https://schema.org/FAQPage">
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

            <div className="max-w-3xl mx-auto space-y-4">
              {[
                {
                  question: "블로그치트키는 어떤 서비스인가요?",
                  answer: "블로그치트키는 자영업자를 위한 AI 기반 SEO 최적화 블로그 콘텐츠 자동 생성 서비스입니다. 키워드 하나만 입력하면 네이버 상위노출 조건을 완벽히 충족하는 고품질 블로그 글이 3분 만에 완성됩니다."
                },
                {
                  question: "SEO를 몰라도 사용할 수 있나요?",
                  answer: "네, 전혀 문제없습니다. 블로그치트키가 형태소 빈도(15-17회), 글자수(1,700-2,000자), 키워드 최적화 등 모든 SEO 조건을 자동으로 맞춰줍니다. 사용자는 키워드만 입력하면 됩니다."
                },
                {
                  question: "대행업체와 비교했을 때 장점은 무엇인가요?",
                  answer: "대행업체는 월 수십만원의 비용이 들고 사기 위험이 있지만, 블로그치트키는 월 2-5만원으로 직접 생성하고 확인할 수 있어 투명하고 경제적입니다. 또한 내 전문성과 차별화 요소를 직접 담을 수 있습니다."
                },
                {
                  question: "어떤 AI 모델을 사용하나요?",
                  answer: "Claude Sonnet 4.5(메인 콘텐츠 생성), Gemini 2.5 Pro(키워드 분석, 챗봇 편집), Perplexity Sonar(실시간 연구 데이터 수집) 등 최첨단 AI 모델을 통합 활용합니다."
                },
                {
                  question: "베이직과 프리미엄 플랜의 차이는 무엇인가요?",
                  answer: "베이직(월 20,000원)은 콘텐츠 생성, SEO 최적화, 키워드 분석, 세션 저장, 모바일 포맷팅을 제공합니다. 프리미엄(월 50,000원)은 베이직의 모든 기능에 AI 챗봇 편집, SSR 평가 기반 제목 추천, 톤앤매너 조정, 실시간 SEO 재검증 기능이 추가됩니다."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all duration-300"
                  itemScope
                  itemProp="mainEntity"
                  itemType="https://schema.org/Question"
                >
                  <h3 className="text-lg font-semibold text-foreground mb-3" itemProp="name">
                    {faq.question}
                  </h3>
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p className="text-muted-foreground leading-relaxed" itemProp="text">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-muted/50 to-background border-t border-border/50" role="contentinfo">
        {/* CTA Section */}
        <div className="container px-4 py-20 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              블로그 마케팅, 이러지도 저러지도 못하셨다면
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              SEO 공부할 시간도 없고, 대행업체 맡기기도 불안하셨죠?
            </p>
            <p className="text-xl text-primary font-semibold mb-8">
              블로그치트키로 직접 해보세요. 3분이면 충분합니다.
            </p>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button 
                size="lg"
                onClick={() => navigate("/login")}
                className="text-lg px-10 py-6 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all duration-300"
              >
                <Zap className="w-5 h-5 mr-2" />
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
                  <h3 className="text-lg font-semibold text-foreground mb-4">👥 사업자 정보</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><span className="font-medium text-foreground">상호명:</span> 블로그치트키</p>
                    <p><span className="font-medium text-foreground">사업자번호:</span> 456-05-03530</p>
                    <p><span className="font-medium text-foreground">대표자:</span> 오준호</p>
                    <p><span className="font-medium text-foreground">연락처:</span> 010-5001-2143</p>
                    <p><span className="font-medium text-foreground">사업장주소:</span> 의정부시 안말로 85번길 27-1</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">🛠 기술 스택</h3>
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
              <a href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground underline transition-colors">
                개인정보처리방침
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// 모든 컴포넌트가 인라인으로 통합되어 별도 컴포넌트 불필요
