import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_ENV_VAR || "",
});

// 1순위: Gemini 2.5 Flash Image (속도+효율 최적화 이미지 전용 모델, 낮은 지연 시간)
const FAST_IMAGE_MODEL = "gemini-2.5-flash-image";
// 2순위: Gemini 3 Pro Image (4K, 텍스트 렌더링, 인포그래픽 전용)
const PRO_IMAGE_MODEL = "gemini-3-pro-image-preview";

// ============================================================
// 1. 이미지 생성 (공식 문서 기반 - Gemini 네이티브 이미지 생성)
// ============================================================

interface ImageGenerationResult {
  imageBase64: string;
  mimeType: string;
  prompt: string;
}

/**
 * Gemini generateContent 응답에서 이미지 파트를 추출
 * 공식 문서: response.candidates[0].content.parts[].inlineData
 */
function extractImageFromResponse(response: any): { imageBase64: string; mimeType: string } | null {
  // 공식 경로: candidates[0].content.parts[].inlineData
  const parts = response?.candidates?.[0]?.content?.parts;
  if (parts && Array.isArray(parts)) {
    for (const part of parts) {
      if (part.inlineData?.data) {
        return { imageBase64: part.inlineData.data, mimeType: part.inlineData.mimeType || "image/png" };
      }
    }
  }
  return null;
}

/**
 * 블로그 이미지 생성 - 스마트 전략
 * quality="high": Nano Banana Pro (gemini-3-pro-image-preview) 1순위 → 4K 고품질
 * quality="fast": Nano Banana (gemini-2.5-flash-image) 1순위 → 빠른 속도
 * - 기본 스타일: photo-realistic (실사)
 */
export async function generateBlogImage(
  keyword: string,
  description: string,
  style: "photo" | "illustration" | "infographic" = "photo",
  aspectRatio: "1:1" | "16:9" | "9:16" = "16:9",
  quality: "high" | "fast" = "high"
): Promise<ImageGenerationResult> {
  // 실사 품질 프롬프트: 짧고 구체적
  const stylePrompts: Record<string, string> = {
    photo: `Photorealistic, high resolution, professional photography. ${description}. Subject: ${keyword}. Studio lighting, sharp focus, 8K quality, no text, no watermark.`,
    illustration: `Professional digital illustration, ${description}. Topic: ${keyword}. Clean modern style, vibrant colors, detailed, no text overlay.`,
    infographic: `Professional infographic about "${keyword}". ${description}. Clean data visualization, icons, charts, modern flat design, readable Korean text labels.`,
  };

  const prompt = stylePrompts[style] || stylePrompts.photo;

  // 인포그래픽은 항상 Pro (텍스트 렌더링 필요)
  const useProFirst = quality === "high" || style === "infographic";

  if (useProFirst) {
    // === 품질 우선: Nano Banana Pro 1순위 ===
    try {
      console.log(`🎨 [HIGH] Nano Banana Pro 생성 시작: "${keyword}" (${style})`);
      const startTime = Date.now();

      const response = await ai.models.generateContent({
        model: PRO_IMAGE_MODEL,
        contents: prompt,
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: style === "infographic" ? "4K" : "2K",
          },
        },
      });

      const imageData = extractImageFromResponse(response);
      if (imageData) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ Nano Banana Pro 생성 완료 (${elapsed}초, ${(imageData.imageBase64.length / 1024).toFixed(0)}KB)`);
        return { imageBase64: imageData.imageBase64, mimeType: imageData.mimeType, prompt };
      }
    } catch (proError: any) {
      console.error("🔴 Nano Banana Pro 실패:", proError?.message || proError);
    }

    // Pro 실패 시 Flash로 fallback
    try {
      console.log(`🔄 [HIGH] Nano Banana fallback 시도...`);
      const startTime = Date.now();

      const response = await ai.models.generateContent({
        model: FAST_IMAGE_MODEL,
        contents: prompt,
        config: {
          responseModalities: ["Image"],
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        },
      });

      const imageData = extractImageFromResponse(response);
      if (imageData) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ Nano Banana fallback 완료 (${elapsed}초)`);
        return { imageBase64: imageData.imageBase64, mimeType: imageData.mimeType, prompt };
      }
    } catch (fallbackError: any) {
      console.error("🔴 Nano Banana fallback 실패:", fallbackError?.message);
    }
  } else {
    // === 속도 우선: Nano Banana 1순위 ===
    try {
      console.log(`🎨 [FAST] Nano Banana 생성 시작: "${keyword}" (${style})`);
      const startTime = Date.now();

      const response = await ai.models.generateContent({
        model: FAST_IMAGE_MODEL,
        contents: prompt,
        config: {
          responseModalities: ["Image"],
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        },
      });

      const imageData = extractImageFromResponse(response);
      if (imageData) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ Nano Banana 생성 완료 (${elapsed}초, ${(imageData.imageBase64.length / 1024).toFixed(0)}KB)`);
        return { imageBase64: imageData.imageBase64, mimeType: imageData.mimeType, prompt };
      }
    } catch (flashError: any) {
      console.error("🔴 Nano Banana 실패:", flashError?.message || flashError);
    }

    // Flash 실패 시 Pro로 fallback
    try {
      console.log(`🔄 [FAST] Nano Banana Pro fallback 시도...`);
      const startTime = Date.now();

      const response = await ai.models.generateContent({
        model: PRO_IMAGE_MODEL,
        contents: prompt,
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: "2K",
          },
        },
      });

      const imageData = extractImageFromResponse(response);
      if (imageData) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ Nano Banana Pro fallback 완료 (${elapsed}초)`);
        return { imageBase64: imageData.imageBase64, mimeType: imageData.mimeType, prompt };
      }
    } catch (fallbackError: any) {
      console.error("🔴 Nano Banana Pro fallback 실패:", fallbackError?.message);
    }
  }

  throw new Error("모든 이미지 생성 모델이 실패했습니다. 잠시 후 다시 시도해주세요.");
}

