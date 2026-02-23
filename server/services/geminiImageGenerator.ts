import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_ENV_VAR || "",
});

// ============================================================
// 1. 일반 이미지 생성 (Gemini 2.5 Flash Image)
// ============================================================

interface ImageGenerationResult {
  imageBase64: string;
  mimeType: string;
  prompt: string;
}

/**
 * 블로그 키워드/내용에 맞는 이미지를 Gemini API로 생성
 */
export async function generateBlogImage(
  keyword: string,
  description: string,
  style: "photo" | "illustration" | "infographic" = "illustration",
  aspectRatio: "1:1" | "16:9" | "9:16" = "16:9"
): Promise<ImageGenerationResult> {
  const stylePrompts: Record<string, string> = {
    photo: `Professional, high-quality photograph illustrating "${keyword}". ${description}. Clean, modern, well-lit photography with neutral background. No text overlay.`,
    illustration: `Modern, clean digital illustration about "${keyword}". ${description}. Flat design style, professional color palette, visually engaging for a blog post. No text overlay.`,
    infographic: `Clean infographic-style illustration about "${keyword}". ${description}. Use icons, simple charts, and visual elements. Modern flat design with professional color scheme. Minimal text, focus on visual communication.`,
  };

  const prompt = stylePrompts[style] || stylePrompts.illustration;

  try {
    console.log(`🎨 Gemini 이미지 생성 시작: "${keyword}" (${style})`);

    const response = await ai.models.generateImages({
      model: "gemini-2.0-flash-exp",
      prompt,
      config: {
        numberOfImages: 1,
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const image = response.generatedImages[0];
      console.log(`✅ 이미지 생성 완료`);

      return {
        imageBase64: image.image?.imageBytes
          ? Buffer.from(image.image.imageBytes).toString("base64")
          : "",
        mimeType: image.image?.mimeType || "image/png",
        prompt,
      };
    }

    throw new Error("이미지 데이터가 응답에 없습니다");
  } catch (error: any) {
    console.error("🔴 Gemini 이미지 생성 실패:", error?.message || error);

    // Fallback: Imagen 4.0 시도
    try {
      console.log("🔄 Imagen 4.0으로 fallback 시도...");
      const fallbackResponse = await ai.models.generateImages({
        model: "imagen-3.0-generate-002",
        prompt,
        config: {
          numberOfImages: 1,
        },
      });

      if (
        fallbackResponse.generatedImages &&
        fallbackResponse.generatedImages.length > 0
      ) {
        const image = fallbackResponse.generatedImages[0];
        console.log(`✅ Imagen fallback 이미지 생성 완료`);

        return {
          imageBase64: image.image?.imageBytes
            ? Buffer.from(image.image.imageBytes).toString("base64")
            : "",
          mimeType: image.image?.mimeType || "image/png",
          prompt,
        };
      }
    } catch (fallbackError: any) {
      console.error("🔴 Imagen fallback도 실패:", fallbackError?.message);
    }

    throw new Error(`이미지 생성 실패: ${error?.message || "알 수 없는 오류"}`);
  }
}

// ============================================================
// 2. 인포그래픽 생성 (Gemini로 HTML 생성 → base64 이미지)
// ============================================================

interface InfographicResult {
  html: string;
  imageBase64?: string;
  mimeType?: string;
}

/**
 * Gemini를 사용하여 인포그래픽 HTML을 생성
 * 클라이언트에서 렌더링하거나 서버에서 이미지로 변환 가능
 */
export async function generateInfographicHTML(
  keyword: string,
  content: string,
  subtitles: string[]
): Promise<InfographicResult> {
  const prompt = `당신은 인포그래픽 디자인 전문가입니다.

다음 블로그 글의 핵심 내용을 시각적으로 표현하는 인포그래픽 HTML을 생성하세요.

키워드: "${keyword}"
소제목들: ${subtitles.join(", ")}

블로그 내용 요약:
${content.substring(0, 1500)}

=== 인포그래픽 HTML 생성 규칙 ===

1. 완전한 standalone HTML (외부 CSS/JS 없이 inline style만 사용)
2. 크기: 800px × 1200px (세로형 인포그래픽)
3. 디자인 요소:
   - 상단: 키워드를 포함한 제목 영역 (그라데이션 배경)
   - 중간: 핵심 정보를 아이콘+텍스트로 3~4개 섹션
   - 각 섹션에 관련 수치나 핵심 포인트
   - 하단: 요약 또는 CTA
4. 스타일:
   - 모던하고 깔끔한 플랫 디자인
   - 파스텔 또는 비즈니스 컬러 팔레트
   - SVG 아이콘 사용 (간단한 도형으로)
   - 한국어 텍스트 사용
   - 폰트: 'Pretendard', 'Noto Sans KR', sans-serif
5. 반드시 <html> 태그로 시작하고 </html>로 끝나는 완전한 HTML

HTML 코드만 반환하세요 (설명 없이):`;

  try {
    console.log(`📊 인포그래픽 HTML 생성 시작: "${keyword}"`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let html = response.text || "";

    // HTML 코드 블록 추출
    const htmlMatch = html.match(/```html\s*([\s\S]*?)```/);
    if (htmlMatch) {
      html = htmlMatch[1].trim();
    } else if (!html.startsWith("<")) {
      // HTML이 아닌 경우 <html> 태그 찾기
      const startIdx = html.indexOf("<html");
      const endIdx = html.lastIndexOf("</html>");
      if (startIdx !== -1 && endIdx !== -1) {
        html = html.substring(startIdx, endIdx + 7);
      }
    }

    console.log(`✅ 인포그래픽 HTML 생성 완료 (${html.length}자)`);

    // Gemini 이미지 생성으로 인포그래픽 스타일 이미지도 함께 생성 시도
    let imageBase64: string | undefined;
    let mimeType: string | undefined;

    try {
      const imgResult = await generateBlogImage(
        keyword,
        `Key points: ${subtitles.slice(0, 3).join(", ")}. Data visualization style.`,
        "infographic",
        "9:16"
      );
      imageBase64 = imgResult.imageBase64;
      mimeType = imgResult.mimeType;
    } catch (imgError) {
      console.log("⚠️ 인포그래픽 이미지 생성 스킵 (HTML만 반환)");
    }

    return { html, imageBase64, mimeType };
  } catch (error: any) {
    console.error("🔴 인포그래픽 생성 실패:", error?.message || error);
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
      contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
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
      contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
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
