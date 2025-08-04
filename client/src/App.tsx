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
import NotFound from "@/pages/not-found";
import PricingPage from "@/pages/PricingPage";
import PrivacyPolicy from "@/pages/privacy-policy";
import AdminPage from "@/pages/admin";

import { useAuth } from "@/hooks/useAuth";

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

  // 3초 후에도 로딩 중이면 로그인 페이지로 리다이렉트
  if (isLoading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      {isAuthenticated ? (
        <>
          <Route path="/" component={Home} />
          <Route path="/project/:id" component={Home} />
          <Route path="/pricing" component={PricingPage} />
          <Route path="/admin" component={AdminPage} />
        </>
      ) : (
        <>
          <Route path="/" component={Login} />
          <Route path="*" component={Login} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
