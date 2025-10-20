# Railway 로그인 문제 해결 가이드

## 🔍 발견된 문제

1. ✅ **쿠키 보안 설정** - 프로덕션 환경에 맞게 수정됨
2. ✅ **중복 라우트** - 제거됨
3. ⚠️ **환경 변수 누락 가능성**
4. ⚠️ **CORS 설정 누락**

---

## ✅ 이미 수정된 사항

### 1. 쿠키 보안 설정 수정 (`server/auth.ts`)
- `secure: true` - HTTPS에서 쿠키 전송
- `httpOnly: true` - XSS 공격 방지
- `sameSite: 'none'` - 크로스 사이트 요청 허용 (프로덕션)
- `proxy: true` - Railway 프록시 신뢰

---

## 🔧 추가로 해야 할 작업

### 1. Railway 환경 변수 확인

Railway 대시보드 → 프로젝트 → **Variables** 탭에서 다음 변수들이 **모두** 설정되어 있는지 확인하세요:

```bash
# 필수 Google OAuth 설정
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# 필수 세션 설정
SESSION_SECRET=your_super_secret_random_string_here

# 데이터베이스 (Railway PostgreSQL이 자동 생성)
DATABASE_URL=postgresql://...

# Node 환경
NODE_ENV=production

# 포트 (Railway가 자동 설정)
PORT=${{PORT}}

# AI API 키들
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
PERPLEXITY_API_KEY=pplx-...

# 결제 시스템
PORTONE_API_KEY=imp_...
PORTONE_API_SECRET=...
VITE_PORTONE_STORE_ID=imp_...
```

### 2. Google OAuth 설정 확인

Google Cloud Console에서:

1. **승인된 자바스크립트 원본**에 Railway 도메인 추가:
   ```
   https://your-app.up.railway.app
   ```

2. **승인된 리디렉션 URI**에 콜백 URL 추가:
   ```
   https://your-app.up.railway.app/api/auth/google/callback
   ```

### 3. 데이터베이스 세션 테이블 확인

Railway CLI로 연결하여 세션 테이블이 생성되었는지 확인:

```bash
railway link
railway run psql $DATABASE_URL
```

PostgreSQL 콘솔에서:
```sql
\dt session
```

테이블이 없다면 자동으로 생성되어야 하지만, 수동으로 생성도 가능:

```sql
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_session_expire" ON "session" ("expire");
```

---

## 🚀 배포 및 테스트

### 1. 변경사항 커밋 및 푸시

```bash
git add .
git commit -m "Fix Railway login issues - cookie settings and auth flow"
git push
```

### 2. Railway 재배포 확인

- Railway는 자동으로 새 버전을 배포합니다
- **Deployments** 탭에서 빌드 로그 확인
- 에러가 없는지 확인

### 3. 로그인 테스트

1. Railway 앱 URL 방문: `https://your-app.up.railway.app`
2. "Google 로그인" 버튼 클릭
3. Google 계정 선택
4. 성공적으로 로그인되는지 확인

### 4. 로그 확인

Railway 대시보드에서 **Logs** 탭으로 이동:

```bash
# 정상 로그인 시 다음과 같은 메시지가 보여야 함:
Google login successful, user ID: 123
Session saved successfully
```

---

## 🔍 여전히 문제가 있다면?

### 디버깅 체크리스트

1. **환경 변수 재확인**
   ```bash
   railway variables
   ```

2. **데이터베이스 연결 확인**
   ```bash
   railway run npm run db:push
   ```

3. **로그에서 에러 메시지 확인**
   - `SESSION_SECRET` 관련 에러?
   - `GOOGLE_CLIENT_ID` 관련 에러?
   - 데이터베이스 연결 에러?

4. **브라우저 개발자 도구**
   - Network 탭에서 `/api/auth/google/callback` 요청 확인
   - 쿠키가 설정되었는지 확인 (Application → Cookies)
   - Console에서 에러 메시지 확인

### 일반적인 에러와 해결법

#### 에러: "Error: Failed to obtain access token"
→ `GOOGLE_CLIENT_ID` 또는 `GOOGLE_CLIENT_SECRET`가 잘못됨

#### 에러: "session secret option is required"
→ Railway Variables에 `SESSION_SECRET` 추가 필요

#### 에러: "Error connecting to database"
→ `DATABASE_URL` 확인, PostgreSQL 서비스가 실행 중인지 확인

#### 로그인 후 리디렉션은 되지만 인증되지 않음
→ 쿠키가 설정되지 않는 문제, 이미 수정됨

---

## 📞 추가 지원

- Railway Discord: https://discord.gg/railway
- Google OAuth 문서: https://developers.google.com/identity/protocols/oauth2
- Express Session 문서: https://github.com/expressjs/session

---

**수정 일시**: 2025년 1월 21일  
**수정 내용**: 
- 쿠키 보안 설정 개선 (secure, httpOnly, sameSite)
- 프로덕션 환경 대응
- 중복 라우트 제거
