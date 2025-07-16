import { writeOptimizedBlogPost, improveBlogPost } from './anthropic';
import { analyzeMorphemes } from './morphemeAnalyzer';
import { optimizeMorphemeUsage, restoreContentStructure } from './morphemeOptimizer';
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
  businessInfo: BusinessInfo
): Promise<StrictGenerationResult> {
  const maxAttempts = 5;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      console.log(`Strict morpheme generation attempt ${attempts + 1}/${maxAttempts}`);
      
      // Generate content with Claude
      const content = await writeOptimizedBlogPost(
        keyword,
        subtitles,
        researchData,
        businessInfo,
        attempts > 0 ? [
          `이전 시도에서 형태소 조건을 만족하지 못했습니다`,
          `BMW 형태소: 정확히 15-17회`,
          `코딩 형태소: 정확히 15-17회`,
          `키워드 형태소가 가장 많이 출현하는 단어가 되어야 함`,
          `공백 제외 1700-1800자 엄수`
        ] : undefined
      );
      
      // Analyze morphemes
      const analysis = analyzeMorphemes(content, keyword);
      console.log(`Attempt ${attempts + 1} analysis:`, {
        isOptimized: analysis.isOptimized,
        characterCount: analysis.characterCount,
        keywordMorphemeCount: analysis.keywordMorphemeCount,
        issues: analysis.issues
      });
      
      // Check if conditions are met
      if (analysis.isOptimized) {
        console.log(`SUCCESS: All morpheme conditions met on attempt ${attempts + 1}`);
        return {
          content,
          analysis,
          attempts: attempts + 1,
          success: true
        };
      }
      
      // If not optimized, try morpheme optimization
      if (attempts < maxAttempts - 1) {
        try {
          console.log(`Applying morpheme optimization on attempt ${attempts + 1}`);
          
          // Extract keyword morphemes for target counts
          const keywordParts = keyword.toLowerCase().match(/[가-힣a-z]+/g) || [];
          const targetCounts: Record<string, number> = {};
          
          // Set target to 18 (middle of 17-20 range)
          keywordParts.forEach(part => {
            targetCounts[part] = 18;
          });
          
          const optimizationResult = await optimizeMorphemeUsage(content, keyword, targetCounts);
          const optimizedContent = restoreContentStructure(optimizationResult.optimizedContent, subtitles);
          
          const optimizedAnalysis = analyzeMorphemes(optimizedContent, keyword);
          
          if (optimizedAnalysis.isOptimized) {
            console.log(`SUCCESS: Morpheme optimization successful on attempt ${attempts + 1}`);
            return {
              content: optimizedContent,
              analysis: optimizedAnalysis,
              attempts: attempts + 1,
              success: true
            };
          }
          
          console.log(`Optimization helped but still not perfect:`, optimizedAnalysis.issues);
        } catch (optimizationError) {
          console.error(`Morpheme optimization failed on attempt ${attempts + 1}:`, optimizationError);
        }
      }
      
      attempts++;
    } catch (error) {
      console.error(`Generation attempt ${attempts + 1} failed:`, error);
      attempts++;
    }
  }
  
  // If all attempts failed, return the last attempt's result
  console.log(`FAILED: Could not meet morpheme conditions after ${maxAttempts} attempts`);
  
  // Make one final attempt with very strict prompts
  try {
    const finalContent = await writeOptimizedBlogPost(
      keyword,
      subtitles,
      researchData,
      businessInfo,
      [
        `🚨 절대 필수 조건 🚨`,
        `BMW 형태소: 정확히 17-20회 (개수를 세면서 작성)`,
        `코딩 형태소: 정확히 17-20회 (개수를 세면서 작성)`,
        `공백 제외 1700-2000자`,
        `키워드 형태소가 가장 빈번한 단어가 되어야 함`,
        `조건을 만족하지 않으면 검색 엔진에서 패널티를 받습니다`
      ]
    );
    
    const finalAnalysis = analyzeMorphemes(finalContent, keyword);
    
    return {
      content: finalContent,
      analysis: finalAnalysis,
      attempts: maxAttempts,
      success: finalAnalysis.isOptimized
    };
  } catch (finalError) {
    console.error('Final generation attempt failed:', finalError);
    throw new Error('블로그 생성에 완전히 실패했습니다. 다시 시도해주세요.');
  }
}

export async function regenerateWithStrictMorphemes(
  originalContent: string,
  keyword: string,
  subtitles: string[],
  researchData: { content: string; citations: string[] },
  businessInfo: BusinessInfo
): Promise<StrictGenerationResult> {
  console.log('Regenerating content with strict morpheme requirements');
  
  // Analyze current content first
  const currentAnalysis = analyzeMorphemes(originalContent, keyword);
  console.log('Current content analysis:', currentAnalysis.issues);
  
  return generateStrictMorphemeContent(keyword, subtitles, researchData, businessInfo);
}