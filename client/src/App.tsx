import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import LandingPage from "@/pages/LandingPage";

const Home = lazy(() => import("@/pages/home"));
const Login = lazy(() => import("@/pages/login"));
const Signup = lazy(() => import("@/pages/signup"));
const Subscribe = lazy(() => import("@/pages/subscribe"));
const History = lazy(() => import("@/pages/history"));
const NotFound = lazy(() => import("@/pages/not-found"));
const PricingPage = lazy(() => import("@/pages/PricingPage"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const TermsOfService = lazy(() => import("@/pages/terms-of-service"));
const AdminPage = lazy(() => import("@/pages/admin-dashboard"));
const Profile = lazy(() => import("@/pages/profile"));

import { useAuth } from "@/hooks/useAuth";
import { PostHogProvider, usePostHogIdentify } from "@/components/PostHogProvider";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showLoading, setShowLoading] = useState(true);

  // 로딩 상태를 3초로 제한하여 무한 루프 방지
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowLoading(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  const fallback = (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );

  // 로딩 중이면 랜딩 페이지 또는 공개 페이지 표시
  if (isLoading) {
    return (
      <Suspense fallback={fallback}>
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="*" component={LandingPage} />
        </Switch>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={fallback}>
      <Switch>
        {/* 랜딩 페이지 - 비로그인 시 메인 */}
        <Route path="/" component={isAuthenticated ? Home : LandingPage} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-service" component={TermsOfService} />
        {isAuthenticated ? (
          <>
            <Route path="/app" component={Home} />
            <Route path="/project/:id" component={Home} />
            <Route path="/pricing" component={PricingPage} />
            <Route path="/subscribe" component={Subscribe} />
            <Route path="/history" component={History} />
            <Route path="/profile" component={Profile} />
            <Route path="/admin" component={AdminPage} />
          </>
        ) : (
          <>
            <Route path="/pricing" component={PricingPage} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PostHogProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </PostHogProvider>
    </QueryClientProvider>
  );
}

export default App;
