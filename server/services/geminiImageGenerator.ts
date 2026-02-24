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
 * 블로그 이미지 생성
 * - 1순위: gemini-2.5-flash-image (빠르고 효율적, 1024px, 낮은 지연 시간)
 * - 2순위: gemini-3-pro-image-preview (4K, 텍스트 렌더링, 인포그래픽)
 * - 기본 스타일: photo-realistic (실사)
 */
export async function generateBlogImage(
  keyword: string,
  description: string,
  style: "photo" | "illustration" | "infographic" = "photo",
  aspectRatio: "1:1" | "16:9" | "9:16" = "16:9"
): Promise<ImageGenerationResult> {
  // 실사 품질 프롬프트: 짧고 구체적
  const stylePrompts: Record<string, string> = {
    photo: `Photorealistic, high resolution, professional photography. ${description}. Subject: ${keyword}. Studio lighting, sharp focus, 8K quality, no text, no watermark.`,
    illustration: `Professional digital illustration, ${description}. Topic: ${keyword}. Clean modern style, vibrant colors, detailed, no text overlay.`,
    infographic: `Professional infographic about "${keyword}". ${description}. Clean data visualization, icons, charts, modern flat design, readable Korean text labels.`,
  };

  const prompt = stylePrompts[style] || stylePrompts.photo;

  // === 1순위: gemini-2.5-flash-image (빠른 이미지 전용 모델) ===
  // 인포그래픽은 텍스트 렌더링이 필요하므로 Gemini 3 Pro Image로 직행
  if (style !== "infographic") {
    try {
      console.log(`🎨 Gemini 2.5 Flash Image 생성 시작: "${keyword}" (${style})`);
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
        console.log(`✅ Gemini 2.5 Flash Image 생성 완료 (${elapsed}초, ${(imageData.imageBase64.length / 1024).toFixed(0)}KB)`);
        return { imageBase64: imageData.imageBase64, mimeType: imageData.mimeType, prompt };
      }
    } catch (flashError: any) {
      console.error("🔴 Gemini 2.5 Flash Image 실패:", flashError?.message || flashError);
    }
  }

  // === 2순위: gemini-3-pro-image-preview (인포그래픽 또는 Flash 실패 시) ===
  try {
    console.log(`🎨 Gemini 3 Pro Image 시도: "${keyword}" (${style})`);
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
      console.log(`✅ Gemini 3 Pro Image 생성 완료 (${elapsed}초)`);
      return { imageBase64: imageData.imageBase64, mimeType: imageData.mimeType, prompt };
    }
  } catch (proError: any) {
    console.error("🔴 Gemini 3 Pro Image 실패:", proError?.message || proError);
  }

  // === 3순위: gemini-2.5-flash-image TEXT+IMAGE 모드 (최후 fallback) ===
  try {
    console.log("🔄 Flash Image TEXT+IMAGE fallback 시도...");
    const fallbackResponse = await ai.models.generateContent({
      model: FAST_IMAGE_MODEL,
      contents: prompt,
      config: {
        responseModalities: ["Text", "Image"],
      },
    });

    const fallbackImage = extractImageFromResponse(fallbackResponse);
    if (fallbackImage) {
      console.log(`✅ Flash Image fallback 완료`);
      return { imageBase64: fallbackImage.imageBase64, mimeType: fallbackImage.mimeType, prompt };
    }
  } catch (fallbackError: any) {
    console.error("🔴 Flash Image fallback 실패:", fallbackError?.message);
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
          "16:9"
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
 * 챗봇에서 사용자 요청에 따라 이미지를 생성
 * - 기본: 실사(photo-realistic) 스타일 (Whisk 수준)
 * - 인포그래픽/일러스트 명시 요청 시에만 스타일 변경
 * - 분석 단계를 간소화하여 속도 개선
 */
export async function generateChatImage(
  userRequest: string,
  keyword: string,
  content: string
): Promise<ImageGenerationResult> {
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

  // 블로그 내용에서 핵심 주제 추출 (짧게)
  const contentHint = content.substring(0, 300).replace(/\n/g, ' ').trim();

  // Whisk 스타일 프롬프트: 짧고 구체적
  const description = `${userRequest}. Context: blog about ${keyword}. ${contentHint.substring(0, 100)}`;

  try {
    console.log(`🎨 챗봇 이미지 생성: "${keyword}" (${style}, ${aspectRatio})`);
    return await generateBlogImage(keyword, description, style, aspectRatio);
  } catch (error: any) {
    console.error("🔴 챗봇 이미지 생성 실패:", error?.message || error);
    throw new Error(
      `이미지 생성 실패: ${error?.message || "알 수 없는 오류"}`
    );
  }
}
