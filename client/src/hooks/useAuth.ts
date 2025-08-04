import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// 로그아웃 상태를 localStorage로 관리하여 페이지 새로고침 후에도 유지
const LOGOUT_KEY = 'auth_logged_out';

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
  const hasStoredSession = localStorage.getItem('sessionId') !== null;
  
  // localStorage에 세션이 있고 로그아웃 상태가 아닐 때만 서버에서 사용자 정보 가져오기
  const { data: user, isLoading, error, isError } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    enabled: !isLoggedOut && hasStoredSession,
  });

  // 로그아웃 상태이거나 저장된 세션이 없으면 인증되지 않은 것으로 처리
  if (isLoggedOut || !hasStoredSession) {
    return {
      user: undefined,
      isLoading: false,
      isAuthenticated: false,
      error: null
    };
  }

  // localStorage에서 사용자 정보 백업 사용
  if (!user && !isLoading && !isError) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return {
          user: parsedUser as User,
          isLoading: false,
          isAuthenticated: true,
          error: null
        };
      } catch (e) {
        console.error('Failed to parse stored user:', e);
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
      // 올바른 쿼리 키로 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { email: string; password: string; name: string }) => {
      const response = await fetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/auth/user"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // 임시 로그아웃 구현 - 전역 상태 변경
      setLoggedOut(true);
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