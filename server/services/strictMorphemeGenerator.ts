import { writeOptimizedBlogPost } from './anthropic';
import { analyzeMorphemes } from './morphemeAnalyzer';
import type { BusinessInfo } from "@shared/schema";

interface StrictGenerationResult {
  content: string;
  analysis: any;
  attempts: number;
  success: boolean;
}

export async function generateStrictMorphemeContent(
  keyword: string,
  subtitles: string[],
  researchData: { content: string; citations: string[] },
  businessInfo: BusinessInfo,
  referenceLinks?: any,
  customMorphemes?: string
): Promise<StrictGenerationResult> {
  const maxAttempts = 3;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    try {
      console.log(`Strict morpheme generation attempt ${attempts}/${maxAttempts}`);
      
      // 자연스러운 SEO 지침 생성
      const seoSuggestions = [
        `자연스러운 블로그 글을 작성해주세요.`,
        `키워드 "${keyword}"를 자연스럽게 5-7회 정도 포함해주세요.`,
        `글의 길이는 1500-1700자 정도로 작성해주세요.`,
        `서론은 전체의 35-40% 정도 비중으로 독자의 관심을 끌어주세요.`,
        `키워드를 억지로 반복하지 말고 자연스러운 맥락에서 사용해주세요.`
      ];
      
      // 추가 형태소가 있으면 포함
      if (customMorphemes) {
        const customMorphemesArray = customMorphemes.split(' ').filter(m => m.trim().length > 0);
        if (customMorphemesArray.length > 0) {
          seoSuggestions.push(`다음 단어들도 자연스럽게 포함해주세요: ${customMorphemesArray.join(', ')}`);
        }
      }
      
      console.log(`Calling writeOptimizedBlogPost for "${keyword}"...`);
      
      // Claude로 콘텐츠 생성
      const content = await writeOptimizedBlogPost(
        keyword,
        subtitles,
        researchData,
        businessInfo,
        seoSuggestions,
        referenceLinks
      );
      
      console.log(`Content generated, length: ${content.length} characters`);
      console.log(`Starting morpheme analysis for "${keyword}"...`);
      
      // 형태소 분석
      const analysis = analyzeMorphemes(content, keyword, customMorphemes);
      
      console.log(`Morpheme analysis completed`);
      console.log(`Attempt ${attempts} analysis:`, {
        isOptimized: analysis.isOptimized,
        characterCount: analysis.characterCount,
        keywordMorphemeCount: analysis.keywordMorphemeCount
      });
      
      // 성공 조건: 기본 분석이 통과하면 성공
      if (analysis.isOptimized) {
        console.log(`SUCCESS: Content optimized on attempt ${attempts}`);
        return {
          content,
          analysis,
          attempts,
          success: true
        };
      }
      
      console.log(`Attempt ${attempts} needs improvement:`, analysis.issues);
      
    } catch (error) {
      console.error(`Generation attempt ${attempts} failed:`, error);
      if (error instanceof Error) {
        console.error(`Error stack:`, error.stack);
      }
      
      // 에러가 발생하면 간단한 대체 콘텐츠 반환
      if (attempts === maxAttempts) {
        return {
          content: `${keyword}에 대한 블로그 콘텐츠입니다. 자세한 정보를 제공하여 독자들에게 도움이 되고자 합니다.`,
          analysis: { isOptimized: false, issues: ['생성 중 오류 발생'] },
          attempts,
          success: false
        };
      }
    }
  }
  
  // 모든 시도가 실패한 경우, 마지막 시도의 결과 반환
  console.log(`Content generation completed in ${maxAttempts} attempts. Success: false`);
  
  return {
    content: "콘텐츠 생성에 실패했습니다. 다시 시도해주세요.",
    analysis: { isOptimized: false },
    attempts: maxAttempts,
    success: false
  };
}

// 재생성을 위한 함수 추가
export async function regenerateWithStrictMorphemes(
  currentContent: string,
  keyword: string,
  subtitles: string[],
  researchData: { content: string; citations: string[] },
  businessInfo: BusinessInfo,
  customMorphemes?: string
): Promise<StrictGenerationResult> {
  // 기존 콘텐츠를 바탕으로 새로 생성 (동일한 로직 사용)
  return generateStrictMorphemeContent(
    keyword,
    subtitles,
    researchData,
    businessInfo,
    undefined,
    customMorphemes
  );
}