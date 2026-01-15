import { useState } from "react";
import { useLocation } from "wouter";
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
  Star
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container px-4 mx-auto">
          <div className="flex items-center justify-between h-16 md:h-20">
            <a href="/" className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                블로그치트키
              </span>
            </a>
            
            <nav className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => scrollToSection("features")} 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                기능
              </button>
              <button 
                onClick={() => scrollToSection("pricing")} 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                요금제
              </button>
              <Button 
                onClick={() => navigate("/login")}
                className="bg-primary hover:bg-primary/90 shadow-lg transition-all duration-300 hover:scale-105"
              >
                <Zap className="w-4 h-4 mr-2" />
                무료로 시작하기
              </Button>
            </nav>

            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-t border-border/50">
            <div className="container px-4 py-4 flex flex-col gap-4">
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
              <Button 
                onClick={() => navigate("/login")}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Zap className="w-4 h-4 mr-2" />
                무료로 시작하기
              </Button>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container relative z-10 px-4 py-20">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 animate-fade-in">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AI 기반 SEO 최적화 플랫폼</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">블로그치트키</span>
                <br />
                <span className="text-foreground">3분 만에 전문가 수준의</span>
                <br />
                <span className="text-foreground">블로그 글 완성</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                키워드 하나만 입력하면, AI가 SEO 조건을 완벽히 충족하는
                <br className="hidden md:block" />
                고품질 블로그 글을 자동으로 작성합니다.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg"
                  onClick={() => navigate("/login")}
                  className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  무료로 시작하기
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection("features")}
                  className="text-lg px-8 py-6 border-primary/30 hover:bg-primary/5 transition-all duration-300"
                >
                  더 알아보기
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center p-6 rounded-2xl bg-card/50 backdrop-blur border border-border/50">
                  <Clock className="w-8 h-8 text-primary mb-3" />
                  <span className="text-2xl font-bold text-foreground">3분</span>
                  <span className="text-sm text-muted-foreground">콘텐츠 생성 시간</span>
                </div>
                <div className="flex flex-col items-center p-6 rounded-2xl bg-card/50 backdrop-blur border border-border/50">
                  <Sparkles className="w-8 h-8 text-primary mb-3" />
                  <span className="text-2xl font-bold text-foreground">15-17회</span>
                  <span className="text-sm text-muted-foreground">형태소 최적화</span>
                </div>
                <div className="flex flex-col items-center p-6 rounded-2xl bg-card/50 backdrop-blur border border-border/50">
                  <Zap className="w-8 h-8 text-primary mb-3" />
                  <span className="text-2xl font-bold text-foreground">1,700-2,000자</span>
                  <span className="text-sm text-muted-foreground">글자수 자동 조절</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-muted/30">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">✨ 주요 기능</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                블로그치트키가 제공하는 강력한 AI 기반 SEO 최적화 도구들을 만나보세요
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
              {/* Feature Cards */}
              <FeatureCard 
                icon={<Search className="w-6 h-6" />}
                title="AI 키워드 분석"
                description="검색 의도 자동 파악, SEO 최적화 소제목 4개 자동 제안, 사용자 고민 포인트 분석"
                color="primary"
              />
              <FeatureCard 
                icon={<FileText className="w-6 h-6" />}
                title="SEO 최적화 콘텐츠"
                description="형태소 15-17회 정확한 출현, 1,700-2,000자 자동 조절, 구조화된 콘텐츠 생성"
                color="purple"
              />
              <FeatureCard 
                icon={<BarChart3 className="w-6 h-6" />}
                title="실시간 연구 데이터"
                description="Perplexity AI로 신뢰할 수 있는 최신 정보 수집, 연구 자료 기반 콘텐츠"
                color="green"
              />
              <FeatureCard 
                icon={<MessageSquare className="w-6 h-6" />}
                title="AI 챗봇 편집"
                description="자연어로 콘텐츠 수정, SSR 평가 기반 제목 추천, 톤앤매너 조정"
                color="orange"
              />
              <FeatureCard 
                icon={<Smartphone className="w-6 h-6" />}
                title="모바일 최적화"
                description="25-30자 단위 자동 줄바꿈, AI 스마트 포맷팅, 원클릭 복사"
                color="blue"
              />
              <FeatureCard 
                icon={<Sparkles className="w-6 h-6" />}
                title="한국어 형태소 분석"
                description="hangul-js, korean-js 활용, 30개 이상 조사/어미 패턴 지원"
                color="pink"
              />
            </div>

            {/* AI Models Section */}
            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-center mb-8">
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">🤖 AI 모델 통합</span>
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <AIModelCard 
                  name="Claude Sonnet 4.5"
                  role="메인 콘텐츠 생성, SEO 최적화"
                />
                <AIModelCard 
                  name="Gemini 2.5 Pro"
                  role="키워드 분석, 챗봇 편집"
                />
                <AIModelCard 
                  name="Perplexity Sonar"
                  role="실시간 연구 데이터 수집"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-background">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">💳 요금제</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                비즈니스 성장에 맞는 플랜을 선택하세요
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Basic Plan */}
              <div className="p-8 rounded-2xl bg-card border border-border/50 hover:shadow-lg transition-all duration-300">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">베이직</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-foreground">20,000</span>
                    <span className="text-muted-foreground">원/월</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">SEO 최적화 블로그 콘텐츠 생성</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <PricingFeature text="블로그 콘텐츠 생성" />
                  <PricingFeature text="SEO 최적화" />
                  <PricingFeature text="키워드 분석" />
                  <PricingFeature text="세션 저장" />
                  <PricingFeature text="모바일 포맷팅" />
                </ul>
                <Button 
                  variant="outline"
                  className="w-full py-6 text-lg transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => navigate("/login")}
                >
                  시작하기
                </Button>
              </div>

              {/* Premium Plan */}
              <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border-2 border-primary/30 hover:shadow-lg transition-all duration-300 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    인기
                  </span>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">프리미엄</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-primary">50,000</span>
                    <span className="text-muted-foreground">원/월</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">AI 챗봇 편집 포함 풀 서비스</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <PricingFeature text="베이직 플랜 전체 포함" highlighted />
                  <PricingFeature text="AI 챗봇 편집" highlighted />
                  <PricingFeature text="SSR 평가 기반 제목 추천" highlighted />
                  <PricingFeature text="톤앤매너 조정" highlighted />
                  <PricingFeature text="설득력/가독성 최적화" highlighted />
                  <PricingFeature text="실시간 SEO 재검증" highlighted />
                </ul>
                <Button 
                  className="w-full py-6 text-lg bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => navigate("/login")}
                >
                  프리미엄 시작하기
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border/50">
        {/* CTA Section */}
        <div className="container px-4 py-16 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              지금 바로 시작하세요
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              3분 만에 SEO 최적화된 블로그 글을 작성해보세요
            </p>
            <Button 
              size="lg"
              onClick={() => navigate("/login")}
              className="text-lg px-10 py-6 bg-primary hover:bg-primary/90 shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Zap className="w-5 h-5 mr-2" />
              무료체험 시작하기
            </Button>
          </div>
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
            <p className="text-center text-sm text-muted-foreground">
              © 2026 블로그치트키. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ 
  icon, 
  title, 
  description, 
  color 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    purple: "bg-purple-500/10 text-purple-500",
    green: "bg-green-500/10 text-green-500",
    orange: "bg-orange-500/10 text-orange-500",
    blue: "bg-blue-500/10 text-blue-500",
    pink: "bg-pink-500/10 text-pink-500",
  };

  return (
    <div className="group p-6 rounded-2xl bg-card border border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

// AI Model Card Component
function AIModelCard({ name, role }: { name: string; role: string }) {
  return (
    <div className="p-6 rounded-2xl bg-card/50 backdrop-blur border border-border/50 text-center">
      <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
      <h4 className="font-semibold text-foreground mb-1">{name}</h4>
      <p className="text-sm text-muted-foreground">{role}</p>
    </div>
  );
}

// Pricing Feature Component
function PricingFeature({ text, highlighted = false }: { text: string; highlighted?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${highlighted ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
        <Check className="w-3 h-3" />
      </div>
      <span className="text-foreground">{text}</span>
    </li>
  );
}
