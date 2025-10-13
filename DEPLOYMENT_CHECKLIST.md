# ✅ Railway 배포 체크리스트

배포 전에 이 체크리스트를 확인하세요!

## 📋 배포 전 준비

### 코드 준비
- [ ] 모든 변경사항 커밋 완료
- [ ] `npm run build` 로컬 테스트 성공
- [ ] `npm run check` TypeScript 검사 통과
- [ ] `.env` 파일이 `.gitignore`에 포함됨
- [ ] `.env.example` 파일 생성 완료

### GitHub 설정
- [ ] GitHub 계정 생성/로그인
- [ ] 새 레포지토리 생성
- [ ] 코드 푸시 완료
- [ ] `main` 브랜치 확인

### API 키 준비
- [ ] Claude API 키 (ANTHROPIC_API_KEY)
- [ ] Gemini API 키 (GOOGLE_API_KEY)
- [ ] Perplexity API 키 (PERPLEXITY_API_KEY)
- [ ] 포트원 API 키 (PORTONE_API_KEY, PORTONE_API_SECRET)
- [ ] 포트원 스토어 ID (VITE_PORTONE_STORE_ID)

## 🚂 Railway 배포

### Railway 설정
- [ ] Railway 계정 생성 (GitHub 연동)
- [ ] 신용카드 등록 (무료 $5 크레딧용)
- [ ] 새 프로젝트 생성
- [ ] GitHub 레포지토리 연결

### 데이터베이스
- [ ] PostgreSQL 서비스 추가
- [ ] DATABASE_URL 자동 생성 확인
- [ ] 데이터베이스 스키마 적용 (`railway run npm run db:push`)

### 환경 변수
- [ ] ANTHROPIC_API_KEY 설정
- [ ] GOOGLE_API_KEY 설정
- [ ] PERPLEXITY_API_KEY 설정
- [ ] PORTONE_API_KEY 설정
- [ ] PORTONE_API_SECRET 설정
- [ ] VITE_PORTONE_STORE_ID 설정
- [ ] NODE_ENV=production 설정

### 배포 실행
- [ ] 첫 배포 트리거 (자동 또는 수동)
- [ ] 빌드 로그 확인 (에러 없이 성공)
- [ ] 배포 완료 확인
- [ ] 도메인 URL 받기

## 🧪 배포 후 테스트

### 기본 기능
- [ ] Health Check 엔드포인트: `/health` 확인
- [ ] Ping 엔드포인트: `/ping` 확인
- [ ] 메인 페이지 로딩 확인
- [ ] 정적 파일 (CSS, JS) 로딩 확인

### 핵심 기능
- [ ] 새 프로젝트 생성
- [ ] 키워드 분석 (Gemini API)
- [ ] 연구 데이터 수집 (Perplexity API)
- [ ] 콘텐츠 생성 (Claude API)
- [ ] 형태소 분석 정확도 확인
- [ ] 부분 최적화 동작 확인

### 데이터베이스
- [ ] 프로젝트 저장 테스트
- [ ] 프로젝트 불러오기 테스트
- [ ] 데이터 영속성 확인

### 성능
- [ ] 평균 응답 시간 확인 (< 5초)
- [ ] 콘텐츠 생성 시간 확인 (3-5분)
- [ ] 메모리 사용량 확인
- [ ] CPU 사용량 확인

## 🔧 배포 후 설정

### 모니터링
- [ ] Railway Metrics 확인 설정
- [ ] 로그 모니터링 설정
- [ ] 에러 알림 설정 (선택)
- [ ] Sentry 연동 (선택)

### 보안
- [ ] 환경 변수 모두 숨김 처리
- [ ] CORS 설정 확인
- [ ] Rate Limiting 적용 (선택)
- [ ] SSL/HTTPS 자동 적용 확인

### 도메인 (선택)
- [ ] 커스텀 도메인 준비
- [ ] Railway에 도메인 추가
- [ ] DNS CNAME 레코드 설정
- [ ] SSL 인증서 자동 발급 확인

## 📊 성능 최적화 (선택)

### 서버 리소스
- [ ] 메모리 사용량 모니터링
- [ ] 필요시 메모리 증설 (512MB → 1GB)
- [ ] Sleep 모드 설정 (비용 절감)
- [ ] Auto-scaling 설정

### 데이터베이스
- [ ] 인덱스 최적화
- [ ] 쿼리 성능 분석
- [ ] Connection Pooling 설정
- [ ] 백업 자동화

## 💰 비용 관리

### 초기 설정
- [ ] 무료 $5 크레딧 확인
- [ ] 사용량 알림 설정
- [ ] 예산 한도 설정
- [ ] 결제 정보 확인

### 정기 모니터링
- [ ] 주간 사용량 체크
- [ ] 월간 비용 분석
- [ ] 불필요한 서비스 정리
- [ ] 리소스 최적화

## 🚨 문제 해결

### 빌드 실패 시
1. [ ] 로컬에서 `npm run build` 재테스트
2. [ ] TypeScript 에러 수정
3. [ ] 의존성 버전 확인
4. [ ] Railway 로그 상세 확인

### 런타임 에러 시
1. [ ] 환경 변수 모두 설정 확인
2. [ ] API 키 유효성 확인
3. [ ] 데이터베이스 연결 확인
4. [ ] Railway Logs에서 에러 추적

### 성능 문제 시
1. [ ] Metrics에서 병목 확인
2. [ ] 메모리/CPU 사용량 체크
3. [ ] 데이터베이스 쿼리 최적화
4. [ ] 캐싱 전략 검토

## 📚 참고 문서

- [ ] [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - 5분 빠른 배포
- [ ] [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) - 상세 가이드
- [ ] [OPTIMIZATION_IMPROVEMENTS.md](./OPTIMIZATION_IMPROVEMENTS.md) - 성능 개선
- [ ] [HOW_TO_TEST.md](./HOW_TO_TEST.md) - 테스트 가이드

## 🎉 완료!

모든 체크리스트를 완료했다면 배포 성공입니다!

### 다음 단계
1. 실제 사용자 테스트
2. 피드백 수집
3. 기능 개선
4. 성능 모니터링

---

**배포 날짜**: _______________  
**배포 URL**: _______________  
**담당자**: _______________

**문제 발생 시**: 
- Railway Discord: https://discord.gg/railway
- GitHub Issues: (레포지토리 링크)
