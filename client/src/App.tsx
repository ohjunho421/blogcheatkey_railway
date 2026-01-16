import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Subscribe from "@/pages/subscribe";
import History from "@/pages/history";
import NotFound from "@/pages/not-found";
import PricingPage from "@/pages/PricingPage";
import PrivacyPolicy from "@/pages/privacy-policy";
import AdminPage from "@/pages/admin-dashboard";
import LandingPage from "@/pages/LandingPage";

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

  // 로딩 중이면 랜딩 페이지 또는 공개 페이지 표시
  if (isLoading) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="*" component={LandingPage} />
      </Switch>
    );
  }

  return (
    <Switch>
      {/* 랜딩 페이지 - 비로그인 시 메인 */}
      <Route path="/" component={isAuthenticated ? Home : LandingPage} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      {isAuthenticated ? (
        <>
          <Route path="/app" component={Home} />
          <Route path="/project/:id" component={Home} />
          <Route path="/pricing" component={PricingPage} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/history" component={History} />
          <Route path="/admin" component={AdminPage} />
        </>
      ) : (
        <>
          <Route path="/pricing" component={PricingPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
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
