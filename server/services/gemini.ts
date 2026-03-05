import { GoogleGenAI } from "@google/genai";
import type { KeywordAnalysis } from "@shared/schema";
import { formatForMobileSmartBatch } from './smartMobileFormatter';

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-3.1-pro-preview" (Gemini 3.1, migrated from 3-pro-preview deprecated 2026-03-09)
//   - all functions use gemini-2.5-pro for text generation (stable, non-deprecated)
//   - Gemini 3.1 is a reasoning model that prefers concise, direct prompts

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_ENV_VAR || "default_key"
});

export async function analyzeKeyword(keyword: string, direction?: string): Promise<KeywordAnalysis> {
  if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY_ENV_VAR) {
    throw new Error("Gemini API key is not configured");
  }

  const directionLine = direction
    ? `\n글쓰기 목적/방향: "${direction}"\n이 목적/방향을 반드시 반영하여 소제목을 생성해주세요.`
    : '';

  const prompt = `키워드: "${keyword}"${directionLine}

다음 JSON 형식으로만 응답해주세요. 설명이나 다른 텍스트 없이 JSON만 반환해주세요:

{
  "searchIntent": "검색 의도 설명 (150-200자)",
  "userConcerns": "사용자 고민사항 (150-200자)",
  "suggestedSubtitles": ["소제목1", "소제목2", "소제목3", "소제목4"]
}`;

  // Retry logic for API overload - optimized for speed
  const maxRetries = 2;
  const retryDelay = 500; // Reduced from 1000ms to 500ms

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: direction
            ? "당신은 SEO 전문가이자 블로그 작성 전문가입니다. 사용자가 지정한 글쓰기 목적과 방향을 최우선으로 반영하여 블로그 구조를 제안해주세요."
            : "당신은 SEO 전문가이자 블로그 작성 전문가입니다. 사용자의 검색 의도를 정확히 파악하고, 실용적이고 도움이 되는 블로그 구조를 제안해주세요.",
        },
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
      });

      const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error("Empty response from Gemini");
      }

      // Extract JSON from the response
      let jsonStr = rawText.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      
      const analysis: KeywordAnalysis = JSON.parse(jsonStr.trim());
      
      // Validate the response
      if (!analysis.searchIntent || !analysis.userConcerns || !analysis.suggestedSubtitles || analysis.suggestedSubtitles.length !== 4) {
        throw new Error("Invalid analysis format received from Gemini");
      }

      return analysis;
    } catch (error: any) {
      console.error(`Keyword analysis attempt ${attempt} error:`, error);
      
      // Check if it's an API overload error
      if (error.status === 503 || (error.message && error.message.includes("overloaded"))) {
        if (attempt < maxRetries) {
          console.log(`API overloaded, retrying in ${retryDelay}ms... (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        } else {
          // Return fallback analysis after all retries
          console.log("All retries failed, returning fallback analysis");
          const directionNote = direction ? ` (방향: ${direction})` : '';
          return {
            searchIntent: `${keyword}에 대한 정보를 찾고 있는 사용자들은 실용적이고 구체적인 가이드를 원합니다. 이들은 단순한 정의보다는 실제 적용 방법, 장단점, 그리고 개인적인 경험이나 전문가 의견을 통해 더 깊이 있는 이해를 얻고자 합니다.`,
            userConcerns: `${keyword}를 검색하는 사용자들은 어디서부터 시작해야 할지 모르거나, 너무 많은 정보로 인해 혼란스러워합니다. 또한 신뢰할 수 있는 정보원을 찾기 어려워하며, 실제로 적용 가능한 구체적인 방법을 찾고 있습니다.`,
            suggestedSubtitles: [
              `${keyword}란 무엇인가? 기본 개념 정리${directionNote}`,
              `${keyword}의 주요 특징과 장점`,
              `${keyword} 시작하는 방법: 단계별 가이드`,
              `${keyword} 관련 주의사항과 전문가 조언`
            ]
          };
        }
      } else {
        // For other errors, throw immediately
        throw new Error(`키워드 분석에 실패했습니다: ${error.message || error}`);
      }
    }
  }

  // This should never be reached, but just in case
  throw new Error("키워드 분석에 실패했습니다: 최대 재시도 횟수 초과");
}

export async function suggestArticleDirections(
  keyword: string,
  searchIntent: string,
  userConcerns: string
): Promise<Array<{ id: string; label: string; description: string; angle: string }>> {
  const prompt = `키워드: "${keyword}"
검색 의도: ${searchIntent}
사용자 고민: ${userConcerns}

이 키워드로 블로그 글을 쓸 때 가능한 4가지 글 방향을 제안해주세요.
검색 의도와 다른 관점/각도의 방향들도 포함하여 다양하게 제안해주세요.

다음 JSON 형식으로만 응답하세요:
[
  {
    "id": "guide",
    "label": "단계별 가이드형",
    "description": "독자가 따라할 수 있는 방법/순서 중심 설명",
    "angle": "how-to 형식으로 구체적 단계와 팁 위주"
  },
  {
    "id": "comparison",
    "label": "비교/추천형",
    "description": "옵션들을 비교하여 최선의 선택을 안내",
    "angle": "장단점 비교와 상황별 추천 위주"
  },
  {
    "id": "problem_solution",
    "label": "문제해결형",
    "description": "독자의 고민과 문제를 직접 해결",
    "angle": "원인 분석과 해결책 제시 위주"
  },
  {
    "id": "expert_review",
    "label": "전문가 리뷰형",
    "description": "깊이 있는 전문 지식과 인사이트 제공",
    "angle": "전문 용어와 데이터 기반 심층 분석"
  }
]

위 형식을 참고하여 "${keyword}" 키워드에 맞게 4가지 방향을 제안하세요.
label, description, angle은 반드시 해당 키워드에 맞게 구체적으로 작성하세요.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: "당신은 SEO 블로그 전략 전문가입니다. 키워드에 맞는 다양한 글 방향을 제안합니다.",
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("Empty response");

    let jsonStr = rawText.trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

    const parsed = JSON.parse(jsonStr.trim());
    if (!Array.isArray(parsed)) throw new Error("Invalid format");
    return parsed;
  } catch (error) {
    // 기본 방향 제안 반환
    return [
      { id: "guide", label: "단계별 가이드형", description: "방법/순서 중심으로 독자가 따라할 수 있게 설명", angle: "how-to 형식으로 구체적 단계와 팁 위주" },
      { id: "comparison", label: "비교/추천형", description: "옵션들을 비교하여 최선의 선택을 안내", angle: "장단점 비교와 상황별 추천 위주" },
      { id: "problem_solution", label: "문제해결형", description: "독자의 고민과 문제를 직접 해결", angle: "원인 분석과 해결책 제시 위주" },
      { id: "expert_review", label: "전문가 리뷰형", description: "깊이 있는 전문 지식과 인사이트 제공", angle: "전문 데이터 기반 심층 분석" },
    ];
  }
}

export async function editContent(
  originalContent: string, 
  editRequest: string, 
  keyword: string,
  customMorphemes?: string
): Promise<string> {
  if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY_ENV_VAR) {
    throw new Error("Gemini API key is not configured");
  }

  // Extract keyword components for proper SEO instruction
  const components = keyword === "벤츠엔진경고등" ? ["벤츠", "엔진", "경고"] :
                     keyword.toLowerCase().includes("bmw") && keyword.includes("코딩") ? ["BMW", "코딩"] :
                     [keyword];

  const customMorphemesArray = customMorphemes ? customMorphemes.split(' ').filter(m => m.trim().length > 0) : [];

  // Analyze user request to understand intent better
  const analysisPrompt = `다음 사용자 요청을 분석하여 구체적인 수정 의도를 파악해주세요:

사용자 요청: "${editRequest}"

분석해야 할 내용:
1. 수정 대상 (서론/본론/결론/전체/특정 부분)
2. 수정 유형 (내용 추가/삭제/변경/톤 조정/구조 변경)
3. 구체적인 요구사항
4. 설득력 강화 요소 (감정적 어필/논리적 근거/신뢰성 강화 등)

JSON으로 응답:
{
  "target": "수정 대상",
  "type": "수정 유형", 
  "requirements": "구체적 요구사항",
  "persuasionElements": "설득력 강화 요소"
}`;

  // First, analyze the user request
  let requestAnalysis;
  try {
    const analysisResponse = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: "사용자의 요청을 정확히 분석하여 수정 의도를 파악하는 전문가입니다.",
        responseMimeType: "application/json"
      },
      contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }],
    });
    requestAnalysis = JSON.parse(analysisResponse.text || "");
  } catch (error) {
    console.log("Request analysis failed, proceeding with original request");
    requestAnalysis = {
      target: "전체",
      type: "내용 변경",
      requirements: editRequest,
      persuasionElements: "신뢰성 강화"
    };
  }

  const prompt = `다음 블로그 글을 사용자의 세부 요청에 따라 정교하게 수정해주세요.

=== 원본 글 ===
${originalContent}

=== 사용자 요청 ===
${editRequest}

=== 요청 분석 결과 ===
- 수정 대상: ${requestAnalysis.target}
- 수정 유형: ${requestAnalysis.type}  
- 구체적 요구사항: ${requestAnalysis.requirements}
- 설득력 강화 요소: ${requestAnalysis.persuasionElements}

=== 키워드 정보 ===
키워드: "${keyword}"
키워드 구성요소: ${components.join(', ')}
${customMorphemesArray.length > 0 ? `추가 포함 형태소: ${customMorphemesArray.join(', ')}` : ''}

=== 🚨 절대 준수 조건 🚨 ===
1. 완전한 키워드 "${keyword}" 최소 5회 자연스럽게 포함
2. 개별 키워드 구성요소들을 각각 정확히 15-17회 포함:
   ${components.map(comp => `   • "${comp}": 15-17회 (정확히)`).join('\n')}
3. 공백 제외 1500-1700자 범위 엄수 (초과/미달 절대 금지)
4. 서론-본론-결론 구조 완전 유지
5. 설득력 있는 글쓰기 기법 적용:
   - 독자의 감정에 어필하는 스토리텔링
   - 구체적인 사례와 근거 제시
   - 신뢰감을 주는 전문적 어조
   - 자연스러운 행동 유도 문구
${customMorphemesArray.length > 0 ? `6. 추가 형태소들 각각 최소 1회씩 자연스럽게 포함: ${customMorphemesArray.join(', ')}` : ''}

=== 📝 수정 가이드라인 ===
- 기존 글의 전체적인 흐름과 구조는 최대한 유지
- 사용자가 요청한 특정 부분만 집중적으로 수정
- ${requestAnalysis.target} 부분에 집중하여 부분 수정
- ${requestAnalysis.persuasionElements} 요소를 기존 맥락에 자연스럽게 추가
- 전체를 다시 쓰지 말고 요청된 부분만 개선
- 기존 문장의 어조와 스타일을 최대한 유지하면서 요청사항 반영

⚠️ 중요: 전체를 새로 작성하지 말고, 기존 글의 해당 부분만 수정하여 완전한 글을 반환해주세요.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: `당신은 SEO 최적화 블로그 수정 전문가입니다. 기존 블로그를 부분적으로 수정하는 것이 주 업무입니다.

