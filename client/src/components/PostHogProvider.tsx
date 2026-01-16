import { useEffect, createContext, useContext, ReactNode } from 'react';
import posthog from 'posthog-js';
import { initPostHog, identifyUser, resetUser, trackEvent, ANALYTICS_EVENTS } from '@/lib/posthog';

interface PostHogContextType {
  trackEvent: typeof trackEvent;
  identifyUser: typeof identifyUser;
  resetUser: typeof resetUser;
  ANALYTICS_EVENTS: typeof ANALYTICS_EVENTS;
}

const PostHogContext = createContext<PostHogContextType | null>(null);

interface PostHogProviderProps {
  children: ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    // PostHog 초기화
    initPostHog();
    
    // 클린업
    return () => {
      // 필요시 PostHog 종료 로직
    };
  }, []);

  const value: PostHogContextType = {
    trackEvent,
    identifyUser,
    resetUser,
    ANALYTICS_EVENTS,
  };

  return (
    <PostHogContext.Provider value={value}>
      {children}
    </PostHogContext.Provider>
  );
}

// 커스텀 훅
export function usePostHog() {
  const context = useContext(PostHogContext);
  if (!context) {
    throw new Error('usePostHog must be used within a PostHogProvider');
  }
  return context;
}

// 사용자 인증 상태 변경 시 PostHog 동기화를 위한 훅
export function usePostHogIdentify(user: { id: number; email: string; username: string; subscriptionTier?: string } | null) {
  useEffect(() => {
    if (user) {
      identifyUser(user.id.toString(), {
        email: user.email,
        username: user.username,
        subscription_tier: user.subscriptionTier || 'free',
      });
    } else {
      resetUser();
    }
  }, [user?.id]);
}

export default PostHogProvider;
