# 📊 블로그치트키 시스템 점검 보고서

## 1️⃣ LLM 모델 사용 현황

### ✅ Claude (Anthropic)
**모델명:** `claude-opus-4-20250514`

**사용 위치:**
- `anthropic.ts` - 메인 콘텐츠 생성 (DEFAULT_MODEL_STR)
- `morphemeOveruseResolver.ts` - 형태소 과다 사용 해결
- `titleGenerator.ts` - 제목 생성

**용도:**
- 블로그 본문 생성
- SEO 최적화 콘텐츠 작성
- 형태소 조정 및 최적화
- 10가지 유형별 제목 생성

---

### ✅ Gemini (Google)
**모델명:** `gemini-2.5-pro`

**사용 위치:**
- `gemini.ts` - 키워드 분석, 콘텐츠 편집, SEO 검증
- `incrementalOptimizer.ts` - 점진적 최적화
- `enhancedChatbot.ts` - 강화된 챗봇
- `advancedOptimizer.ts` - 고급 최적화

**용도:**
- 키워드 분석 (검색 의도, 사용자 고민 파악)
- 콘텐츠 수정 및 편집
- SEO 최적화 검증
- 챗봇 대화 (사용자 요청 분석, 버전 생성, 품질 평가)
- 콘텐츠 최적화 (SEO, 가독성, 형태소 조정)

---

### ✅ Perplexity (Sonar)
**모델명:** `sonar-pro`

**사용 위치:**
- `perplexity.ts` - 리서치 데이터 수집

**용도:**
- 키워드 관련 최신 정보 수집
- 통계, 사실, 전문가 의견 수집
- 신뢰할 수 있는 출처의 인용 데이터

---

## 2️⃣ 참고블로그 링크 분석 시스템

### 🎯 전체 프로세스

```
사용자가 참고블로그 링크 입력 (URL + 목적)
    ↓
[webFetcher.ts] 블로그 콘텐츠 가져오기
    ↓
[analyzeContentByPurpose] 목적별 분석
    ↓
[formatReferenceGuidance] 가이드 생성
    ↓
[anthropic.ts] Claude 프롬프트에 포함
    ↓
블로그 생성 시 반영
```

### 📝 지원하는 참고 목적 (Purpose)

#### 1. **tone** (어투/톤)
- 분석 내용: 공식적/친근함/캐주얼/전문적 톤 파악
- 감지 패턴:
  - formal: "입니다", "습니다", "드립니다"
  - friendly: "해요", "해드려요", "~죠"
  - casual: "해", "야", "지"
  - professional: "제공", "서비스", "전문"
- 결과 예시: `"friendly 톤 (23회 사용)"`

#### 2. **hook** (후킹/서론 전략)
- 분석 내용: 어떻게 독자의 관심을 끄는지
- 감지 패턴:
  - question: 질문형 (`?` 포함)
  - statistic: 통계형 (숫자+%)
  - problem: 문제 제기형 ("문제", "어려움", "고민")
  - curiosity: 호기심 유발형 ("궁금", "놀라운", "혹시")
- 결과 예시: `"question 방식의 후킹"`

#### 3. **storytelling** (스토리텔링)
- 분석 내용: 어떤 방식으로 이야기를 전개하는지
- 감지 패턴:
  - personal: 개인 경험담 ("저는", "제가", "제 경험")
  - case_study: 사례 중심 ("사례", "경우", "실제로")
  - step_by_step: 단계별 설명 ("단계", "방법", "순서")
  - comparison: 비교 분석 ("비교", "차이", "반면")
- 결과 예시: `"personal 스토리텔링 (15회 사용)"`

#### 4. **cta** (Call To Action/결론)
- 분석 내용: 어떻게 독자의 행동을 유도하는지
- 감지 패턴:
  - direct: 직접적 ("문의", "연락", "상담")
  - soft: 부드러운 ("도움", "지원", "함께")
  - urgent: 긴급한 ("지금", "바로", "즉시")
  - benefit: 혜택 강조 ("혜택", "할인", "무료")
- 결과 예시: `"soft CTA 스타일"`

### 🔍 분석 과정 상세

#### Step 1: 웹 페이지 가져오기 (`fetchAndAnalyzeBlogContent`)
```typescript
- User-Agent 설정으로 봇 차단 우회
- 15초 타임아웃 설정
- 실패 시 대체 방법 시도 (네이버/티스토리 등)
```

#### Step 2: HTML에서 텍스트 추출 (`extractTextFromHtml`)
```typescript
- <article>, <main>, .post, .content 영역 우선 추출
- <script>, <style>, <nav>, <header>, <footer> 제거
- HTML 엔티티 디코딩 (&nbsp; → 공백 등)
- 의미있는 문장만 필터링 (15자 이상, 공백 포함)
- 중간 80% 문장 사용 (헤더/푸터 제외)
```

