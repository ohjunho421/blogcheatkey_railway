import posthog from 'posthog-js';

// PostHog 초기화
export const initPostHog = () => {
  // 환경변수에서 PostHog 키 가져오기 (없으면 초기화하지 않음)
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
  const posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
  
  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      // 자동 페이지뷰 트래킹
      capture_pageview: true,
      // 자동 페이지 이탈 트래킹
      capture_pageleave: true,
      // 세션 녹화 (선택적)
      disable_session_recording: false,
      // 개발 환경에서는 디버그 모드
      loaded: (posthog) => {
        if (import.meta.env.DEV) {
          posthog.debug();
        }
      },
      // 한국 사용자를 위한 설정
      persistence: 'localStorage+cookie',
      // 자동 속성 수집
      autocapture: true,
    });
  } else {
    console.warn('PostHog key not found. Analytics disabled.');
  }
  
  return posthog;
};

// 사용자 식별
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  posthog.identify(userId, properties);
};

// 사용자 속성 설정
export const setUserProperties = (properties: Record<string, any>) => {
  posthog.people.set(properties);
};

// 커스텀 이벤트 트래킹
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  posthog.capture(eventName, properties);
};

// 페이지뷰 트래킹
export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  posthog.capture('$pageview', {
    $current_url: window.location.href,
    page_name: pageName,
    ...properties,
  });
};

// 사용자 로그아웃 시 리셋
export const resetUser = () => {
  posthog.reset();
};

// 주요 이벤트 상수
export const ANALYTICS_EVENTS = {
  // 인증 관련
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  
  // 콘텐츠 생성 관련
  CONTENT_GENERATION_STARTED: 'content_generation_started',
  CONTENT_GENERATION_COMPLETED: 'content_generation_completed',
  CONTENT_GENERATION_FAILED: 'content_generation_failed',
  CONTENT_COPIED: 'content_copied',
  CONTENT_SAVED: 'content_saved',
  
  // 키워드 분석 관련
  KEYWORD_ANALYSIS_STARTED: 'keyword_analysis_started',
  KEYWORD_ANALYSIS_COMPLETED: 'keyword_analysis_completed',
  
  // 챗봇 관련
  CHATBOT_MESSAGE_SENT: 'chatbot_message_sent',
  CHATBOT_EDIT_APPLIED: 'chatbot_edit_applied',
  
  // 구독 관련
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  
  // 세션 관련
  SESSION_CREATED: 'session_created',
  SESSION_LOADED: 'session_loaded',
  SESSION_DELETED: 'session_deleted',
  
  // 랜딩 페이지 관련
  LANDING_CTA_CLICKED: 'landing_cta_clicked',
  LANDING_SECTION_VIEWED: 'landing_section_viewed',
  PRICING_PLAN_VIEWED: 'pricing_plan_viewed',
  FAQ_EXPANDED: 'faq_expanded',
  
  // 기능 사용 관련
  FEATURE_USED: 'feature_used',
  MOBILE_FORMAT_APPLIED: 'mobile_format_applied',
  SEO_VALIDATION_RUN: 'seo_validation_run',
};

export default posthog;
