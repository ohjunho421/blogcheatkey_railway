import { writeOptimizedBlogPost, improveBlogPost } from './anthropic';
import { analyzeMorphemes } from './morphemeAnalyzer';
import { optimizeMorphemeUsage, restoreContentStructure } from './morphemeOptimizer';
import { optimizeContentAdvanced } from './advancedOptimizer';
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
  const maxAttempts = 3; // Reduced from 5 to 3
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    try {
      console.log(`Strict morpheme generation attempt ${attempts}/${maxAttempts}`);
      
      // Generate content with Claude (now has retry logic built-in)
      const content = await writeOptimizedBlogPost(
        keyword,
        subtitles,
        researchData,
        businessInfo,
        attempts > 1 ? [
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
        console.log(`SUCCESS: All morpheme conditions met on attempt ${attempts}`);
        return {
          content,
          analysis,
          attempts,
          success: true
        };
      }
      
      // If not optimized, try advanced multi-stage optimization
      if (attempts <= 2) {
        try {
          console.log(`Applying advanced optimization on attempt ${attempts}`);
          
          const optimizationResult = await optimizeContentAdvanced(
            content,
            keyword,
            businessInfo,
            subtitles,
            researchData
          );
          
          console.log(`Advanced optimization result: success=${optimizationResult.success}, stage=${optimizationResult.optimizationStage}`);
          
          if (optimizationResult.analysis.isOptimized) {
            console.log(`SUCCESS: Advanced optimization achieved all conditions on attempt ${attempts}`);
            return {
              content: optimizationResult.content,
              analysis: optimizationResult.analysis,
              attempts,
              success: true
            };
          } else if (optimizationResult.analysis.keywordMorphemeCount > analysis.keywordMorphemeCount || 
                     Math.abs(optimizationResult.analysis.characterCount - 1750) < Math.abs(analysis.characterCount - 1750)) {
            console.log(`Improved content found in advanced optimization, using it for next attempt`);
            content = optimizationResult.content;
            analysis = optimizationResult.analysis;
          }
          
          // Continue with traditional morpheme optimization as fallback
          console.log(`Fallback to traditional morpheme optimization`);
          
          // Extract keyword morphemes for target counts
          const keywordParts = keyword.toLowerCase().match(/[가-힣a-z]+/g) || [];
          const targetCounts: Record<string, number> = {};
          
          // Set target to 16 (middle of 15-17 range)
          keywordParts.forEach(part => {
            targetCounts[part] = 16;
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
    
    // Return fallback content with proper keyword insertion for API overload
    const fallbackContent = `${keyword}에 대한 완벽한 가이드

${keyword}를 처음 접하시는 분들은 어디서부터 시작해야 할지 막막하실 거예요. 복잡한 설명들만 가득하고, 실제로 어떻게 해야 하는지 명확하지 않으니까요. 이런 고민 많이 하셨죠? ${businessInfo.businessName}에서 ${businessInfo.expertise}해온 경험으로 말씀드리면, ${keyword}는 생각보다 어렵지 않아요. ${businessInfo.differentiators}한 방법으로 차근차근 알려드릴게요.

${subtitles[0] || `${keyword} 기본 개념 이해하기`}

${keyword}의 기본 원리를 이해하는 것부터 시작해보세요. ${keyword}는 단순히 복잡한 기술이 아니라 실생활에서 활용할 수 있는 실용적인 도구예요. 많은 분들이 ${keyword}를 어려워하시는데, 실제로는 몇 가지 핵심만 알면 쉽게 접근할 수 있어요. ${keyword}의 핵심은 체계적인 접근과 단계별 학습이거든요. ${keyword}를 제대로 이해하려면 기초부터 탄탄히 다져야 해요.

${subtitles[1] || `${keyword} 시작하는 방법`}

${keyword}를 시작할 때 가장 중요한 건 기초를 탄탄히 하는 거예요. 처음부터 복잡한 것들을 시도하기보다는 간단한 것부터 차근차근 해보세요. 실제로 ${keyword}를 경험해보신 분들은 알겠지만, 이론만으로는 한계가 있어요. 직접 해보면서 익숙해지는 게 가장 빠른 방법이죠. ${keyword}를 제대로 활용하려면 꾸준한 연습이 필요해요. 하루 이틀에 마스터할 수는 없지만, 체계적으로 접근하면 생각보다 빨리 익힐 수 있어요.

${subtitles[2] || `${keyword} 활용 팁과 노하우`}

${keyword}를 효과적으로 활용하는 몇 가지 팁을 알려드릴게요. 이런 방법들을 알고 있으면 시행착오를 줄이고 더 빠르게 결과를 얻을 수 있어요. 첫 번째로는 목표를 명확히 하는 거예요. ${keyword}로 무엇을 달성하고 싶은지 구체적으로 정해두면 더 효율적으로 접근할 수 있거든요. 두 번째는 단계별로 진행하는 거예요. 한 번에 모든 걸 하려고 하면 오히려 복잡해져요. 작은 단위로 나누어서 하나씩 해결해나가세요.

${subtitles[3] || `${keyword} 문제 해결과 주의사항`}

${keyword}를 사용하다 보면 예상치 못한 문제들이 생길 수 있어요. 이런 상황에서 당황하지 말고 체계적으로 접근하는 게 중요해요. 가장 흔한 실수는 기초를 건너뛰고 바로 고급 기능을 사용하려는 거예요. ${keyword}는 기본기가 탄탄해야 응용도 제대로 할 수 있거든요. 문제가 생겼을 때는 원인을 정확히 파악하는 게 우선이에요. 증상만 보고 대충 해결하려고 하면 나중에 더 큰 문제가 될 수 있어요.

이제 ${keyword}에 대해 기본적인 내용들은 충분히 알아보셨죠. 하지만 직접 해보려니 복잡하고 시간도 많이 걸리실 거예요. 바쁜 일상에서 일일이 찾아가며 설정하기 어려우시죠. 혹시 잘못 건드려서 문제라도 생기면 어쩌나 싶고요. ${businessInfo.businessName}에서는 ${businessInfo.differentiators}하게 ${businessInfo.expertise} 서비스를 제공합니다. 시간 아끼고 안전하게 해결하고 싶으시다면 지금 바로 ${businessInfo.businessName}에 문의해보세요. 전문가가 직접 도와드릴게요.`;

    const fallbackAnalysis = analyzeMorphemes(fallbackContent, keyword);
    return {
      content: fallbackContent,
      analysis: fallbackAnalysis,
      attempts: maxAttempts + 1,
      success: fallbackAnalysis.isOptimized
    };
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