// ============================================================
// 2. 인포그래픽 생성 (Gemini 3 Pro Image - 네이티브 4K 인포그래픽)
// ============================================================

interface InfographicResult {
  html?: string;
  imageBase64: string;
  mimeType: string;
}

/**
 * Gemini 3 Pro Image로 네이티브 인포그래픽 이미지를 직접 생성
 * - 4K 해상도, 선명한 텍스트 렌더링
 * - Google Search 그라운딩으로 실시간 데이터 반영 가능
 */
export async function generateInfographicHTML(
  keyword: string,
  content: string,
  subtitles: string[]
): Promise<InfographicResult> {
  const keyPoints = subtitles.slice(0, 5).map((s, i) => `${i + 1}. ${s}`).join("\n");
  const contentSummary = content.substring(0, 1200);

  const prompt = `Generate a professional, visually stunning infographic image about "${keyword}".

Key sections to include:
${keyPoints}

Content summary for reference:
${contentSummary}

Design requirements:
- Vertical layout (portrait orientation), clean and modern
- Title at the top with "${keyword}" prominently displayed
- 3-5 sections with icons, charts, or data visualizations for each key point
- Use a professional color palette (blues, teals, or warm business tones)
- Include clear, readable text labels in Korean
- Modern flat design with subtle gradients
- Include relevant statistics, numbers, or key facts from the content
- Bottom section with a summary or key takeaway
- High quality, print-ready infographic style`;

  try {
    console.log(`📊 Gemini 3 Pro Image 인포그래픽 생성 시작: "${keyword}"`);

    const response = await ai.models.generateContent({
      model: PRO_IMAGE_MODEL,
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: "9:16",
          imageSize: "4K",
        },
      },
    });

    const imageData = extractImageFromResponse(response);
    if (imageData) {
      console.log(`✅ 인포그래픽 이미지 생성 완료 (4K)`);
      return {
        imageBase64: imageData.imageBase64,
        mimeType: imageData.mimeType,
      };
    }

    throw new Error("인포그래픽 이미지 데이터가 응답에 없습니다");
  } catch (error: any) {
    console.error("🔴 Gemini 3 인포그래픽 생성 실패:", error?.message || error);

    // Fallback: generateBlogImage의 infographic 스타일로 시도
    try {
      console.log("🔄 인포그래픽 fallback 시도...");
      const fallbackResult = await generateBlogImage(
        keyword,
        `Key points: ${subtitles.slice(0, 3).join(", ")}. Data visualization infographic style.`,
        "infographic",
        "9:16"
      );
      return {
        imageBase64: fallbackResult.imageBase64,
        mimeType: fallbackResult.mimeType,
      };
    } catch (fallbackError: any) {
      console.error("🔴 인포그래픽 fallback도 실패:", fallbackError?.message);
    }

    throw new Error(`인포그래픽 생성 실패: ${error?.message || "알 수 없는 오류"}`);
  }
}

