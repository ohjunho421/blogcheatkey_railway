import { analyzeMorphemes } from './morphemeAnalyzer';
import { optimizeMorphemeUsage } from './morphemeOptimizer';
import { writeOptimizedBlogPost } from './anthropic';
import { validateSEOOptimization, enhanceIntroductionAndConclusion } from './gemini';
import type { BusinessInfo } from "@shared/schema";

interface OptimizationResult {
  content: string;
  analysis: any;
  success: boolean;
  attempts: number;
  optimizationStage: string;
}

export async function optimizeContentAdvanced(
  content: string,
  keyword: string,
  businessInfo: BusinessInfo,
  subtitles: string[] = [],
  researchData: any = { content: '', citations: [] }
): Promise<OptimizationResult> {
  
  const maxAttempts = 3;
  let currentContent = content;
  let currentAnalysis = analyzeMorphemes(content, keyword);
  let attempts = 0;
  
  console.log('Advanced optimization started');
  console.log(`Initial analysis: optimized=${currentAnalysis.isOptimized}, chars=${currentAnalysis.characterCount}`);
  
  // Stage 1: SEO Optimization with Gemini (fast, focused)
  if (!currentAnalysis.isOptimized && attempts < maxAttempts) {
    attempts++;
    try {
      console.log(`Stage 1 (Gemini SEO): Attempt ${attempts}/${maxAttempts}`);
      
      const seoPrompt = createSEOOptimizationPrompt(currentContent, keyword, currentAnalysis);
      const seoOptimizedContent = await optimizeWithGemini(seoPrompt, keyword, businessInfo, 0.7);
      const seoAnalysis = analyzeMorphemes(seoOptimizedContent, keyword);
      
      console.log(`Stage 1 result: optimized=${seoAnalysis.isOptimized}, chars=${seoAnalysis.characterCount}`);
      
      if (isBetterOptimization(seoAnalysis, currentAnalysis)) {
        currentContent = seoOptimizedContent;
        currentAnalysis = seoAnalysis;
        console.log('Stage 1 successful: SEO optimization improved content');
      }
      
      if (currentAnalysis.isOptimized) {
        return {
          content: currentContent,
          analysis: currentAnalysis,
          success: true,
          attempts,
          optimizationStage: 'seo'
        };
      }
    } catch (error) {
      console.error('Stage 1 (SEO) failed:', error);
    }
  }
  
  // Stage 2: Readability Enhancement (temperature 0.5)
  if (!currentAnalysis.isOptimized && attempts < maxAttempts) {
    attempts++;
    try {
      console.log(`Stage 2 (Readability): Attempt ${attempts}/${maxAttempts}`);
      
      const readabilityPrompt = createReadabilityPrompt(currentContent, keyword, currentAnalysis);
      const readabilityContent = await optimizeWithGemini(readabilityPrompt, keyword, businessInfo, 0.5);
      const readabilityAnalysis = analyzeMorphemes(readabilityContent, keyword);
      
      console.log(`Stage 2 result: optimized=${readabilityAnalysis.isOptimized}, chars=${readabilityAnalysis.characterCount}`);
      
      if (isBetterOptimization(readabilityAnalysis, currentAnalysis)) {
        currentContent = readabilityContent;
        currentAnalysis = readabilityAnalysis;
        console.log('Stage 2 successful: Readability enhancement improved content');
      }
      
      if (currentAnalysis.isOptimized) {
        return {
          content: currentContent,
          analysis: currentAnalysis,
          success: true,
          attempts,
          optimizationStage: 'readability'
        };
      }
    } catch (error) {
      console.error('Stage 2 (Readability) failed:', error);
    }
  }
  
  // Stage 3: Morpheme-level optimization (local processing)
  if (!currentAnalysis.isOptimized && attempts < maxAttempts) {
    attempts++;
    try {
      console.log(`Stage 3 (Morpheme): Attempt ${attempts}/${maxAttempts}`);
      
      const morphemeResult = await optimizeMorphemeUsage(currentContent, keyword, businessInfo);
      const morphemeAnalysis = analyzeMorphemes(morphemeResult.optimizedContent, keyword);
      
      console.log(`Stage 3 result: optimized=${morphemeAnalysis.isOptimized}, chars=${morphemeAnalysis.characterCount}`);
      
      if (isBetterOptimization(morphemeAnalysis, currentAnalysis)) {
        currentContent = morphemeResult.optimizedContent;
        currentAnalysis = morphemeAnalysis;
        console.log('Stage 3 successful: Morpheme optimization improved content');
      }
      
      if (currentAnalysis.isOptimized) {
        return {
          content: currentContent,
          analysis: currentAnalysis,
          success: true,
          attempts,
          optimizationStage: 'morpheme'
        };
      }
    } catch (error) {
      console.error('Stage 3 (Morpheme) failed:', error);
    }
  }
  
  return {
    content: currentContent,
    analysis: currentAnalysis,
    success: currentAnalysis.isOptimized,
    attempts,
    optimizationStage: 'final'
  };
}

