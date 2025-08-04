import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
  // 임시로 슈퍼 관리자로 설정 - wnsghcoswp@gmail.com
  return {
    user: {
      id: 1,
      email: "wnsghcoswp@gmail.com", // 슈퍼 관리자 이메일
      name: "슈퍼 관리자",
      profileImage: undefined,
      isAdmin: true, // 슈퍼 관리자 권한
      subscriptionTier: "pro",
      canGenerateContent: true,
      canGenerateImages: true,
      canUseChatbot: true
    } as User,
    isLoading: false,
    isAuthenticated: true,
    error: null
  };

  // 원래 코드 (나중에 활성화)
  /*
  const { data: user, isLoading, error, isError } = useQuery({
    queryKey: ["/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // 401 오류가 발생하면 인증되지 않은 것으로 처리
  const isAuthenticated = !!user && !isError;
  
  return {
    user: user as User | undefined,
    isLoading,
    isAuthenticated,
    error
  };
  */
}

export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
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
      const response = await fetch("/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/auth/user"], null);
      queryClient.clear();
    },
  });
}