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

const MODEL = "gemini-2.5-pro";

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

**평가 기준 (Semantic Similarity Rating) - 후킹력 중심:**

1점 (매우 낮음):
- 키워드만 나열한 단순한 제목
- "~에 대해", "~알아보기" 같은 평범한 표현
- 클릭 욕구 전혀 없음
- 예: "자동차 정비 방법", "맛집 추천"

2점 (낮음):
- 기본적인 정보 전달만 함
- 감정적 자극 없음
- 예: "자동차 정비 잘하는 곳 소개", "맛있는 음식점 리스트"

3점 (보통):
- 약간의 호기심 자극
- 하지만 강렬한 후킹 부족
- 예: "자동차 정비, 이것만 알면 됩니다"

4점 (높음):
- 강한 감정적 자극 (놀람, 불안, 기대, 공감)
- 구체적인 숫자나 결과 제시
- 독자의 문제점을 정확히 짚음
- 예: "정비소에서 절대 말 안 해주는 3가지", "90%가 모르는 정비 비용 절감법"

5점 (매우 높음 - 후킹 완벽):
- 즉각적인 클릭 욕구 자극
- 강렬한 감정적 후킹 (충격, 긴급함, 비밀 공개)
- 읽지 않으면 손해볼 것 같은 느낌
- 구체적이고 독특한 관점
- 예: "이거 모르고 정비소 갔다가 50만원 날렸습니다", "사장님이 알려준 진짜 비밀"

**후킹 제목의 핵심 요소:**
1. 감정 자극: 놀람, 불안, 호기심, 공감, 분노
2. 구체성: 숫자, 금액, 기간, 결과
3. 긴급함: "지금", "바로", "꼭", "반드시"
4. 비밀/내부자 정보: "아무도 안 알려주는", "숨겨진", "진짜"
5. 손실 회피: "놓치면", "모르면 손해", "실패하는 이유"
6. 사회적 증거: "90%가", "전문가가", "성공한 사람들"

**감점 요소:**
- "~에 대해", "~알아보기" 같은 평범한 표현 사용 시 -1점
- 키워드만 나열한 경우 -1점
- 감정적 자극 없는 경우 -1점

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
  const prompt = `당신은 클릭률 높은 블로그 제목을 만드는 전문 카피라이터입니다.
글 내용을 분석하여 **강렬하게 후킹되는** 제목 25개를 생성하세요.

**키워드:** ${keyword}

**글 내용:**
${content.substring(0, 1500)}...

**🔥 후킹 제목의 핵심 원칙:**
1. **감정을 자극하라**: 놀람, 불안, 분노, 공감, 기대감
2. **구체적인 숫자를 써라**: "3가지", "90%", "50만원", "7일"
3. **손실 회피 심리를 자극하라**: "모르면 손해", "놓치면 후회"
4. **비밀/내부 정보 느낌**: "아무도 안 알려주는", "숨겨진 진실"
5. **긴급함을 만들어라**: "지금 당장", "이것만은 꼭"
6. **독자를 직접 지목하라**: "당신이", "이런 분들은"

**❌ 절대 사용 금지 (평범한 표현):**
- "~에 대해 알아보기"
- "~하는 방법"
- "~완벽 가이드"
- "~총정리"
- "~핵심 정리"
- "~이것만 알면 됩니다"

**25가지 후킹 스타일 (각 1개씩, 반드시 감정 자극 포함):**

1. **충격형**: "이거 모르고 ~했다가 큰일 났습니다"
2. **손실 회피형**: "~안 하면 매달 ~원씩 날립니다"
3. **비밀 폭로형**: "업계에서 절대 말 안 하는 ~의 진실"
4. **내부자 정보형**: "~년차 전문가가 몰래 알려주는 꿀팁"
5. **후회형**: "진작 알았으면 ~하지 않았을 텐데"
6. **경고형**: "이것만은 절대 하지 마세요, ~됩니다"
7. **반전형**: "알고 보니 ~가 오히려 독이었다"
8. **숫자 충격형**: "~% 사람들이 모르는 충격적인 사실"
9. **금액 구체형**: "~만원 아끼는 방법, 이거 하나면 끝"
10. **시간 긴급형**: "지금 안 하면 평생 후회할 ~"
11. **비교 충격형**: "~vs~ 비교해봤더니 결과가 충격"
12. **실패 사례형**: "~했다가 망한 사람들의 공통점"
13. **성공 비결형**: "~로 성공한 사람들이 숨기는 비밀"
14. **공감형**: "~때문에 고민이시죠? 저도 그랬습니다"
15. **분노 유발형**: "왜 아무도 ~에 대해 말 안 해주나요?"
16. **호기심 자극형**: "~하면 어떻게 될까? 직접 해봤습니다"
17. **권위 활용형**: "~전문가가 직접 밝힌 충격적인 사실"
18. **트렌드형**: "요즘 ~하는 사람들이 급증하는 이유"
19. **대비형**: "~전과 후, 이렇게 달라졌습니다"
20. **질문 도발형**: "아직도 ~하세요? 그러면 안 됩니다"
21. **해결책 제시형**: "~로 고생하셨다면, 이 방법 하나로 끝"
22. **희소성형**: "~% 사람들만 아는 숨겨진 방법"
23. **스토리형**: "~했더니 인생이 바뀌었습니다"
24. **경험담형**: "직접 ~해보고 알게 된 충격적인 사실"
25. **결론 선제시형**: "결론부터 말하면, ~하면 안 됩니다"

**⚠️ 중요:**
- 모든 제목에 감정적 후킹 요소 필수 포함
- 글 내용에서 가장 충격적이거나 유용한 정보를 제목에 반영
- 독자가 "이거 안 읽으면 손해"라고 느끼게 만들 것

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
