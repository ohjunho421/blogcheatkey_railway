import React, { useState, useEffect } from "react";
import { setLoggedOut } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, setAuthError } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FaGoogle } from "react-icons/fa";
import { SocialLogin } from "@/components/SocialLogin";

const loginSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  // 로그인 페이지에서는 인증 체크 불필요 - localStorage만 확인
  const isAuthenticated = localStorage.getItem('sessionId') !== null && localStorage.getItem('user') !== null;
  const loginMutation = useLogin();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 로그인 페이지에서는 로그아웃 상태를 초기화하지 않음
  // 사용자가 직접 로그인 버튼을 클릭할 때만 상태 변경

  // Redirect if already authenticated - useEffect 사용으로 hook 순서 보장
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // SEO: 로그인 페이지는 검색엔진에 노출되지 않도록 noindex 설정
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

  const onSubmit = async (data: LoginForm) => {
    try {
      // 로그인 시도시 로그아웃 상태 및 에러 상태 해제
      setLoggedOut(false);
      setAuthError(false);
      
      // 로그인 API 직접 호출
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error("로그인에 실패했습니다.");
      }
      
      const userData = await response.json();
      console.log("로그인 성공:", userData);
      console.log("현재 쿠키:", document.cookie);
      
      // localStorage를 사용하여 로그인 상태 저장
      if (userData.sessionId) {
        console.log("서버에서 받은 세션 ID:", userData.sessionId);
        localStorage.setItem('sessionId', userData.sessionId);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log("localStorage에 세션 저장 완료");
        
        // 로그아웃 상태 해제
        setLoggedOut(false);
      }
      
      toast({
        title: "로그인 성공",
        description: "블로그치트키에 오신 것을 환영합니다!",
      });
      
      // 쿠키 확인 후 리다이렉트
      setTimeout(() => {
        console.log("리다이렉트 전 쿠키:", document.cookie);
        window.location.href = "/";
      }, 1500);
    } catch (error: any) {
      toast({
        title: "로그인 실패",
        description: error.message || "로그인에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  // const handleGoogleLogin = () => {
  //   window.location.href = "/api/auth/google";
  // };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">로그인</CardTitle>
          <CardDescription className="text-center">
            블로그치트키로 AI 블로그 생성을 시작하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google 로그인 오류 Alert 주석 처리
          {location.includes("error=google") && (
            <Alert variant="destructive">
              <AlertDescription>
                구글 로그인에 실패했습니다. 다시 시도해주세요.
              </AlertDescription>
            </Alert>
          )}
          */}


          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비밀번호</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="비밀번호를 입력하세요"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  "로그인"
                )}
              </Button>
            </form>
          </Form>

          {/* 소셜 로그인 */}
          <SocialLogin onLoginSuccess={() => navigate("/")} />

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              계정이 없으신가요?{" "}
              <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                회원가입
              </Link>
            </p>
            <p className="text-xs text-gray-500">
              로그인 시{" "}
              <Link href="/privacy-policy" className="underline hover:text-gray-700">
                개인정보처리방침
              </Link>
              에 동의하는 것으로 간주됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}