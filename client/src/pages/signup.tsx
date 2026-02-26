import React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSignup } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Mail, Lock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const signupSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  email: z.string().email("올바른 이메일을 입력해주세요"),
  phone: z.string().min(10, "올바른 휴대폰 번호를 입력해주세요"),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const signupMutation = useSignup();
  
  // 회원가입 페이지에서는 인증 체크 불필요 - 리다이렉트 방지
  const isAuthenticated = false;

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Redirect if already authenticated - useEffect 사용으로 hook 순서 보장
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // SEO: 회원가입 페이지는 검색엔진에 노출되지 않도록 noindex 설정
  React.useEffect(() => {
    // noindex 메타 태그 추가
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    const originalContent = metaRobots?.content;
    
    if (metaRobots) {
      metaRobots.content = 'noindex, nofollow';
    } else {
      metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      metaRobots.content = 'noindex, nofollow';
      document.head.appendChild(metaRobots);
    }
    
    // 컴포넌트 언마운트 시 원래 상태로 복원
    return () => {
      if (metaRobots && originalContent !== undefined) {
        metaRobots.content = originalContent;
      } else if (metaRobots && !originalContent) {
        metaRobots.remove();
      }
    };
  }, []);

  const onSubmit = async (data: SignupForm) => {
    try {
      await signupMutation.mutateAsync({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      toast({
        title: "회원가입 성공",
        description: "블로그치트키에 오신 것을 환영합니다!",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "회원가입 실패",
        description: error.message || "회원가입에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  // const handleGoogleSignup = () => {
  //   window.location.href = "/api/auth/google";
  // };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl flex rounded-2xl overflow-hidden shadow-xl">
        {/* Left brand panel — hidden on mobile, visible on md+ */}
        <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-sky-500 to-purple-600 flex-col justify-between p-10 text-white">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">블로그치트키</h1>
            <p className="text-sm text-white/75 font-medium">무료로 3회 체험해보세요</p>
          </div>
          <ul className="space-y-4">
            {[
              { text: "AI 키워드 분석" },
              { text: "SEO 최적화 콘텐츠 자동 생성" },
              { text: "모바일 최적화 포맷팅" },
            ].map(({ text }) => (
              <li key={text} className="flex items-center gap-3 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-white/90" />
                {text}
              </li>
            ))}
          </ul>
          <p className="text-xs text-white/50">© 2026 블로그치트키</p>
        </div>

        {/* Right form card */}
        <Card className="w-full md:w-7/12 rounded-none md:rounded-none border-0 shadow-none">
          <CardHeader className="space-y-2 pt-8">
            {/* Brand name visible on mobile only */}
            <div className="md:hidden text-center mb-1">
              <span className="text-xl font-extrabold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                블로그치트키
              </span>
            </div>
            <CardTitle className="text-2xl font-bold text-center">회원가입</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              AI 블로그 생성을 위한 계정을 만드세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-8">
            {/* Free trial benefit box */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm text-foreground font-medium">
                회원가입 즉시 3회 무료 체험이 제공됩니다
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이름</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="홍길동"
                          className="rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이메일</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          className="rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>휴대폰 번호</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="01012345678"
                          className="rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password group with visual label */}
                <div className="space-y-3 rounded-xl bg-muted/40 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">비밀번호 설정</p>

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비밀번호</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="최소 6자 이상"
                            className="rounded-lg bg-background"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비밀번호 확인</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="비밀번호를 다시 입력하세요"
                            className="rounded-lg bg-background"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg"
                  disabled={signupMutation.isPending}
                >
                  {signupMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      가입 중...
                    </>
                  ) : (
                    "계정 만들기"
                  )}
                </Button>

                {/* Security badge */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>256-bit 암호화 보안</span>
                </div>
              </form>
            </Form>

            {/* 소셜 로그인 버튼 주석 처리
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  또는
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignup}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              구글로 시작하기
            </Button>
            */}

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                이미 계정이 있으신가요?{" "}
                <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
                  로그인
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}