핵심 원칙:
1. 기존 글의 전체적인 구조와 흐름은 최대한 보존
2. 사용자가 요청한 특정 부분만 집중적으로 개선
3. 전체를 새로 쓰지 말고 해당 부분만 수정하여 완성된 글 제공
4. 기존 문체와 톤을 유지하면서 요청사항 반영

SEO 최적화 조건 (수정 시에도 반드시 유지):
1. 완전한 키워드 "${keyword}" 최소 5회 포함
2. 키워드 구성 요소들(${components.join(', ')}) 각각 15-17회씩 정확히 포함
3. 공백 제외 1500-1700자 범위 엄수
${customMorphemesArray.length > 0 ? `4. 추가 형태소들(${customMorphemesArray.join(', ')}) 각각 최소 1회씩 포함` : ''}

수정 접근법: 기존 글의 좋은 부분은 그대로 두고, 요청된 부분만 개선하여 자연스럽게 통합하세요.`
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const editedContent = response.text || "";
    if (!editedContent) {
      throw new Error("Empty response from Gemini");
    }

    return editedContent;
  } catch (error) {
    console.error("Content editing error:", error);
    throw new Error(`콘텐츠 수정에 실패했습니다: ${error}`);
  }
}

export async function validateSEOOptimization(
  content: string, 
  keyword: string
): Promise<{
  isValid: boolean;
  keywordCount: number;
  characterCount: number;
  issues: string[];
}> {
  if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY_ENV_VAR) {
    throw new Error("Gemini API key is not configured");
  }

  const prompt = `다음 블로그 글의 SEO 최적화 상태를 검증해주세요.

