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

function Router() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 임시로 인증 우회 - Google OAuth 설정 완료 후 활성화 예정
    setIsAuthenticated(true);
    setAuthChecked(true);
    
    // Google OAuth 설정 완료 후 활성화할 코드:
    /*
    fetch('/api/auth/user')
      .then(res => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      })
      .finally(() => {
        setAuthChecked(true);
      });
    */
  }, []);

  // 인증 확인 중이면 로딩 표시
  if (!authChecked) {
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
        <Route path="/" component={Login} />
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
