# 블로그치트키 (BlogCheatKey)

AI 기반 SEO 최적화 블로그 콘텐츠 생성 플랫폼

## 📋 프로젝트 개요

블로그치트키는 다중 AI 모델을 활용하여 SEO에 최적화된 고품질 블로그 콘텐츠를 자동 생성하는 웹 애플리케이션입니다. 키워드 분석부터 이미지 생성까지 블로그 작성의 모든 과정을 AI가 자동화합니다.

## ✨ 주요 기능

### 🎯 SEO 최적화
- **키워드 형태소 분석**: 15-17회 정확한 키워드 출현 빈도 관리
- **글자수 최적화**: 1500-1700자 (공백 제외) 최적 길이 유지
- **구조화된 콘텐츠**: 서론-본론(4개 섹션)-결론 구조

### 🤖 AI 모델 통합
- **Claude Opus 4.0**: 메인 블로그 콘텐츠 생성 및 편집
- **Gemini 2.5 Pro**: 키워드 분석 및 콘텐츠 개선
- **Perplexity Sonar Pro**: 실시간 연구 데이터 수집
- **Google Imagen 3.0**: 인포그래픽 자동 생성

### 💳 구독 결제 시스템
- **베이직 플랜** (30,000원/월): 콘텐츠 생성
- **프리미엄 플랜** (50,000원/월): 콘텐츠 + 이미지 생성
- **프로 플랜** (100,000원/월): 모든 기능 + AI 챗봇 편집

## 🛠 기술 스택

### Frontend
- **React 18** with TypeScript
- **Vite** - 빠른 개발 환경
- **TailwindCSS** - 유틸리티 기반 스타일링
- **Radix UI** - 접근성 높은 컴포넌트
- **TanStack Query** - 서버 상태 관리
- **Wouter** - 경량 라우팅

### Backend
- **Node.js + Express** - REST API 서버
- **TypeScript** - 타입 안전성
- **PostgreSQL** - 데이터베이스
- **Drizzle ORM** - 타입 안전한 데이터베이스 조작
- **Session 관리** - PostgreSQL 세션 스토어

### 결제 시스템
- **포트원(PortOne)** - 월구독 결제 처리
- **정기결제** - customer_uid 기반 자동 갱신

## 🚀 설치 및 실행

### 배포 옵션

#### Railway 배포 (Replit과 독립 운영)
- **빠른 시작**: [RAILWAY_QUICK_START.md](RAILWAY_QUICK_START.md) 참고
- **상세 가이드**: [RAILWAY_INDEPENDENT_SETUP.md](RAILWAY_INDEPENDENT_SETUP.md) 참고
- **기본 배포**: [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) 참고

⚠️ **중요**: Railway는 자체 PostgreSQL을 사용하여 Replit/Neon DB와 완전히 독립적으로 운영됩니다.

### 환경 변수 설정
```bash
# AI API 키
ANTHROPIC_API_KEY=your_claude_api_key
GOOGLE_API_KEY=your_gemini_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key

# 포트원 결제
PORTONE_API_KEY=your_portone_api_key
PORTONE_API_SECRET=your_portone_secret
VITE_PORTONE_STORE_ID=your_store_id

# 데이터베이스
DATABASE_URL=your_postgresql_url
```

### 개발 환경 실행
```bash
# 의존성 설치
npm install

# 데이터베이스 스키마 적용
npm run db:push

# 개발 서버 실행
npm run dev
```

## 📁 프로젝트 구조

```
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/     # UI 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── hooks/          # 커스텀 훅
│   │   └── lib/           # 유틸리티 함수
├── server/                 # Express 백엔드
│   ├── services/          # AI 서비스 통합
│   ├── routes.ts          # API 라우트
│   └── storage.ts         # 데이터베이스 로직
├── shared/                # 공유 스키마 및 타입
└── drizzle.config.ts      # 데이터베이스 설정
```

## 🔄 워크플로우

1. **키워드 분석**: Gemini가 검색 의도 분석 및 소제목 제안
2. **데이터 수집**: Perplexity가 실시간 연구 자료 수집
3. **비즈니스 정보**: 사용자 업체 정보 입력
4. **콘텐츠 생성**: Claude가 SEO 최적화된 블로그 작성
5. **이미지 생성**: Imagen이 각 섹션별 인포그래픽 제작
6. **편집 및 개선**: AI 챗봇을 통한 실시간 콘텐츠 편집

## 📊 SEO 최적화 기준

- **키워드 출현**: 개별 형태소 15-17회 정확 관리
- **완성형 키워드**: 최소 5회 이상 포함
- **글자수**: 1500-1700자 (공백 제외)
- **과도 사용 방지**: 17회 초과 시 자동 조정
- **자연스러운 흐름**: 형태소 과용 해결 시스템

## 🎨 특징

### 사용자 정의 형태소
- 추가 형태소 입력 기능
- 실시간 배지 표시 및 카운트
- SEO 조건과 동시 만족

### 참고 블로그 분석
- 톤앤매너 학습
- 스토리텔링 패턴 분석
- CTA 스타일 적용

### 모바일 최적화
- 반응형 디자인
- 30자 단위 자동 줄바꿈
- 터치 친화적 UI

## 👥 사업자 정보

- **상호명**: 블로그치트키
- **사업자번호**: 456-05-03530
- **대표자**: 오준호
- **연락처**: 010-5001-2143

## 📝 라이선스

Copyright © 2025 블로그치트키. All rights reserved.

---

**블로그치트키**로 AI의 힘을 활용해 SEO 최적화된 블로그를 쉽고 빠르게 만들어보세요! 🚀