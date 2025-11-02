# 소셜 로그인 & Toss Payments 연동 가이드

이 프로젝트에 카카오, 구글, 네이버 소셜 로그인과 Toss Payments 결제 시스템이 통합되었습니다.

## 📋 목차

1. [설치된 패키지](#설치된-패키지)
2. [소셜 로그인 설정](#소셜-로그인-설정)
3. [Toss Payments 설정](#toss-payments-설정)
4. [사용 방법](#사용-방법)
5. [API 엔드포인트](#api-엔드포인트)

---

## 📦 설치된 패키지

### 이미 설치된 패키지
- `passport-kakao`: 카카오 OAuth 인증
- `passport-naver-v2`: 네이버 OAuth 인증
- `passport-google-oauth20`: 구글 OAuth 인증 (기존)
- `@tosspayments/payment-sdk`: Toss Payments SDK
- `@tosspayments/payment-widget-sdk`: Toss Payments 위젯 SDK

---

## 🔐 소셜 로그인 설정

### 1. 환경 변수 설정

`.env` 파일에 다음 환경 변수를 추가하세요:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Kakao OAuth
KAKAO_CLIENT_ID=your-kakao-rest-api-key
KAKAO_CLIENT_SECRET=your-kakao-client-secret

# Naver OAuth
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
```

### 2. OAuth 애플리케이션 등록

#### Google
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. `API 및 서비스` > `사용자 인증 정보` 이동
4. OAuth 2.0 클라이언트 ID 생성
5. 승인된 리디렉션 URI 추가: `http://localhost:5000/api/auth/google/callback`

#### Kakao
1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 애플리케이션 추가
3. `내 애플리케이션` > `앱 설정` > `요약 정보`에서 REST API 키 확인
4. `제품 설정` > `카카오 로그인` 활성화
5. Redirect URI 설정: `http://localhost:5000/api/auth/kakao/callback`
6. 동의 항목 설정: 이메일, 프로필 정보 필수 동의

#### Naver
1. [Naver Developers](https://developers.naver.com/) 접속
2. `Application` > `애플리케이션 등록`
3. 사용 API: 네이버 로그인
4. 제공 정보 선택: 회원이름, 이메일 주소, 프로필 이미지
5. Callback URL 설정: `http://localhost:5000/api/auth/naver/callback`

### 3. 데이터베이스 스키마

users 테이블에 다음 컬럼이 있어야 합니다:
```sql
- googleId (varchar, nullable)
- kakaoId (varchar, nullable)
- naverId (varchar, nullable)
```

---

## 💳 Toss Payments 설정

### 1. 환경 변수 설정

`.env` 파일에 Toss Payments 관련 환경 변수를 추가하세요:

```env
# Toss Payments
TOSS_PAYMENTS_CLIENT_KEY=test_ck_xxxxxxxxxxxxxxxxxxxxx
TOSS_PAYMENTS_SECRET_KEY=test_sk_xxxxxxxxxxxxxxxxxxxxx
VITE_TOSS_PAYMENTS_CLIENT_KEY=test_ck_xxxxxxxxxxxxxxxxxxxxx
```

### 2. Toss Payments 계정 생성

1. [Toss Payments 개발자센터](https://developers.tosspayments.com/) 접속
2. 회원가입 및 로그인
3. `내 개발 정보` 메뉴에서 테스트 키 발급
4. 클라이언트 키와 시크릿 키를 `.env` 파일에 추가

### 3. 테스트 카드 정보

테스트 환경에서는 다음 정보로 결제 테스트가 가능합니다:
- 카드번호: `5423 1234 5678 1234`
- 유효기간: 미래의 임의의 날짜
- CVC: `123`

---

## 🚀 사용 방법

### 소셜 로그인 사용

#### 클라이언트 측

```tsx
import { SocialLogin } from '@/components/SocialLogin';

function LoginPage() {
  return (
    <div>
      <h1>로그인</h1>
      <SocialLogin onLoginSuccess={() => console.log('로그인 성공!')} />
    </div>
  );
}
```

#### 직접 링크로 이동

```tsx
<a href="/api/auth/google">Google로 로그인</a>
<a href="/api/auth/kakao">카카오로 로그인</a>
<a href="/api/auth/naver">네이버로 로그인</a>
```

### Toss Payments 사용

#### 1. 결제 준비

```tsx
import { TossPaymentWidget } from '@/components/TossPaymentWidget';

function PaymentPage() {
  const [paymentData, setPaymentData] = useState(null);

  const preparePayment = async () => {
    const response = await fetch('/api/payments/toss/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        orderName: 'Premium 플랜',
        amount: 10000,
        customerEmail: 'user@example.com',
        customerName: '홍길동',
      }),
    });
    
    const data = await response.json();
    setPaymentData(data.data);
  };

  return (
    <div>
      <button onClick={preparePayment}>결제하기</button>
      
      {paymentData && (
        <TossPaymentWidget
          orderId={paymentData.orderId}
          orderName={paymentData.orderName}
          amount={paymentData.amount}
          customerEmail={paymentData.customerEmail}
          customerName={paymentData.customerName}
          onSuccess={(paymentKey, orderId, amount) => {
            console.log('결제 성공:', { paymentKey, orderId, amount });
          }}
          onFail={(error) => {
            console.error('결제 실패:', error);
          }}
        />
      )}
    </div>
  );
}
```

#### 2. 결제 승인 (자동 처리)

결제 위젯에서 결제가 완료되면 자동으로 `/payment/success` 페이지로 리디렉션되고, 서버에서 결제 승인이 자동으로 처리됩니다.

---

## 📡 API 엔드포인트

### 소셜 로그인

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/auth/google` | Google 로그인 시작 |
| GET | `/api/auth/google/callback` | Google 로그인 콜백 |
| GET | `/api/auth/kakao` | 카카오 로그인 시작 |
| GET | `/api/auth/kakao/callback` | 카카오 로그인 콜백 |
| GET | `/api/auth/naver` | 네이버 로그인 시작 |
| GET | `/api/auth/naver/callback` | 네이버 로그인 콜백 |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/auth/user` | 현재 로그인한 사용자 정보 |

### Toss Payments

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/payments/toss/prepare` | 결제 준비 (주문번호 생성) |
| POST | `/api/payments/toss/confirm` | 결제 승인 |
| GET | `/api/payments/toss/:paymentKey` | 결제 정보 조회 (결제키) |
| GET | `/api/payments/toss/order/:orderId` | 결제 정보 조회 (주문번호) |
| POST | `/api/payments/toss/cancel` | 결제 취소 |
| POST | `/api/payments/toss/virtual-account` | 가상계좌 발급 |
| POST | `/api/payments/toss/billing/issue` | 빌링키 발급 (정기결제) |
| POST | `/api/payments/toss/billing/charge` | 빌링키로 결제 실행 |
| POST | `/api/payments/toss/webhook` | 웹훅 (Toss에서 호출) |

### 결제 API 예시

#### 결제 준비

```bash
POST /api/payments/toss/prepare
Content-Type: application/json

{
  "orderName": "Premium 플랜 1개월",
  "amount": 10000,
  "customerEmail": "user@example.com",
  "customerName": "홍길동"
}
```

#### 결제 승인

```bash
POST /api/payments/toss/confirm
Content-Type: application/json

{
  "paymentKey": "payment_key_from_widget",
  "orderId": "order_1234567890",
  "amount": 10000
}
```

#### 결제 취소

```bash
POST /api/payments/toss/cancel
Content-Type: application/json

{
  "paymentKey": "payment_key_from_widget",
  "cancelReason": "고객 요청"
}
```

---

## 🔒 보안 고려사항

1. **환경 변수**: `.env` 파일은 절대 커밋하지 마세요. `.gitignore`에 포함되어 있습니다.
2. **HTTPS**: 프로덕션 환경에서는 반드시 HTTPS를 사용하세요.
3. **시크릿 키**: 서버 측 시크릿 키는 클라이언트에 노출되지 않도록 주의하세요.
4. **웹훅 서명 검증**: Toss Payments 웹훅은 서명을 검증하여 위변조를 방지합니다.

---

## 🐛 트러블슈팅

### 소셜 로그인 오류

1. **Redirect URI 불일치**: OAuth 애플리케이션 설정의 Redirect URI가 정확한지 확인
2. **세션 문제**: 세션 스토어가 올바르게 설정되었는지 확인
3. **쿠키 문제**: 브라우저 쿠키 설정 확인 (sameSite, secure)

### 결제 오류

1. **클라이언트 키 오류**: `VITE_TOSS_PAYMENTS_CLIENT_KEY`가 설정되었는지 확인
2. **금액 불일치**: 클라이언트와 서버의 금액이 일치하는지 확인
3. **네트워크 오류**: 브라우저 콘솔에서 네트워크 탭 확인

---

## 📝 TODO

- [ ] 결제 기록을 데이터베이스에 저장
- [ ] 결제 완료 시 사용자 권한 자동 업데이트
- [ ] 정기 결제 스케줄러 구현
- [ ] 결제 내역 조회 페이지 구현
- [ ] 관리자 대시보드에 결제 통계 추가

---

## 📚 참고 문서

- [Toss Payments 개발자 문서](https://docs.tosspayments.com/)
- [Passport.js 공식 문서](http://www.passportjs.org/)
- [Kakao Developers](https://developers.kakao.com/)
- [Naver Developers](https://developers.naver.com/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
