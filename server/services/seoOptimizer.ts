import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_ENV_VAR || "default_key"
});

export interface SEOAnalysis {
  keywordFrequency: number;
  characterCount: number;
  morphemeCount: number;
  isOptimized: boolean;
  issues: string[];
  suggestions: string[];
}

export async function analyzeSEOOptimization(content: string, keyword: string): Promise<SEOAnalysis> {
  if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY_ENV_VAR) {
    throw new Error("Gemini API key is not configured");
  }

  const prompt = `다음 블로그 글을 분석하여 SEO 최적화 상태를 확인해주세요.

키워드: "${keyword}"

분석 기준:
1. 키워드 형태소 출현 빈도가 17-20회 범위에 있는가?
2. 글자수가 공백 제외 1700-2000자 범위에 있는가?
3. 키워드가 자연스럽게 배치되어 있는가?

글 내용:
${content}

다음 JSON 형식으로 분석 결과를 제공해주세요:
{
  "keywordFrequency": 숫자,
  "characterCount": 숫자,
  "morphemeCount": 숫자,
  "isOptimized": boolean,
  "issues": ["문제점1", "문제점2"],
  "suggestions": ["개선방안1", "개선방안2"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            keywordFrequency: { type: "number" },
            characterCount: { type: "number" },
            morphemeCount: { type: "number" },
            isOptimized: { type: "boolean" },
            issues: { type: "array", items: { type: "string" } },
            suggestions: { type: "array", items: { type: "string" } }
          },
          required: ["keywordFrequency", "characterCount", "morphemeCount", "isOptimized"]
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
    console.error("SEO analysis error:", error);
    
    // Return default analysis if Gemini is unavailable
    const characterCount = content.replace(/\s/g, '').length;
    const keywordCount = (content.match(new RegExp(keyword, 'gi')) || []).length;
    
    return {
      keywordFrequency: keywordCount,
      characterCount: characterCount,
      morphemeCount: keywordCount,
      isOptimized: keywordCount >= 17 && keywordCount <= 20 && characterCount >= 1700 && characterCount <= 2000,
      issues: ["Gemini API 일시적 오류로 정확한 분석 불가"],
      suggestions: ["키워드 빈도와 글자수를 수동으로 확인해주세요"]
    };
  }
}

export function formatForMobile(content: string): string {
  // Split content into lines with max 22 characters per line
  const words = content.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length <= 22) {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join('\n');
}
