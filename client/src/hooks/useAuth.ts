import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

// 로그아웃 상태를 localStorage로 관리하여 페이지 새로고침 후에도 유지
const LOGOUT_KEY = 'auth_logged_out';
const AUTH_ERROR_KEY = 'auth_has_error'; // 401 에러 발생 여부

export const setLoggedOut = (value: boolean) => {
  if (value) {
    localStorage.setItem(LOGOUT_KEY, 'true');
  } else {
    localStorage.removeItem(LOGOUT_KEY);
  }
};

export const getLoggedOut = () => {
  return localStorage.getItem(LOGOUT_KEY) === 'true';
};

export const setAuthError = (value: boolean) => {
  if (value) {
    localStorage.setItem(AUTH_ERROR_KEY, 'true');
  } else {
    localStorage.removeItem(AUTH_ERROR_KEY);
  }
};

export const getAuthError = () => {
  return localStorage.getItem(AUTH_ERROR_KEY) === 'true';
};

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  profileImage?: string;
  isAdmin?: boolean;
  subscriptionTier?: string;
  subscriptionExpiresAt?: string;
  canGenerateContent?: boolean;
  canGenerateImages?: boolean;
  canUseChatbot?: boolean;
  freeGenerationCount?: number;
}

export function useAuth() {
  const isLoggedOut = getLoggedOut();
  const hasAuthError = getAuthError();
  
  // 로그아웃 상태가 아니고, 인증 에러도 없을 때 인증 체크
  // 소셜 로그인은 쿠키 기반 세션을 사용하므로 localStorage sessionId 체크 제거
  const shouldCheckAuth = !isLoggedOut && !hasAuthError;
  
  // 서버에서 세션 확인 (소셜 로그인 지원)
  const { data: user, isLoading, error, isError } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false, // 마운트 시 자동 재요청 방지
    enabled: shouldCheckAuth, // 조건을 만족할 때만 요청
    gcTime: 5 * 60 * 1000, // 캐시 유지 시간
  });

  // 401 에러 발생 시 세션 정보 즉시 정리 (무한 반복 방지)
  useEffect(() => {
    if (isError && error) {
      const status = (error as any).status || (error as any).message?.includes('401') ? 401 : 0;
      if (status === 401 || (error as any).message?.includes('401')) {
        console.log("401 error detected, clearing all session data");
        localStorage.removeItem('sessionId');
        localStorage.removeItem('user');
        setAuthError(true);
      }
    }
  }, [isError, error]);

  // 401 에러 또는 로그아웃 상태면 인증 안 됨으로 처리
  if (isLoggedOut || (isError && (error as any)?.status === 401)) {
    return {
      user: undefined,
      isLoading: false,
      isAuthenticated: false,
      error: null
    };
  }

  const isAuthenticated = !!user && !isError;
  
  return {
    user: user as User | undefined,
    isLoading,
    isAuthenticated,
    error
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // 쿠키 포함
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // localStorage에 세션 정보 저장 (signup과 동일하게)
      if (data.sessionId) {
        console.log("Login: 서버에서 받은 세션 ID:", data.sessionId);
        localStorage.setItem('sessionId', data.sessionId);
        localStorage.setItem('user', JSON.stringify(data));
        console.log("Login: localStorage에 세션 저장 완료");
      }
      
      // 로그아웃 상태 해제
      setLoggedOut(false);
      // 인증 에러 상태 초기화
      setAuthError(false);
      // 캐시 완전히 초기화 후 다시 가져오기
      queryClient.removeQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { email: string; password: string; name: string; phone?: string }) => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // localStorage를 사용하여 로그인 상태 저장
      if (data.sessionId) {
        console.log("서버에서 받은 세션 ID:", data.sessionId);
        localStorage.setItem('sessionId', data.sessionId);
        localStorage.setItem('user', JSON.stringify(data));
        console.log("localStorage에 세션 저장 완료");
      }
      
      // 로그아웃 상태 해제
      setLoggedOut(false);
      // 인증 에러 상태 초기화
      setAuthError(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // 1. 먼저 클라이언트 상태 정리
      setLoggedOut(true);
      setAuthError(false);
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
      
      // 2. 캐시 정리
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
      
      // 3. 서버에 로그아웃 요청 (실패해도 무시)
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        // 서버 요청 실패해도 클라이언트는 이미 로그아웃 상태
        console.log("Logout API call skipped or failed");
      }
      
      return { success: true };
    },
    onSuccess: () => {
      // 약간의 딜레이 후 리다이렉트 (상태 정리 완료 보장)
      setTimeout(() => {
        window.location.replace("/");
      }, 100);
    },
  });
}