function createSEOOptimizationPrompt(content: string, keyword: string, analysis: any): string {
  return `다음 블로그 콘텐츠를 SEO 최적화해주세요.

현재 상태:
- 키워드: ${keyword}
- 현재 글자수: ${analysis.characterCount}자 (목표: 1700-2000자)
- 키워드 형태소 출현: ${analysis.keywordMorphemeCount}회 (목표: 15-17회)

최적화 목표:
1. 키워드 형태소를 정확히 15-17회 사용
2. 공백 제외 1700-2000자 맞추기
3. 키워드 형태소가 가장 많이 출현하는 단어가 되도록 조정
4. 자연스러운 흐름 유지

콘텐츠:
${content}

위 조건을 만족하는 최적화된 콘텐츠를 생성해주세요.`;
}

function createReadabilityPrompt(content: string, keyword: string, analysis: any): string {
  return `다음 블로그 콘텐츠의 가독성을 높이면서 SEO 조건을 유지해주세요.

SEO 조건 (반드시 유지):
- 키워드: ${keyword}
- 키워드 형태소: 15-17회
- 공백 제외: 1700-2000자
- 키워드 형태소가 가장 빈번한 단어

가독성 개선 목표:
- 문장 길이 조정
- 단락 구조 개선
- 자연스러운 흐름
- 독자 친화적 표현

콘텐츠:
${content}

SEO 조건을 유지하면서 가독성을 높인 콘텐츠를 생성해주세요.`;
}

function isBetterOptimization(newAnalysis: any, currentAnalysis: any): boolean {
  // 완전 최적화된 것이 우선
  if (newAnalysis.isOptimized && !currentAnalysis.isOptimized) return true;
  if (!newAnalysis.isOptimized && currentAnalysis.isOptimized) return false;
  
  // 둘 다 최적화되지 않은 경우, 키워드 형태소 수와 글자수 비교
  const newKeywordScore = Math.abs(newAnalysis.keywordMorphemeCount - 16); // 16이 목표
  const currentKeywordScore = Math.abs(currentAnalysis.keywordMorphemeCount - 16);
  
  const newCharScore = Math.abs(newAnalysis.characterCount - 1750); // 1750이 목표
  const currentCharScore = Math.abs(currentAnalysis.characterCount - 1750);
  
  // 키워드 형태소 수가 더 중요
  if (newKeywordScore < currentKeywordScore) return true;
  if (newKeywordScore > currentKeywordScore) return false;
  
  // 키워드 형태소 수가 같으면 글자수 비교
  return newCharScore < currentCharScore;
}

async function optimizeWithGemini(
  prompt: string,
  keyword: string,
  businessInfo: BusinessInfo,
  temperature: number = 0.7
): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/genai');
  
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("Google API key is not configured");
  }

  const genai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genai.getGenerativeModel({ 
    model: "gemini-2.5-pro",
    generationConfig: {
      temperature,
      maxOutputTokens: 2048,
    },
  });

  const systemPrompt = `당신은 SEO 최적화 전문가입니다. 다음 조건을 반드시 지켜주세요:
1. 키워드 "${keyword}" 형태소를 정확히 15-17회 사용
2. 공백 제외 1700-2000자 범위 유지
3. 자연스러운 흐름과 가독성 확보
4. 키워드 형태소가 가장 빈번한 단어가 되도록 조정

업체 정보:
- 업체명: ${businessInfo.businessName}
- 전문분야: ${businessInfo.expertise}
- 차별화요소: ${businessInfo.differentiators}`;

  const maxRetries = 2;
  const retryDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Gemini optimization attempt ${attempt}/${maxRetries}`);
      
      const result = await model.generateContent([
        { role: 'user', parts: [{ text: systemPrompt + '\n\n' + prompt }] }
      ]);
      
      const response = result.response;
      const content = response.text();
      
      if (!content) {
        throw new Error("Empty response from Gemini");
      }

      return content;
    } catch (error: any) {
      console.error(`Gemini optimization attempt ${attempt} error:`, error);
      
      if (error.status === 503 || (error.message && error.message.includes("overloaded"))) {
        if (attempt < maxRetries) {
          console.log(`Gemini API overloaded, retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      }
      
      if (attempt === maxRetries) {
        throw new Error(`Gemini optimization failed after ${maxRetries} attempts: ${error.message}`);
      }
    }
  }
  
  throw new Error("Gemini optimization failed: Maximum retries exceeded");
}