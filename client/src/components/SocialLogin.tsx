import React from 'react';

interface SocialLoginProps {
  onLoginSuccess?: () => void;
}

export function SocialLogin({ onLoginSuccess }: SocialLoginProps) {
  const handleSocialLogin = (provider: 'google' | 'kakao' | 'naver') => {
    // 현재 URL을 세션 스토리지에 저장 (로그인 후 리다이렉트용)
    sessionStorage.setItem('redirectUrl', window.location.pathname);
    
    // 소셜 로그인 페이지로 이동
    window.location.href = `/api/auth/${provider}`;
  };

  return (
    <div className="space-y-3">
      <div className="text-center text-sm text-gray-600 mb-4">
        소셜 계정으로 간편하게 시작하기
      </div>

      {/* Google Login */}
      <button
        onClick={() => handleSocialLogin('google')}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google로 계속하기
      </button>

      {/* Kakao Login */}
      <button
        onClick={() => handleSocialLogin('kakao')}
        className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-medium py-3 px-4 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3Z" />
        </svg>
        카카오로 계속하기
      </button>

      {/* Naver Login */}
      <button
        onClick={() => handleSocialLogin('naver')}
        className="w-full flex items-center justify-center gap-3 bg-[#03C75A] hover:bg-[#02B351] text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z" />
        </svg>
        네이버로 계속하기
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">또는</span>
        </div>
      </div>
    </div>
  );
}