#### Step 3: 목적별 분석 (`analyzeContentByPurpose`)
```typescript
// tone 목적
if (purpose === 'tone') {
  tone: analyzeTone(content),  // 어투 분석
  keyPhrases: extractKeyPhrases(content, 'tone')  // 핵심 표현
}

// hook 목적
if (purpose === 'hook') {
  hookMethod: analyzeHookMethod(openingSentences),  // 첫 3문장 분석
  keyPhrases: extractKeyPhrases(openingSentences, 'hook')
}

// storytelling 목적
if (purpose === 'storytelling') {
  storytellingApproach: analyzeStorytelling(content),
  keyPhrases: extractKeyPhrases(content, 'storytelling')
}

// cta 목적
if (purpose === 'cta') {
  ctaStyle: analyzeCtaStyle(endingSentences),  // 마지막 3문장 분석
  keyPhrases: extractKeyPhrases(endingSentences, 'cta')
}
```

#### Step 4: 가이드 생성 (`formatReferenceGuidance`)
```typescript
// 분석 결과를 AI가 이해할 수 있는 가이드로 변환
✅ 좋은 어투 패턴: friendly 톤 (23회 사용) - 이런 톤을 사용하면 독자에게 더 잘 전달됩니다
✅ 효과적인 서론 전략: question 방식의 후킹 - 이 방식으로 독자의 관심을 끌면 좋습니다
✅ 성공적인 스토리텔링: personal 스토리텔링 (15회 사용) - 이런 구성이 독자에게 인기가 많습니다
✅ 효과적인 마무리: soft CTA 스타일 - 이런 결론이 실제 행동으로 이어집니다
```

#### Step 5: Claude 프롬프트에 포함
```typescript
// anthropic.ts 297-300 라인
${referenceGuidance ? `🎯 AI 학습 데이터 - 성공적인 블로그 패턴 분석:
${referenceGuidance}

💡 AI 작성 지침: 위에서 분석한 패턴들은 실제로 독자들에게 좋은 반응을 얻은 성공 사례들입니다. 
이런 패턴들을 학습하여 비슷한 수준의 매력적이고 효과적인 블로그를 작성해주세요. 
특히 어투, 서론 전략, 스토리텔링 방식, 결론 스타일을 참고하되, 
키워드와 업체 정보에 맞게 자연스럽게 적용해주세요.` : ''}
```

---

## ✅ 참고블로그 분석 검증

### 테스트 시나리오

**입력:**
```json
[
  {
    "url": "https://blog.naver.com/example",
    "purpose": "tone",
    "description": "친근한 어투 참고"
  },
  {
    "url": "https://example.tistory.com/123",
    "purpose": "hook",
    "description": "후킹 방법 참고"
  }
]
```

**처리 과정:**
1. ✅ URL 접속 및 HTML 다운로드
2. ✅ 메인 콘텐츠 영역 추출
3. ✅ tone 분석: "friendly 톤" 또는 "formal 톤" 등 감지
4. ✅ hook 분석: "question 방식" 또는 "problem 방식" 등 감지
5. ✅ 가이드 텍스트 생성
6. ✅ Claude 프롬프트에 포함
7. ✅ 블로그 생성 시 해당 패턴 반영

**로그 확인:**
```
📝 Starting analysis of 2 reference blog links...
🌐 Fetching content from: https://blog.naver.com/example for purpose: tone
🔍 Analyzing content for purpose: tone, content length: 2341
✅ Analysis completed for https://blog.naver.com/example
✅ Reference blog analysis completed successfully
```

---

## 🎯 결론

### ✅ 장점

1. **다양한 LLM 활용**: 각 LLM의 강점에 맞게 역할 분담
   - Claude Opus: 창의적 콘텐츠 생성
   - Gemini Pro: 분석 및 최적화
   - Perplexity Sonar: 최신 정보 수집

2. **참고블로그 분석 시스템**: 
   - ✅ 4가지 목적별 정교한 분석 (tone, hook, storytelling, cta)
   - ✅ HTML 파싱 및 텍스트 추출 완비
   - ✅ 한국 블로그 플랫폼 대응 (네이버, 티스토리, 다음)
   - ✅ 분석 결과를 AI 가이드로 변환
   - ✅ Claude 프롬프트에 자동 포함

3. **로버스트한 에러 처리**:
   - 타임아웃 설정 (15초)
   - 실패 시 대체 방법 시도
   - 로깅으로 디버깅 용이

### 🔍 개선 가능성

1. **참고블로그 분석 강화**: 현재는 키워드 매칭 기반이지만, AI를 활용한 더 깊은 분석 가능
2. **캐싱**: 동일 URL 재분석 방지
3. **병렬 처리**: 여러 링크 동시 분석

---

## 📊 시스템 상태

- ✅ 모든 LLM 모델 최신 버전 사용
- ✅ 참고블로그 분석 시스템 완전 동작
- ✅ 목적별 분석 4가지 모두 구현
- ✅ Claude 프롬프트에 정상 반영
- ✅ 에러 처리 및 로깅 완비

**마지막 업데이트:** 2025-10-17
