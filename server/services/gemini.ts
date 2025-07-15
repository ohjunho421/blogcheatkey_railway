import { GoogleGenAI } from "@google/genai";
import type { KeywordAnalysis } from "@shared/schema";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_ENV_VAR || "default_key"
});

export async function analyzeKeyword(keyword: string): Promise<KeywordAnalysis> {
  if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY_ENV_VAR) {
    throw new Error("Gemini API key is not configured");
  }

  const prompt = `다음 키워드를 분석하여 블로그 작성에 필요한 정보를 제공해주세요.

키워드: "${keyword}"

분석해야 할 내용:
1. 이 키워드를 검색하는 사람들의 검색 의도 (왜 검색하는지, 어떤 정보를 원하는지)
2. 사용자들이 겪고 있는 구체적인 고민이나 어려움
3. 이 키워드로 블로그를 작성할 때 좋을 4개의 소제목 추천

다음 JSON 형식으로 응답해주세요:
{
  "searchIntent": "검색 의도에 대한 상세한 설명 (200-300자)",
  "userConcerns": "사용자들의 고민사항에 대한 설명 (200-300자)",
  "suggestedSubtitles": ["소제목1", "소제목2", "소제목3", "소제목4"]
}

각 소제목은 구체적이고 실용적이며, SEO에 최적화된 형태로 작성해주세요.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: "당신은 SEO 전문가이자 블로그 작성 전문가입니다. 사용자의 검색 의도를 정확히 파악하고, 실용적이고 도움이 되는 블로그 구조를 제안해주세요.",
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            searchIntent: { type: "string" },
            userConcerns: { type: "string" },
            suggestedSubtitles: { 
              type: "array", 
              items: { type: "string" },
              minItems: 4,
              maxItems: 4
            }
          },
          required: ["searchIntent", "userConcerns", "suggestedSubtitles"]
        }
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini");
    }

    const analysis: KeywordAnalysis = JSON.parse(rawJson);
    
    // Validate the response
    if (!analysis.searchIntent || !analysis.userConcerns || !analysis.suggestedSubtitles || analysis.suggestedSubtitles.length !== 4) {
      throw new Error("Invalid analysis format received from Gemini");
    }

    return analysis;
  } catch (error) {
    console.error("Keyword analysis error:", error);
    throw new Error(`키워드 분석에 실패했습니다: ${error}`);
  }
}

export async function editContent(
  originalContent: string, 
  editRequest: string, 
  keyword: string
): Promise<string> {
  if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY_ENV_VAR) {
    throw new Error("Gemini API key is not configured");
  }

  const prompt = `다음 블로그 글을 사용자의 요청에 따라 수정해주세요.

원본 글:
${originalContent}

수정 요청:
${editRequest}

키워드: "${keyword}"

수정 시 다음 조건을 반드시 지켜주세요:
1. 키워드 형태소가 17-20회 범위 내에서 자연스럽게 출현해야 함
2. 글자수는 공백 제외 1700-2000자 범위를 유지해야 함
3. 서론-본론(4개 소주제)-결론 구조를 유지해야 함
4. 전문적이면서도 이해하기 쉬운 문체를 유지해야 함
5. SEO 최적화를 고려한 자연스러운 키워드 배치

수정된 전체 글을 반환해주세요.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: "당신은 SEO 최적화 블로그 편집 전문가입니다. 사용자의 요청을 반영하면서도 SEO 최적화 조건을 반드시 준수해주세요. 자연스럽고 읽기 쉬운 글을 작성하되, 키워드 밀도와 글자수 조건을 정확히 맞춰주세요."
      },
      contents: prompt,
    });

    const editedContent = response.text;
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
1. 키워드 형태소 출현 빈도가 17-20회 범위에 있는가?
2. 글자수가 공백 제외 1700-2000자 범위에 있는가?
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
      model: "gemini-2.5-flash",
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
