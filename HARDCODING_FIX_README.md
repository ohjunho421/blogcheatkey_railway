# 하드코딩 제거 및 환경 설정 가이드

## 🚨 문제점

다른 컴퓨터에서 서비스 로그인이 불가능했던 이유:

### 1. 하드코딩된 세션 ID
```typescript
if (storedUser === "07QbDf6eyyVVTMC3GlvuLh-8h1BoxBNH") {
  userId = 1; // 특정 컴퓨터에서만 작동
}
```
- **위치**: `server/routes.ts` (9곳)
- **문제**: 특정 개발 환경의 세션 ID가 하드코딩됨
- **영향**: 다른 컴퓨터에서 인증 실패

### 2. 하드코딩된 슈퍼 관리자 이메일
```typescript
const superAdminEmail = "wnsghcoswp@gmail.com";
const currentUserEmail = "wnsghcoswp@gmail.com";
```
- **위치**: `server/routes.ts` (3곳)
- **문제**: 특정 이메일이 코드에 하드코딩됨
- **영향**: 다른 관리자 계정 설정 불가능

---

## ✅ 해결 방법

### 1. 하드코딩된 세션 ID 완전 제거

**Before:**
```typescript
if (!userId && req.headers.authorization) {
  const storedUser = req.headers.authorization.includes('Bearer') ? 
    req.headers.authorization.replace('Bearer ', '') : null;
  if (storedUser === "07QbDf6eyyVVTMC3GlvuLh-8h1BoxBNH") {
    userId = 1; // 하드코딩
  }
}
```

**After:**
```typescript
// 제거됨 - 정상적인 세션 인증만 사용
```

### 2. 환경변수로 슈퍼 관리자 설정

**Before:**
```typescript
const superAdminEmail = "wnsghcoswp@gmail.com";
const isSuper = email === "wnsghcoswp@gmail.com";
```

**After:**
```typescript
const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "";
const isSuper = superAdminEmail && email === superAdminEmail;
```

### 3. 슈퍼 관리자 권한 체크 개선

**Before:**
```typescript
const requireSuperAdmin = (req: any, res: any, next: any) => {
  const superAdminEmail = "wnsghcoswp@gmail.com";
  const currentUserEmail = "wnsghcoswp@gmail.com"; // 하드코딩
  
  if (currentUserEmail !== superAdminEmail) {
    return res.status(403).json({ error: "접근 불가" });
  }
  next();
};
```

**After:**
```typescript
const requireSuperAdmin = async (req: any, res: any, next: any) => {
  const userId = await getAuthenticatedUserId(req);
  
  if (!userId) {
    return res.status(401).json({ error: "인증이 필요합니다" });
  }
  
  const user = await storage.getUserById(userId);
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "";
  
  if (!user || !superAdminEmail || user.email !== superAdminEmail) {
    return res.status(403).json({ 
      error: "슈퍼 관리자만 접근할 수 있습니다" 
    });
  }
  next();
};
```

---

## 🔧 환경 설정

### 1. `.env` 파일 설정

```env
# Super Admin Email (for admin access)
SUPER_ADMIN_EMAIL=your-admin-email@gmail.com
```

### 2. Railway 환경변수 설정

1. Railway 대시보드 접속
2. 프로젝트 선택
3. **Variables** 탭
4. **New Variable** 클릭
5. 추가:
   ```
   SUPER_ADMIN_EMAIL=your-admin-email@gmail.com
   ```
6. **Deploy** (자동으로 재배포됨)

### 3. 로컬 개발 환경

```bash
# .env 파일 생성 (아직 없다면)
cp .env.example .env

# .env 파일 편집
SUPER_ADMIN_EMAIL=your-email@gmail.com
```

---

## 📝 슈퍼 관리자 계정 생성

### 1. 회원가입

환경변수에 설정한 이메일로 회원가입하면 자동으로 슈퍼 관리자 권한이 부여됩니다.

```typescript
// 자동으로 처리됨
const isSuper = superAdminEmail && email === superAdminEmail;

// 슈퍼 관리자 권한 자동 설정:
isAdmin: true
subscriptionTier: "premium"
canGenerateImages: true
```

### 2. 기존 계정을 슈퍼 관리자로 변경

데이터베이스에서 직접 수정:

```sql
UPDATE users 
SET 
  is_admin = true,
  subscription_tier = 'premium',
  can_generate_images = true
WHERE email = 'your-email@gmail.com';
```

---

## ✅ 수정된 파일

1. **`server/routes.ts`**
   - 하드코딩된 세션 ID 제거 (9곳)
   - 하드코딩된 이메일 제거 (3곳)
   - `requireSuperAdmin` 미들웨어 개선

2. **`.env.example`**
   - `SUPER_ADMIN_EMAIL` 환경변수 추가

---

## 🧪 테스트 체크리스트

- [ ] 로컬 환경에서 로그인 테스트
- [ ] Railway 배포 후 로그인 테스트
- [ ] 다른 컴퓨터에서 로그인 테스트
- [ ] 슈퍼 관리자 권한 테스트
- [ ] 일반 사용자 로그인 테스트
- [ ] Google OAuth 로그인 테스트

---

## 🚀 배포 후 확인사항

### Railway 환경변수 확인
```bash
# Railway CLI 사용
railway variables

# 출력 예시:
SUPER_ADMIN_EMAIL=your-email@gmail.com
```

### 로그 확인
```bash
railway logs

# 정상 작동 로그:
✅ Session saved successfully
✅ User authenticated: user@example.com
```

---

## 🔒 보안 권장사항

### 1. SESSION_SECRET 변경
```env
# 강력한 랜덤 문자열 생성
SESSION_SECRET=$(openssl rand -base64 32)
```

### 2. SUPER_ADMIN_EMAIL 보호
- `.env` 파일을 `.gitignore`에 추가 (이미 추가됨)
- Railway Variables에만 저장
- 팀원과 공유 시 안전한 방법 사용 (1Password 등)

### 3. 비밀번호 정책
- 최소 8자 이상
- 대소문자, 숫자, 특수문자 조합
- bcrypt 해싱 사용 (이미 적용됨)

---

## 📞 문제 해결

### 로그인이 안 될 때

1. **쿠키 확인**
   ```
   개발자 도구 > Application > Cookies
   connect.sid 쿠키 확인
   ```

2. **세션 스토어 확인**
   ```bash
   # PostgreSQL 접속
   SELECT * FROM session LIMIT 5;
   ```

3. **환경변수 확인**
   ```bash
   echo $SUPER_ADMIN_EMAIL
   ```

### "Not authenticated" 오류

- 쿠키가 전송되는지 확인
- CORS 설정 확인
- `credentials: 'include'` 설정 확인

---

**작성일**: 2025년 1월 23일  
**버전**: 1.0.0  
**영향**: 모든 환경 (로컬, Railway, 다른 컴퓨터)