// ============================================================
// 3. 자동 이미지 생성 - 문단별 이미지 제안 및 생성
// ============================================================

interface ParagraphImageSuggestion {
  paragraphIndex: number;
  subtitle: string;
  imageDescription: string;
  imageType: "photo" | "illustration" | "infographic";
  priority: "high" | "medium" | "low";
}

interface AutoImageResult {
  suggestions: ParagraphImageSuggestion[];
  generatedImages: Array<{
    paragraphIndex: number;
    subtitle: string;
    imageBase64: string;
    mimeType: string;
  }>;
}

/**
 * 블로그 글을 분석하여 문단별 이미지를 자동 제안하고 생성
 */
export async function generateAutoImages(
  keyword: string,
  content: string,
  subtitles: string[],
  generateAll: boolean = false
): Promise<AutoImageResult> {
  // Step 1: Gemini로 문단별 이미지 제안 생성
  const analysisPrompt = `당신은 블로그 비주얼 전문가입니다.

다음 블로그 글을 분석하여 각 소제목(문단)에 어울리는 이미지를 제안하세요.

키워드: "${keyword}"
소제목들: ${subtitles.map((s, i) => `${i + 1}. ${s}`).join("\n")}

블로그 내용:
${content.substring(0, 2000)}

각 소제목에 대해 다음을 JSON 배열로 반환하세요:
[
  {
    "paragraphIndex": 0,
    "subtitle": "소제목",
    "imageDescription": "이미지 설명 (영어, 구체적으로)",
    "imageType": "photo" | "illustration" | "infographic",
    "priority": "high" | "medium" | "low"
  }
]

규칙:
- imageDescription은 영어로 작성 (이미지 생성 프롬프트로 사용됨)
- 블로그 내용의 이해를 돕는 시각적 요소에 집중
- priority "high": 반드시 이미지가 필요한 핵심 문단
- priority "medium": 이미지가 있으면 좋은 문단
- priority "low": 텍스트만으로 충분한 문단
- 최소 2개 이상은 "high" priority로 지정

JSON 배열만 반환:`;

  try {
    console.log(`🤖 자동 이미지 분석 시작: "${keyword}"`);

    const analysisResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
      },
      contents: analysisPrompt,
    });

    const suggestions: ParagraphImageSuggestion[] = JSON.parse(
      analysisResponse.text || "[]"
    );

    console.log(`📋 ${suggestions.length}개 이미지 제안 생성 완료`);

    // Step 2: 이미지 생성 (generateAll이면 전부, 아니면 high priority만)
    const toGenerate = generateAll
      ? suggestions
      : suggestions.filter((s) => s.priority === "high");

    const generatedImages: AutoImageResult["generatedImages"] = [];

    for (const suggestion of toGenerate) {
      try {
        console.log(
          `🎨 이미지 생성 중: "${suggestion.subtitle}" (${suggestion.imageType})`
        );

        const result = await generateBlogImage(
          keyword,
          suggestion.imageDescription,
          suggestion.imageType,
          "16:9",
          "fast"
        );

        generatedImages.push({
          paragraphIndex: suggestion.paragraphIndex,
          subtitle: suggestion.subtitle,
          imageBase64: result.imageBase64,
          mimeType: result.mimeType,
        });

        console.log(`✅ "${suggestion.subtitle}" 이미지 생성 완료`);
      } catch (imgError: any) {
        console.error(
          `⚠️ "${suggestion.subtitle}" 이미지 생성 실패:`,
          imgError?.message
        );
      }
    }

    console.log(
      `🏁 자동 이미지 생성 완료: ${generatedImages.length}/${toGenerate.length}개 성공`
    );

    return { suggestions, generatedImages };
  } catch (error: any) {
    console.error("🔴 자동 이미지 분석 실패:", error?.message || error);
    throw new Error(
      `자동 이미지 생성 실패: ${error?.message || "알 수 없는 오류"}`
    );
  }
}

