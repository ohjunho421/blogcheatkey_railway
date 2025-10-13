# Railway 배포 가이드 - 블로그치트키

## 🚂 Railway란?

Railway는 Git 기반 자동 배포를 지원하는 현대적인 클라우드 플랫폼입니다. Heroku의 대안으로 인기있으며, 간단한 설정으로 Node.js, PostgreSQL 등을 배포할 수 있습니다.

## 📋 사전 준비

### 1. Railway 계정 생성
1. [Railway.app](https://railway.app) 방문
2. GitHub 계정으로 회원가입
3. 신용카드 등록 (무료 플랜: $5/월 크레딧 제공)

### 2. 필요한 API 키 준비
다음 API 키들을 미리 준비하세요:

```
✅ ANTHROPIC_API_KEY (Claude)
✅ GOOGLE_API_KEY (Gemini)  
✅ PERPLEXITY_API_KEY (Perplexity)
✅ PORTONE_API_KEY (포트원 결제)
✅ PORTONE_API_SECRET (포트원 결제)
✅ VITE_PORTONE_STORE_ID (포트원 스토어 ID)
```

## 🚀 배포 단계

### 1단계: GitHub 레포지토리 준비

```bash
# Git 초기화 (아직 안 했다면)
git init

# 변경사항 커밋
git add .
git commit -m "Railway 배포 준비"

# GitHub에 푸시
git remote add origin https://github.com/your-username/blogcheatkey.git
git branch -M main
git push -u origin main
```

### 2단계: Railway 프로젝트 생성

#### 방법 A: Railway 웹사이트 사용

1. **New Project** 클릭
2. **Deploy from GitHub repo** 선택
3. 레포지토리 선택 (blogcheatkey)
4. 자동으로 배포 시작됨

#### 방법 B: Railway CLI 사용

```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 초기화
railway init

# 배포
railway up
```

### 3단계: PostgreSQL 데이터베이스 추가

1. Railway 대시보드에서 **New** 클릭
2. **Database → PostgreSQL** 선택
3. 자동으로 `DATABASE_URL` 환경변수 생성됨

### 4단계: 환경 변수 설정

Railway 대시보드에서 **Variables** 탭으로 이동:

```bash
# AI API 키
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
GOOGLE_API_KEY=AIzaxxxxxxxxxxxx
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxx

# 결제 시스템
PORTONE_API_KEY=imp_xxxxxxxxxxxx
PORTONE_API_SECRET=xxxxxxxxxxxx
VITE_PORTONE_STORE_ID=imp_xxxxxxxxxxxx

# 데이터베이스 (자동 생성됨)
DATABASE_URL=postgresql://postgres:...

# Node 환경
NODE_ENV=production

# 포트 (Railway가 자동 설정)
PORT=${{PORT}}
```

### 5단계: 데이터베이스 스키마 적용

```bash
# Railway CLI로 연결
railway link

# 데이터베이스 스키마 푸시
railway run npm run db:push
```

### 6단계: 배포 확인

1. **Deployments** 탭에서 빌드 로그 확인
2. 성공 시 도메인 URL 생성됨 (예: `blogcheatkey.up.railway.app`)
3. Health check 확인: `https://your-app.up.railway.app/health`

## 📊 배포 설정 파일

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### nixpacks.toml
```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"
```

## 🔧 트러블슈팅

### 문제 1: 빌드 실패

**증상**: "Build failed" 에러
**해결**:
```bash
# 로컬에서 빌드 테스트
npm run build

# 에러 확인 후 수정
git add .
git commit -m "Fix build errors"
git push
```

### 문제 2: 데이터베이스 연결 실패

**증상**: "Database connection error"
**해결**:
1. Railway 대시보드에서 DATABASE_URL 확인
2. Neon PostgreSQL 사용 시:
```bash
# .env 파일에 추가
DATABASE_URL=postgresql://username:password@host/dbname?sslmode=require
```

### 문제 3: 환경 변수 누락

**증상**: "API key not found"
**해결**:
1. Railway Variables 탭에서 모든 API 키 확인
2. 변경 후 **Redeploy** 클릭

### 문제 4: 포트 에러

**증상**: "Port already in use"
**해결**:
- `server/index.ts`에서 `process.env.PORT` 사용 확인 (이미 수정됨)
```typescript
const port = parseInt(process.env.PORT || "5000", 10);
```

### 문제 5: 메모리 부족

**증상**: "Out of memory"
**해결**:
1. Railway 대시보드 → **Settings**
2. **Resources** 탭에서 메모리 증가 (512MB → 1GB)

## 💰 비용 관리

### Railway 무료 플랜
- 매월 $5 크레딧 제공
- 실행 시간 기준 과금
- Sleep 모드 지원

### 예상 비용 (중간 트래픽)
```
서버 인스턴스: ~$10-15/월
PostgreSQL DB: ~$5/월
총 예상: ~$15-20/월
```

### 비용 절감 팁
1. **Sleep 설정**: 비활성 시 자동 슬립
2. **최소 리소스**: 초기에는 512MB 메모리로 시작
3. **DB 최적화**: 인덱스 추가, 쿼리 최적화

## 🔐 보안 설정

### 1. 환경 변수 보호
- 절대 `.env` 파일을 Git에 커밋하지 마세요
- Railway Variables만 사용

### 2. CORS 설정
```typescript
// server/index.ts에 추가
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-domain.com',
  credentials: true
}));
```

### 3. Rate Limiting
```bash
npm install express-rate-limit
```

## 📈 모니터링

### Railway 대시보드
- **Metrics**: CPU, 메모리, 네트워크 사용량
- **Logs**: 실시간 로그 확인
- **Deployments**: 배포 히스토리

### 외부 모니터링 (선택)
- **Sentry**: 에러 추적
- **LogRocket**: 사용자 행동 분석
- **UptimeRobot**: 가동시간 모니터링

## 🔄 CI/CD 자동 배포

### GitHub Actions (선택)
Railway는 Git push 시 자동 배포되지만, 추가 테스트를 원하면:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Railway
        run: npm install -g @railway/cli
      - name: Deploy
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## 🌐 커스텀 도메인 연결

### 1. Railway에서 설정
1. **Settings** → **Domains**
2. **Custom Domain** 추가
3. CNAME 레코드 받기 (예: `your-app.up.railway.app`)

### 2. 도메인 제공업체에서 설정
```
Type: CNAME
Name: www (또는 원하는 서브도메인)
Value: your-app.up.railway.app
TTL: 3600
```

### 3. SSL 인증서
- Railway가 자동으로 Let's Encrypt SSL 제공
- 추가 설정 불필요

## 📞 추가 지원

### Railway 공식 리소스
- 문서: https://docs.railway.app
- Discord: https://discord.gg/railway
- 커뮤니티 포럼: https://help.railway.app

### 프로젝트 관련 문의
- GitHub Issues
- CHANGELOG.md 참고
- OPTIMIZATION_IMPROVEMENTS.md 참고

## ✅ 배포 체크리스트

배포 전 확인사항:

- [ ] GitHub 레포지토리 생성 및 코드 푸시
- [ ] Railway 계정 생성
- [ ] 모든 API 키 준비 완료
- [ ] PostgreSQL 데이터베이스 추가
- [ ] 환경 변수 모두 설정
- [ ] `npm run build` 로컬 테스트 성공
- [ ] Health check 엔드포인트 확인 (`/health`)
- [ ] 데이터베이스 스키마 적용 (`db:push`)
- [ ] 배포 후 로그 확인
- [ ] 실제 서비스 테스트 (콘텐츠 생성)

## 🎉 배포 완료 후

축하합니다! 블로그치트키가 Railway에서 실행 중입니다.

다음 단계:
1. 커스텀 도메인 연결
2. 모니터링 설정
3. 정기 백업 구성
4. 성능 최적화

---

**작성일**: 2025년 1월 14일  
**작성자**: AI Agent (Cascade)  
**버전**: v1.1.0 (Railway 배포 지원)
