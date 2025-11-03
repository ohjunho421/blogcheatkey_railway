/**
 * SSR (Semantic Similarity Rating) 기반 제목 생성 및 평가 시스템
 * 논문 기반: "LLMs Reproduce Human Purchase Intent" (90% 정확도)
 * 
 * 프로세스:
 * 1. 글 내용 기반 25가지 다양한 스타일 제목 생성
 * 2. SSR로 모든 제목 평가 (클릭 유도력 1-5점)
 * 3. Top 5 제목만 선택
 */

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_ENV_VAR || '' 
});

const MODEL = "gemini-2.0-flash-exp";

interface EvaluatedTitle {
  title: string;
  score: number;
  type: string;
  reasoning: string;
}

interface SSRTitleResult {
  topTitles: EvaluatedTitle[];
  allTitles: EvaluatedTitle[];
  avgScore: number;
}

/**
 * SSR 기반 제목 평가
 * @param title 평가할 제목
 * @param keyword 키워드
 * @param content 글 내용
 * @returns 클릭 유도력 점수 (1-5점) 및 평가 근거
 */
async function evaluateTitleWithSSR(
  title: string,
  keyword: string,
  content: string
): Promise<{ score: number; reasoning: string }> {
  const prompt = `당신은 블로그 제목의 클릭 유도력을 평가하는 전문가입니다.

**평가 대상 제목:**
"${title}"

**키워드:** ${keyword}

**글 내용 (일부):**
${content.substring(0, 500)}...

**평가 기준 (Semantic Similarity Rating):**

1점 (매우 낮음):
- 키워드만 있고 흥미 요소 없음
- 너무 평범하거나 검색엔진 같은 제목
- 클릭 동기 제공 안 함

2점 (낮음):
- 기본적인 정보 전달만 함
- 약간의 호기심은 있으나 부족
- 차별화 요소 없음

3점 (보통):
- 적당한 호기심 자극
- 키워드와 내용 연관성 있음
- 평균적인 클릭률 예상

4점 (높음):
- 강한 호기심 자극
- 감정적 공감 또는 문제 해결 제시
- 구체적인 가치 제안
- 평균 이상의 클릭률 예상

5점 (매우 높음):
- 매우 강한 클릭 욕구 자극
- 독특한 관점이나 숨겨진 정보 암시
- 즉각적인 문제 해결 약속
- 최상위 클릭률 예상

**추가 평가 요소:**
- 키워드 자연스러운 포함 여부
- 글 내용과의 일치도
- 과장/허위 없는 정직성
- 적절한 길이 (15-30자)

JSON 형식으로 응답:
{
  "score": 1-5 사이 점수,
  "reasoning": "평가 근거 (100자 이내)"
}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      config: {
        systemInstruction: "제목의 클릭 유도력을 객관적으로 평가하는 전문가입니다.",
        responseMimeType: "application/json"
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const result = JSON.parse(response.text || '{"score": 3, "reasoning": "평가 실패"}');
    return {
      score: Math.max(1, Math.min(5, result.score)), // 1-5 범위 강제
      reasoning: result.reasoning
    };
  } catch (error) {
    console.error('SSR 평가 오류:', error);
    return { score: 3, reasoning: '평가 실패로 인한 기본 점수' };
  }
}

/**
 * 글 내용 기반 다양한 스타일 제목 생성 (25개)
 */
async function generateContentBasedTitles(
  keyword: string,
  content: string
): Promise<string[]> {
  const prompt = `블로그 글 내용을 깊이 분석하여 클릭을 유도하는 다양한 스타일의 제목 25개를 생성하세요.

**키워드:** ${keyword}

**글 내용:**
${content.substring(0, 1500)}...

**필수 조건:**
- 글의 핵심 메시지를 정확히 반영
- 키워드 "${keyword}"를 자연스럽게 포함
- 15-30자 길이 (이모지 제외)
- 과장 없이 정직한 표현
- 각 스타일별로 다양하게 생성

**25가지 스타일 (각 1개씩):**

1. **질문형 - 호기심**: "~인가요?", "왜 ~일까요?"
2. **질문형 - 반문**: "아직도 ~하시나요?", "정말 ~할까요?"
3. **숫자형 - 리스트**: "~가지 방법", "TOP 5"
4. **숫자형 - 통계**: "90%가 모르는", "3명 중 1명이"
5. **비밀형 - 전문가**: "전문가만 아는", "숨겨진 비밀"
6. **비밀형 - 내부자**: "업계가 숨기는", "아무도 알려주지 않는"
7. **경고형 - 주의**: "꼭 알아야 할", "반드시 확인"
8. **경고형 - 위험**: "하지 마세요", "피해야 할"
9. **효과형 - 즉시**: "~만으로도", "단 7일만에"
10. **효과형 - 극대화**: "2배로 늘리는", "30% 절감"
11. **비교형 - 전후**: "전과 후", "Before & After"
12. **비교형 - 대결**: "A vs B", "어떤 것이 더"
13. **실패형 - 후회**: "후회하는 이유", "실패한 사람들의 공통점"
14. **실패형 - 함정**: "이 실수만은", "놓치면 안 될"
15. **성공형 - 사례**: "성공한 사람들의 비밀", "이렇게 해결했습니다"
16. **성공형 - 검증**: "입증된 방법", "실제로 효과 본"
17. **시간형 - 긴급**: "지금 바로", "오늘부터"
18. **시간형 - 트렌드**: "2025년 최신", "요즘 대세는"
19. **감정형 - 공감**: "당신만 그런 게 아닙니다", "누구나 겪는"
20. **감정형 - 위로**: "괜찮습니다", "걱정 끝"
21. **권위형 - 전문성**: "전문가 추천", "의사가 말하는"
22. **권위형 - 검증**: "과학적으로 증명된", "연구 결과"
23. **초보형 - 가이드**: "초보자를 위한", "처음 시작하는"
24. **초보형 - 단계**: "단계별 가이드", "따라하기만 하면"
25. **반전형 - 상식파괴**: "사실은~였다", "진실은 달랐다"

JSON 배열로 정확히 25개 제목 반환:
["제목1", "제목2", ..., "제목25"]`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      config: {
        systemInstruction: "블로그 내용을 완벽히 이해하고 효과적인 제목을 만드는 전문가입니다.",
        responseMimeType: "application/json"
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const titles = JSON.parse(response.text || '[]');
    return Array.isArray(titles) ? titles : [];
  } catch (error) {
    console.error('글 기반 제목 생성 오류:', error);
    return [];
  }
}

/**
 * SSR 기반 제목 생성 및 평가 (메인 함수)
 * @param keyword 키워드
 * @param content 글 내용
 * @returns Top 5 제목 및 전체 평가 결과
 */
export async function generateAndEvaluateTitles(
  keyword: string,
  content: string
): Promise<SSRTitleResult> {
  console.log('🎯 SSR 기반 제목 생성 시작...');
  
  // Step 1: 글 내용 기반 다양한 스타일 제목 생성 (25개)
  console.log('📝 Step 1: 25가지 스타일로 제목 생성 중...');
  const contentBasedTitles = await generateContentBasedTitles(keyword, content);
  
  const allCandidates: Array<{ title: string; type: string }> = [];
  
  contentBasedTitles.forEach((title, index) => {
    // 스타일 번호를 type으로 저장 (1~25)
    allCandidates.push({ title, type: `style_${index + 1}` });
  });
  
  console.log(`✅ 총 ${allCandidates.length}개 제목 생성 완료`);
  
  // Step 2: SSR로 모든 제목 평가
  console.log('🔍 Step 2: SSR 기반 클릭 유도력 평가 시작...');
  const evaluatedTitles: EvaluatedTitle[] = [];
  
  for (const { title, type } of allCandidates) {
    const { score, reasoning } = await evaluateTitleWithSSR(title, keyword, content);
    evaluatedTitles.push({ title, score, type, reasoning });
    console.log(`  📊 "${title.substring(0, 25)}..." → ${score.toFixed(1)}점`);
  }
  
  // Step 3: 점수 순으로 정렬 및 Top 5 선택
  console.log('🏆 Step 3: 최고 점수 Top 5 제목 선택...');
  evaluatedTitles.sort((a, b) => b.score - a.score);
  
  const topTitles = evaluatedTitles.slice(0, 5);
  const avgScore = evaluatedTitles.reduce((sum, t) => sum + t.score, 0) / evaluatedTitles.length;
  
  console.log('\n✨ === Top 5 제목 (SSR 평가) ===');
  topTitles.forEach((t, i) => {
    console.log(`${i + 1}. ${t.title}`);
    console.log(`   점수: ${t.score.toFixed(1)}/5.0`);
    console.log(`   근거: ${t.reasoning}\n`);
  });
  
  console.log(`📊 전체 평균 점수: ${avgScore.toFixed(2)}/5.0`);
  console.log(`🎯 SSR 기반 제목 생성 완료!\n`);
  
  return {
    topTitles,
    allTitles: evaluatedTitles,
    avgScore
  };
}

/**
 * 간소화된 Top 5 제목만 반환 (챗봇 응답용)
 */
export async function generateTop5Titles(
  keyword: string,
  content: string
): Promise<Array<{ title: string; score: number }>> {
  const result = await generateAndEvaluateTitles(keyword, content);
  return result.topTitles.map(t => ({ title: t.title, score: t.score }));
}
