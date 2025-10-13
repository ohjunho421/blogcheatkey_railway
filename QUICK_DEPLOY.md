# 🚀 빠른 Railway 배포 가이드 (5분 완성)

## 1️⃣ GitHub 업로드 (2분)

```bash
# 현재 디렉토리에서 실행
git init
git add .
git commit -m "Initial commit for Railway deployment"

# GitHub에서 새 레포지토리 생성 후
git remote add origin https://github.com/YOUR_USERNAME/blogcheatkey.git
git branch -M main
git push -u origin main
```

## 2️⃣ Railway 배포 (3분)

### A. Railway 웹사이트로 배포

1. **Railway 접속**: https://railway.app
2. **"Start a New Project"** 클릭
3. **"Deploy from GitHub repo"** 선택
4. **레포지토리 선택**: `blogcheatkey`
5. ✅ 자동 배포 시작!

### B. 데이터베이스 추가

1. 같은 프로젝트에서 **"+ New"** 클릭
2. **"Database"** → **"PostgreSQL"** 선택
3. ✅ DATABASE_URL 자동 연결!

### C. 환경 변수 설정

**Variables** 탭에서 다음 추가:

```bash
# 필수 API 키
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxx
GOOGLE_API_KEY=AIzaxxxxxxxxxxxx
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxx

# 결제 시스템 (선택)
PORTONE_API_KEY=imp_xxxxxxxxxxxx
PORTONE_API_SECRET=xxxxxxxxxxxx
VITE_PORTONE_STORE_ID=imp_xxxxxxxxxxxx

# 환경 설정
NODE_ENV=production
```

### D. 데이터베이스 초기화

```bash
# Railway CLI 설치 (처음 1번만)
npm install -g @railway/cli

# Railway 로그인
railway login

# 프로젝트 연결
railway link

# DB 스키마 적용
railway run npm run db:push
```

## 3️⃣ 배포 확인

1. **Deployments** 탭에서 상태 확인
2. URL 받기: `https://your-app.up.railway.app`
3. Health Check: `https://your-app.up.railway.app/health`
4. ✅ 완료!

## 🎯 한 줄 명령어 배포 (CLI)

```bash
# Railway CLI로 원클릭 배포
npx @railway/cli up
```

## ⚡ 빠른 문제 해결

### 빌드 실패?
```bash
# 로컬 빌드 테스트
npm run build

# 성공하면 푸시
git add .
git commit -m "Fix build"
git push
```

### 환경 변수 누락?
Railway 대시보드 → **Variables** → 키 추가 → **Redeploy**

### 데이터베이스 에러?
```bash
railway run npm run db:push
```

## 📊 예상 비용

- **무료 플랜**: 매월 $5 크레딧 (소규모 테스트용)
- **기본 사용**: 월 $10-20 (중간 트래픽)

## 🔗 유용한 링크

- **Railway 대시보드**: https://railway.app/dashboard
- **상세 가이드**: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- **Railway 문서**: https://docs.railway.app

---

**💡 Tip**: Railway는 Git push 시 자동 재배포됩니다!

```bash
# 코드 수정 후
git add .
git commit -m "Update features"
git push

# 🚂 Railway가 자동으로 새 버전 배포!
```
