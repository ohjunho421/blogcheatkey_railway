# Railway 독립 배포 가이드

## 🎯 목적
이 가이드는 **Replit 배포와 완전히 독립적으로** Railway에서 프로젝트를 운영하는 방법을 안내합니다.

## ⚠️ 중요 사항
- **Replit의 Neon 데이터베이스는 절대 사용하지 않습니다**
- Railway 자체 PostgreSQL을 사용하여 완전히 독립적으로 운영
- 두 환경이 서로 간섭하지 않도록 설정

## 🚀 Railway 배포 단계

### 1단계: Railway PostgreSQL 데이터베이스 생성

1. Railway 대시보드 접속
2. **New** 버튼 클릭
3. **Database → PostgreSQL** 선택
4. 자동으로 생성되는 `DATABASE_URL` 환경변수 확인
   - 형식: `postgresql://postgres:password@postgres.railway.internal:5432/railway`
   - ⚠️ **중요**: Neon DB URL이 아닌 Railway PostgreSQL URL이어야 함

### 2단계: 프로젝트 배포

#### GitHub에서 배포
1. GitHub 레포지토리를 Railway에 연결
2. **New → Deploy from GitHub repo** 선택
3. 레포지토리 선택 및 배포 시작

### 3단계: 환경 변수 설정

Railway 프로젝트의 **Variables** 탭에서 다음을 설정:

```bash
# 🔴 데이터베이스 - Railway PostgreSQL (자동 생성됨, 확인만 필요)
DATABASE_URL=postgresql://postgres:xxxxx@postgres.railway.internal:5432/railway

# AI API 키 (Replit과 동일하거나 다른 키 사용 가능)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxx
GOOGLE_API_KEY=AIzaxxxxxxxxxxxx
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxx

# Google Service Account (Imagen 이미지 생성용)
GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json

# 결제 시스템 (포트원)
PORTONE_API_KEY=imp_xxxxxxxxxxxx
PORTONE_API_SECRET=xxxxxxxxxxxx
VITE_PORTONE_STORE_ID=imp_xxxxxxxxxxxx

# 환경 설정
NODE_ENV=production
PORT=${{PORT}}
SESSION_SECRET=railway-독립적인-세션-시크릿-키

# CORS 설정 (Railway 도메인)
FRONTEND_URL=https://your-app.up.railway.app
```

### 4단계: 데이터베이스 스키마 적용

Railway CLI를 사용하여 스키마 적용:

```bash
# Railway CLI 설치 (처음 한 번만)
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 데이터베이스 스키마 적용
railway run npm run db:push
```

또는 Railway 대시보드에서:
1. **Settings** → **Deploy Triggers** → **Manual Deploy**
2. 빌드 로그에서 `db:push` 실행 확인

### 5단계: 배포 확인

1. **Deployments** 탭에서 빌드 상태 확인
2. 로그에서 다음 메시지 확인:
   ```
   🚀 Using Neon Serverless for production (Replit용)
   또는
   🔧 Using standard PostgreSQL for local development (Railway용)
   ```
3. 도메인 접속: `https://your-app.up.railway.app`

## 🔍 데이터베이스 연결 로직

프로젝트는 자동으로 환경을 감지합니다:

```typescript
// server/db.ts
const isProduction = process.env.NODE_ENV === 'production';
const isNeonDb = process.env.DATABASE_URL.includes('neon.tech');

if (!isProduction || !isNeonDb) {
  // Railway PostgreSQL 또는 로컬 개발 환경
  // 일반 PostgreSQL 드라이버 사용
} else {
  // Replit/Neon 환경
  // Neon Serverless 드라이버 사용
}
```

## ✅ 독립성 확인 체크리스트

배포 후 다음 사항을 확인하세요:

