import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface User {
  id: number;
  email: string;
  name: string;
  profileImage?: string;
}

export function useAuth() {
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
}

export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      return apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
        headers: { "Content-Type": "application/json" },
      });
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
      return apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
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
      return apiRequest("/auth/logout", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/auth/user"], null);
      queryClient.clear();
    },
  });
}