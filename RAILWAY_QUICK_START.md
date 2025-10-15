# Railway 빠른 시작 가이드 (Replit 독립 배포)

## 🎯 핵심 요약

**목표**: Railway와 Replit을 완전히 독립적으로 운영  
**방법**: Railway 자체 PostgreSQL 사용 (Neon DB 사용 안 함)

## ⚡ 5분 배포 가이드

### 1. Railway PostgreSQL 추가
```
Railway 대시보드 → New → Database → PostgreSQL
✅ DATABASE_URL 자동 생성 확인
```

### 2. GitHub 레포지토리 연결
```
Railway 대시보드 → New → Deploy from GitHub repo
✅ blogcheatkey 레포지토리 선택
```

### 3. 필수 환경 변수 설정

Railway 프로젝트 → **Variables** 탭:

```bash
# ✅ 필수 - AI API 키
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxx
GOOGLE_API_KEY=AIzaxxxxxxxxxxxx
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxx

# ✅ 필수 - 결제
PORTONE_API_KEY=imp_xxxxxxxxxxxx
PORTONE_API_SECRET=xxxxxxxxxxxx
VITE_PORTONE_STORE_ID=imp_xxxxxxxxxxxx

# ✅ 필수 - 환경
NODE_ENV=production
SESSION_SECRET=railway-강력한-시크릿-키-여기에

# ⚠️ DATABASE_URL은 Railway가 자동으로 설정 (확인만 필요)
# ⚠️ PORT는 Railway가 자동으로 설정 (수정 불필요)
```

### 4. 데이터베이스 스키마 적용

**방법 A - Railway CLI (권장)**:
```bash
npm install -g @railway/cli
railway login
railway link
railway run npm run db:push
```

**방법 B - 빌드 설정에서 자동 실행**:
- `railway.json`에 이미 `npm run db:push` 포함됨
- 첫 배포 시 자동으로 스키마 적용

### 5. 배포 확인

1. **Deployments** 탭 → 빌드 성공 확인
2. 도메인 접속 (예: `https://blogcheatkey.up.railway.app`)
3. 회원가입/로그인 테스트
4. ⚠️ **Replit에서 확인**: Railway 데이터가 Replit에 나타나지 않아야 함

## ✅ 독립성 확인

배포 후 다음을 확인하세요:

```bash
# Railway 로그에서 확인
🔧 Using standard PostgreSQL for local development
# 또는
🚀 Using Neon Serverless for production

# DATABASE_URL 확인
✅ Railway: postgresql://...@postgres.railway.internal:5432/railway
❌ Neon: postgresql://...@neon.tech/... (사용하지 말 것!)
```

## 🔧 문제 해결

### Neon DB에 연결되는 경우
```
1. Railway Variables에서 DATABASE_URL 확인
2. neon.tech 포함 시 → 삭제
3. Railway PostgreSQL 서비스 추가
4. 재배포
```

### 스키마 적용 안 됨
```bash
railway run npm run db:push
```

### 환경 변수 누락
```
Variables 탭에서 모든 API 키 확인 → Redeploy
```

## 📚 상세 가이드

- **전체 가이드**: `RAILWAY_INDEPENDENT_SETUP.md` 참고
- **기본 배포**: `RAILWAY_DEPLOYMENT.md` 참고

## 🎉 완료!

✅ Railway와 Replit이 독립적으로 운영됩니다  
✅ 서로 다른 데이터베이스를 사용합니다  
✅ Replit에 영향을 주지 않습니다  

---

**다음 단계**:
- 커스텀 도메인 연결
- 모니터링 설정
- 정기 백업 구성