- [ ] Railway DATABASE_URL이 Railway PostgreSQL을 가리킴 (`postgres.railway.internal`)
- [ ] Replit DATABASE_URL과 다른 데이터베이스 사용 확인
- [ ] Railway에서 새로운 사용자 등록이 Replit에 나타나지 않음
- [ ] Railway에서 생성된 콘텐츠가 Replit과 독립적임
- [ ] 두 환경이 서로 다른 세션을 유지함

## 🔧 트러블슈팅

### 문제 1: Neon DB에 연결되는 경우

**증상**: Railway에서 Replit 데이터가 보임

**해결**:
1. Railway Variables에서 `DATABASE_URL` 확인
2. Neon DB URL인 경우 삭제
3. Railway PostgreSQL 서비스 추가
4. 자동 생성된 `DATABASE_URL` 사용

### 문제 2: 데이터베이스 연결 실패

**증상**: "Database connection error"

**해결**:
```bash
# Railway CLI로 연결 테스트
railway run npm run db:push

# 실패 시 DATABASE_URL 형식 확인
# 올바른 형식: postgresql://user:pass@host:5432/dbname
```

### 문제 3: 스키마 적용 안 됨

**증상**: 테이블이 생성되지 않음

**해결**:
```bash
# 로컬에서 스키마 확인
npm run check

# Railway에서 수동 적용
railway run npm run db:push

# Railway 대시보드에서 PostgreSQL 접속하여 테이블 확인
```

## 📊 데이터베이스 분리 확인

### Railway PostgreSQL 확인
```bash
# Railway CLI로 데이터베이스 접속
railway connect Postgres

# 테이블 목록 확인
\dt

# 사용자 수 확인 (Replit과 다른 데이터여야 함)
SELECT COUNT(*) FROM users;
```

### Replit Neon DB 확인
- Replit 콘솔에서 확인
- 두 데이터베이스의 데이터가 완전히 독립적이어야 함

## 🎨 Google Imagen 설정 (선택)

Railway에서 이미지 생성 기능을 사용하려면:

1. **Service Account JSON 파일 업로드**
   ```bash
   # Railway CLI 사용
   railway run --upload service-account-key.json
   ```

2. **환경 변수 설정**
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json
   ```

## 💰 비용 관리

### Railway PostgreSQL 비용
- 약 $5/월 (기본 플랜)
- Replit의 Neon DB와 별도 과금
- 독립적인 데이터베이스 운영 비용

### 총 예상 비용
```
서버 인스턴스 (Railway): ~$10-15/월
PostgreSQL (Railway): ~$5/월
Replit 배포: 별도
---
Railway 총 비용: ~$15-20/월
```

## 🔄 배포 업데이트

### 코드 변경 시
```bash
git add .
git commit -m "Update features"
git push origin main
# Railway가 자동으로 재배포
```

### 환경 변수 변경 시
1. Railway Variables 탭에서 수정
2. **Redeploy** 클릭

### 데이터베이스 스키마 변경 시
```bash
# shared/schema.ts 수정 후
railway run npm run db:push
```

## 🔐 보안 권고

1. **별도의 SESSION_SECRET 사용**
   - Replit과 다른 세션 시크릿 키 설정
   - 환경 간 세션 혼동 방지

2. **API 키 분리 (선택)**
   - 가능하면 Replit과 다른 API 키 사용
   - 사용량 추적 및 관리 용이

3. **CORS 설정**
   - Railway 도메인만 허용
   - Replit 도메인과 분리

## 📞 지원

### Railway 문제
- Railway 문서: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

### 프로젝트 문제
- GitHub Issues 생성
- RAILWAY_DEPLOYMENT.md 참고

## ✨ 정리

이제 **Railway와 Replit이 완전히 독립적으로 운영**됩니다:

✅ Railway는 자체 PostgreSQL 사용  
✅ Replit은 Neon DB 사용  
✅ 두 환경의 데이터가 완전히 분리됨  
✅ 서로 간섭 없이 독립적으로 운영  

---

**작성일**: 2025년 1월 16일  
**목적**: Railway-Replit 독립 배포 설정
