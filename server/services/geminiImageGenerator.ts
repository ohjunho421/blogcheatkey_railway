import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_ENV_VAR || "",
});

// Gemini 3 Pro Image 모델 (4K, 텍스트 렌더링, Google Search 그라운딩 지원)
const IMAGE_MODEL = "gemini-3-pro-image-preview";
// Fallback 모델
const FALLBACK_IMAGE_MODEL = "gemini-2.5-flash-preview-04-17";

// ============================================================
// 1. 이미지 생성 (Gemini 3 Pro Image - 4K, 네이티브 인포그래픽)
// ============================================================

interface ImageGenerationResult {
  imageBase64: string;
  mimeType: string;
  prompt: string;
}

/**
 * Gemini 3 Pro Image의 generateContent 응답에서 이미지 파트를 추출
 */
function extractImageFromResponse(response: any): { imageBase64: string; mimeType: string } | null {
  if (!response?.candidates?.[0]?.content?.parts) return null;

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return {
        imageBase64: part.inlineData.data || "",
        mimeType: part.inlineData.mimeType || "image/png",
      };
    }
  }
  return null;
}

/**
 * 블로그 키워드/내용에 맞는 이미지를 Gemini 3 Pro Image로 생성
 * - 최대 4K 해상도
 * - 선명한 텍스트 렌더링
 * - Google Search 그라운딩 (실시간 데이터 기반 이미지)
 */
export async function generateBlogImage(
  keyword: string,
  description: string,
  style: "photo" | "illustration" | "infographic" = "illustration",
  aspectRatio: "1:1" | "16:9" | "9:16" = "16:9"
): Promise<ImageGenerationResult> {
  const stylePrompts: Record<string, string> = {
    photo: `Generate a professional, high-quality photograph illustrating "${keyword}". ${description}. Clean, modern, well-lit photography with neutral background. No text overlay.`,
    illustration: `Generate a modern, clean digital illustration about "${keyword}". ${description}. Flat design style, professional color palette, visually engaging for a blog post. No text overlay.`,
    infographic: `Generate a clean, professional infographic about "${keyword}". ${description}. Use icons, simple charts, data visualizations, and visual elements. Modern flat design with professional color scheme. Include clear, readable text labels in Korean where appropriate.`,
  };

  const prompt = stylePrompts[style] || stylePrompts.illustration;

  // 인포그래픽은 세로형, 나머지는 요청된 비율
  const imageSize = style === "infographic" ? "2K" : "2K";

  try {
    console.log(`🎨 Gemini 3 Pro Image 생성 시작: "${keyword}" (${style}, ${aspectRatio})`);

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: imageSize,
        },
      },
    });

    const imageData = extractImageFromResponse(response);
    if (imageData) {
      console.log(`✅ Gemini 3 Pro Image 생성 완료 (${imageSize})`);
      return {
        imageBase64: imageData.imageBase64,
        mimeType: imageData.mimeType,
        prompt,
      };
    }

    throw new Error("이미지 데이터가 응답에 없습니다");
  } catch (error: any) {
    console.error("🔴 Gemini 3 Pro Image 생성 실패:", error?.message || error);

    // Fallback 1: Gemini 2.5 Flash로 시도
    try {
      console.log("🔄 Gemini 2.5 Flash fallback 시도...");
      const fallbackResponse = await ai.models.generateContent({
        model: FALLBACK_IMAGE_MODEL,
        contents: prompt,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      const fallbackImage = extractImageFromResponse(fallbackResponse);
      if (fallbackImage) {
        console.log(`✅ Gemini 2.5 Flash fallback 이미지 생성 완료`);
        return {
          imageBase64: fallbackImage.imageBase64,
          mimeType: fallbackImage.mimeType,
          prompt,
        };
      }
    } catch (fallback1Error: any) {
      console.error("🔴 Gemini 2.5 Flash fallback 실패:", fallback1Error?.message);
    }

    // Fallback 2: Imagen 3.0으로 시도
    try {
      console.log("🔄 Imagen 3.0 fallback 시도...");
      const imagenResponse = await ai.models.generateImages({
        model: "imagen-3.0-generate-002",
        prompt,
        config: {
          numberOfImages: 1,
        },
      });

      if (imagenResponse.generatedImages && imagenResponse.generatedImages.length > 0) {
        const image = imagenResponse.generatedImages[0];
        console.log(`✅ Imagen 3.0 fallback 이미지 생성 완료`);
        return {
          imageBase64: image.image?.imageBytes
            ? Buffer.from(image.image.imageBytes).toString("base64")
            : "",
          mimeType: image.image?.mimeType || "image/png",
          prompt,
        };
      }
    } catch (fallback2Error: any) {
      console.error("🔴 Imagen 3.0 fallback도 실패:", fallback2Error?.message);
    }

    throw new Error(`이미지 생성 실패: ${error?.message || "알 수 없는 오류"}`);
  }
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
      model: IMAGE_MODEL,
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
 */
export async function generateChatImage(
  userRequest: string,
  keyword: string,
  content: string
): Promise<ImageGenerationResult> {
  // 사용자 요청을 분석하여 적절한 이미지 프롬프트 생성
  const analysisPrompt = `사용자가 블로그 글에 넣을 이미지를 요청했습니다.

키워드: "${keyword}"
사용자 요청: "${userRequest}"
블로그 내용 일부: ${content.substring(0, 800)}

사용자의 요청을 분석하여 다음 JSON을 반환하세요:
{
  "description": "이미지 설명 (영어, 구체적이고 상세하게)",
  "style": "photo" | "illustration" | "infographic",
  "aspectRatio": "16:9" | "1:1" | "9:16"
}

규칙:
- description은 영어로, 이미지 생성 AI가 이해할 수 있도록 구체적으로
- 사용자가 "인포그래픽"을 요청하면 style을 "infographic"으로
- 사용자가 "사진"을 요청하면 style을 "photo"로
- 기본은 "illustration"
- 블로그 내용과 관련된 시각적 요소를 포함

JSON만 반환:`;

  try {
    const analysisResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
      },
      contents: analysisPrompt,
    });

    const analysis = JSON.parse(analysisResponse.text || "{}");

    return await generateBlogImage(
      keyword,
      analysis.description || userRequest,
      analysis.style || "illustration",
      analysis.aspectRatio || "16:9"
    );
  } catch (error: any) {
    console.error("🔴 챗봇 이미지 생성 실패:", error?.message || error);
    throw new Error(
      `이미지 생성 실패: ${error?.message || "알 수 없는 오류"}`
    );
  }
}
