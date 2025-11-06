import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
  profileImage?: string;
  isAdmin?: boolean;
  subscriptionTier?: string;
  canGenerateContent?: boolean;
  canGenerateImages?: boolean;
  canUseChatbot?: boolean;
}

export function useAuth() {
  const isLoggedOut = getLoggedOut();
  const hasAuthError = getAuthError();
  const [shouldCheckAuth, setShouldCheckAuth] = useState(() => {
    // 초기값: 로그아웃 상태도 아니고, 인증 에러도 없고, 세션이 있을 때만 true
    return !isLoggedOut && !hasAuthError && localStorage.getItem('sessionId') !== null;
  });
  
  // 서버에서 세션 확인 (소셜 로그인 지원)
  const { data: user, isLoading, error, isError } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false, // 마운트 시 자동 재요청 방지
    enabled: shouldCheckAuth, // 상태로 제어
    gcTime: 5 * 60 * 1000, // 캐시 유지 시간
  });

  // 401 에러 발생 시 세션 정보 정리 및 쿼리 완전 중단 (무한 반복 방지)
  useEffect(() => {
    if (isError && error && (error as any).status === 401) {
      console.log("401 error detected, stopping all auth checks");
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
      setAuthError(true); // 에러 상태 저장
      setShouldCheckAuth(false); // 쿼리 완전 중단
    }
  }, [isError, error]);

  // 명시적으로 로그아웃한 경우만 인증 안 됨으로 처리
  if (isLoggedOut) {
    return {
      user: undefined,
      isLoading: false,
      isAuthenticated: false,
      error: null
    };
  }

  // localStorage에서 사용자 정보 백업 사용 (서버 인증 실패 시)
  if (!user && !isLoading && localStorage.getItem('sessionId')) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("Using stored user data:", parsedUser);
        return {
          user: parsedUser as User,
          isLoading: false,
          isAuthenticated: true,
          error: null
        };
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        // 잘못된 데이터 정리
        localStorage.removeItem('user');
        localStorage.removeItem('sessionId');
        setAuthError(true);
        setShouldCheckAuth(false);
      }
    }
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // 로그아웃 상태 해제
      setLoggedOut(false);
      // 인증 에러 상태 초기화
      setAuthError(false);
      // 올바른 쿼리 키로 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { email: string; password: string; name: string }) => {
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
      // 임시 로그아웃 구현 - 전역 상태 변경
      setLoggedOut(true);
      // 인증 에러 상태도 초기화
      setAuthError(false);
      // 세션 정보 제거
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
      return { success: true };
      
      // 원래 로그아웃 API 호출 (나중에 활성화)
      /*
      const response = await fetch("/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
      */
    },
    onSuccess: () => {
      queryClient.setQueryData(["/auth/user"], null);
      queryClient.clear();
      // 로그인 페이지로 이동 후 새로고침
      window.location.href = "/login";
    },
  });
}