/**
 * 사용자 요청에서 이미지 장수를 파싱
 * "10장 그려줘", "5개 만들어줘", "이미지 3장" 등
 */
function parseImageCount(request: string): number {
  const match = request.match(/(\d+)\s*(?:장|개|매|枚|개씩|장씩)/);
  if (match) {
    const count = parseInt(match[1]);
    return Math.min(Math.max(count, 1), 10); // 1~10장 제한
  }
  return 1;
}

/**
 * 챗봇에서 사용자 요청에 따라 이미지를 생성 (다중 이미지 지원)
 * - "10장 그려줘" → 10장 생성, 각각 다른 variation
 * - 기본: 실사(photo-realistic) 스타일
 * - 인포그래픽/일러스트 명시 요청 시에만 스타일 변경
 */
export async function generateChatImage(
  userRequest: string,
  keyword: string,
  content: string
): Promise<ImageGenerationResult[]> {
  // 빠른 스타일 감지 (AI 분석 없이 키워드 매칭으로 속도 개선)
  const lowerReq = userRequest.toLowerCase();
  let style: "photo" | "illustration" | "infographic" = "photo"; // 기본: 실사
  let aspectRatio: "1:1" | "16:9" | "9:16" = "16:9";

  if (/인포그래픽|infographic|도표|차트|시각화|다이어그램|통계/.test(lowerReq)) {
    style = "infographic";
    aspectRatio = "9:16";
  } else if (/일러스트|illustration|그림|만화|캐릭터|아이콘/.test(lowerReq)) {
    style = "illustration";
  } else if (/세로|portrait|9:16/.test(lowerReq)) {
    aspectRatio = "9:16";
  } else if (/정사각|square|1:1/.test(lowerReq)) {
    aspectRatio = "1:1";
  }

  const count = parseImageCount(userRequest);
  const contentHint = content.substring(0, 300).replace(/\n/g, ' ').trim();

  // 다중 이미지: 각각 다른 variation 프롬프트
  const variations = [
    "", // 기본
    "Different angle and composition.",
    "Close-up detail shot.",
    "Wide establishing shot.",
    "Dramatic lighting and mood.",
    "Bright and cheerful atmosphere.",
    "Minimalist clean composition.",
    "Dynamic action-oriented view.",
    "Warm golden hour lighting.",
    "Cool blue-toned professional look.",
  ];

  const results: ImageGenerationResult[] = [];
  // 다중 이미지는 속도를 위해 "fast" 모드, 단일은 "high" 모드
  const quality = count > 1 ? "fast" as const : "high" as const;

  console.log(`🎨 챗봇 이미지 생성: "${keyword}" (${style}, ${aspectRatio}, ${count}장, ${quality})`);

  for (let i = 0; i < count; i++) {
    try {
      const variation = count > 1 ? ` ${variations[i % variations.length]}` : "";
      const description = `${userRequest}.${variation} Context: blog about ${keyword}. ${contentHint.substring(0, 100)}`;

      console.log(`🎨 이미지 ${i + 1}/${count} 생성 중...`);
      const result = await generateBlogImage(keyword, description, style, aspectRatio, quality);
      results.push(result);
    } catch (error: any) {
      console.error(`🔴 이미지 ${i + 1}/${count} 생성 실패:`, error?.message || error);
      // 하나 실패해도 나머지 계속 생성
    }
  }

  if (results.length === 0) {
    throw new Error("이미지 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
  }

  console.log(`✅ 챗봇 이미지 생성 완료: ${results.length}/${count}장 성공`);
  return results;
}