키워드: "${keyword}"
글 내용:
${content}

검증 기준:
1. 키워드 형태소 출현 빈도가 15-17회 권장 범위에 있는가? (최대 20회 넘으면 안됨)
2. 글자수가 공백 제외 1700-1800자 범위에 있는가?
3. 키워드가 자연스럽게 배치되어 있는가?

다음 JSON 형식으로 응답해주세요:
{
  "isValid": boolean,
  "keywordCount": number,
  "characterCount": number,
  "issues": ["문제점들의 배열"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            isValid: { type: "boolean" },
            keywordCount: { type: "number" },
            characterCount: { type: "number" },
            issues: { type: "array", items: { type: "string" } }
          },
          required: ["isValid", "keywordCount", "characterCount", "issues"]
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini");
    }

    return JSON.parse(rawJson);
  } catch (error) {
    console.error("SEO validation error:", error);
    throw new Error(`SEO 검증에 실패했습니다: ${error}`);
  }
}

export async function enhanceIntroductionAndConclusion(
  content: string,
  keyword: string,
  businessInfo: { businessName: string; expertise: string; differentiators: string }
): Promise<string> {
  if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY_ENV_VAR) {
    throw new Error("Gemini API key is not configured");
  }

  const prompt = `다음 블로그 콘텐츠의 서론과 결론을 객관적이고 정보 전달형으로 개선해주세요.

🎯 모바일 가독성 최적화:
- 서론은 짧고 임팩트 있는 문장으로 구성
- 한 문장이 너무 길지 않게 (15-20자 내외)
- 의미 단위로 자연스러운 줄바꿈
- 호흡이 편안하게 읽히도록 구성

🚨 절대 금지 사항:
- 대화형 표현 ("안녕하세요", "여러분", "독자님들")
- 질문 형태나 독자 지칭 ("궁금하신가요?", "생각해보세요")
- 상담 유도 표현 ("문의하세요", "도움드리겠습니다")
- 메타 언급 ("이번 포스팅", "오늘 알아볼")

키워드: "${keyword}"
업체 정보:
- 업체명: ${businessInfo.businessName}
- 전문분야: ${businessInfo.expertise}
- 차별화요소: ${businessInfo.differentiators}

현재 콘텐츠:
${content}

개선 요구사항:
1. 서론 개선:
   - 전문성을 보여주는 키워드 관련 인사이트로 시작
   - 독자의 호기심을 자극하는 흥미로운 문제점이나 기회 제시
   - "이 글을 통해 알게 될" 가치를 은연중에 암시
   - 전문가의 관점에서 친근하게 설명하는 어투
   - 본문 내용에 대한 기대감 조성

2. 결론 개선:
   - 전문가답게 핵심 내용을 정리하되 친근한 톤 유지
   - 독자가 직접 시도할 수 있는 실용적 조언 제공
   - 복잡하거나 전문적인 부분은 업체 상담 필요성 언급
   - "혼자 하기 어려운 부분은 전문가와 상담" 유도
   - 업체 정보를 도움이 되는 맥락에서 자연스럽게 언급

3. 형태소 개수 유지:
   - 키워드 형태소 개수를 정확히 유지
   - 전체 내용의 자연스러운 흐름 보장

✅ 권장 표현 방식:
- "BMW 코딩 전문가로서 봤을 때, 최근 이런 트렌드가 주목받고 있죠"
- "업계 경험을 바탕으로 말씀드리면 이런 방법이 가장 효과적입니다"
- "실제 고객 사례를 보면 이런 결과들을 얻으실 수 있어요"
- "복잡한 설정은 전문가와 상담받으시는 게 좋을 것 같아요"
- "이런 경험 있으신가요?", "궁금하시죠?", "어떠신가요?"

완성된 블로그 포스트가 복사해서 바로 게시할 수 있도록 순수한 정보 전달형으로만 작성해주세요.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: "당신은 해당 분야의 전문가이면서도 매력적이고 자연스러운 블로그 어투로 글을 쓰는 전문가입니다. ~합니다, ~때문이죠, ~입니다, ~신가요? 같은 일반적인 블로그 톤을 사용하세요. 서론은 독자의 호기심을 자극하고 공감대를 형성하며 전문성을 어필하여 끝까지 읽고 싶게 만드세요. 결론은 핵심 내용을 요약하고 독자가 행동하고 싶게 만들며 전문가 상담을 자연스럽게 유도하세요.",
      },
      contents: prompt,
    });

    const enhancedContent = response.text;
    if (!enhancedContent) {
      throw new Error("Empty response from Gemini");
    }

    // AI 기반 모바일 포맷팅 적용
    console.log('서론/결론에 AI 스마트 모바일 포맷팅 적용 중...');
    const mobileFormattedContent = await formatForMobileSmartBatch(enhancedContent);
    
    return mobileFormattedContent;
  } catch (error) {
    console.error("Introduction and conclusion enhancement error:", error);
    throw new Error(`서론/결론 강화에 실패했습니다: ${error}`);
  }
}
