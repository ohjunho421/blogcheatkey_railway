import { writeOptimizedBlogPost, improveBlogPost } from './anthropic';
import { analyzeMorphemes, extractKoreanMorphemes, extractKeywordComponents, findKeywordComponentMatches } from './morphemeAnalyzer';
import { optimizeMorphemeUsage, restoreContentStructure } from './morphemeOptimizer';
import { optimizeContentAdvanced } from './advancedOptimizer';
import { resolveMorphemeOveruse } from './morphemeOveruseResolver';
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
  const maxAttempts = 3; // Reduced from 5 to 3
  let attempts = 0;
  let previousContent: string | null = null; // 이전 시도 결과 저장
  
  while (attempts < maxAttempts) {
    attempts++;
    try {
      console.log(`Strict morpheme generation attempt ${attempts}/${maxAttempts}`);
      
      // Prepare custom morphemes suggestions
      const customMorphemesArray = customMorphemes 
        ? customMorphemes.split(' ').filter(m => m.trim().length > 0)
        : [];
      
      // 이전 시도 분석 결과 기반으로 구체적인 지침 생성
      const keywordComponents = extractKeywordComponents(keyword);
      const seoSuggestions = [];
      
      if (attempts > 1) {
        seoSuggestions.push(`🔥 CRITICAL: 이전 시도 ${attempts-1}회 모두 SEO 조건 실패 - 다음 조건 절대 준수 필요`);
        seoSuggestions.push(`🎯 완전한 키워드 "${keyword}"를 정확히 5회 사용 (초과/미달 모두 금지)`);
        
        for (const component of keywordComponents) {
          seoSuggestions.push(`🎯 "${component}" 형태소를 정확히 15-17회 사용 (다른 형태소보다 많아야 함)`);
        }
        
        seoSuggestions.push(`🚨 키워드 형태소 우위성: "${keywordComponents.join('", "')}" 이외 다른 형태소가 이들보다 많이 나오면 SEO 실패`);
        seoSuggestions.push(`🔥 각 형태소 17회 초과시 검색 노출 완전 차단`);
        seoSuggestions.push(`📏 공백 제외 1500-1700자 엄수 (1499자 이하, 1701자 이상 모두 실패)`);
        seoSuggestions.push(`📖 서론 비중 35-40% (500-700자) 필수 - 미달시 독자 이탈률 증가로 SEO 패널티`);
        seoSuggestions.push(`🎭 매력적인 스토리텔링으로 독자가 끝까지 읽게 만드세요`);
        seoSuggestions.push(`🔄 키워드를 서론부터 적극 활용하여 초기에 형태소 출현 빈도 확보`);
      } else {
        seoSuggestions.push(`🎯 완전한 키워드 "${keyword}"를 정확히 5회 포함 (필수 조건)`);
        
        for (const component of keywordComponents) {
          seoSuggestions.push(`🎯 "${component}" 형태소를 각각 15-17회 포함 (SEO 최적 범위)`);
        }
        
        seoSuggestions.push(`🚨 키워드 형태소 우위성 확보: "${keywordComponents.join('", "')}" 이외 형태소들이 이들보다 많이 나오면 안됨`);
        seoSuggestions.push(`⚠️ 각 형태소 17회 초과 절대 금지 (SEO 패널티 발생)`);
        seoSuggestions.push(`📏 공백 제외 1500-1700자 범위 엄격 준수`);
        seoSuggestions.push(`📖 서론 35-40% 비중으로 독자 몰입도 최우선`);
        seoSuggestions.push(`🏆 키워드 형태소가 글에서 가장 중요한 단어로 인식되도록 작성`);
      }
      
      // Add custom morphemes to suggestions with stronger emphasis
      if (customMorphemesArray.length > 0) {
        seoSuggestions.push(
          `[필수] 다음 단어들을 글에 반드시 최소 1회씩 포함해야 합니다: ${customMorphemesArray.join(', ')}`
        );
        seoSuggestions.push(
          `추가 형태소를 포함하면서도 완전한 키워드 "${keyword}" 5회 이상, 구성 요소들 각각 15-17회 조건을 반드시 맞춰주세요`
        );
        if (attempts > 1) {
          seoSuggestions.push(`이전 시도에서 누락된 추가 형태소가 있었거나 키워드 조건이 부족했습니다. 완전한 키워드 5회 이상, 구성 요소 15-17회, 추가 형태소 포함 조건을 모두 만족하세요.`);
        }
      }

      // Generate content with Claude (first attempt) or improve existing content (subsequent attempts)
      let content: string;
      
      if (attempts === 1) {
        // 첫 번째 시도: 새로운 글 생성
        console.log('Generating new blog content...');
        content = await writeOptimizedBlogPost(
          keyword,
          subtitles,
          researchData,
          businessInfo,
          seoSuggestions.length > 0 ? seoSuggestions : undefined,
          referenceLinks
        );
      } else {
        // 두 번째 시도부터: 이전 콘텐츠가 있으면 그것을 수정, 없으면 새로 생성
        if (previousContent) {
          console.log('Improving existing content based on previous attempt...');
          content = previousContent; // 이전 콘텐츠를 기반으로 시작
        } else {
          console.log('No previous content available, generating new content...');
          content = await writeOptimizedBlogPost(
            keyword,
            subtitles,
            researchData,
            businessInfo,
            seoSuggestions.length > 0 ? seoSuggestions : undefined,
            referenceLinks
          );
        }
      }
      
      // Analyze morphemes including custom morphemes
      const analysis = analyzeMorphemes(content, keyword, customMorphemes);
      console.log(`Attempt ${attempts} analysis:`, {
        isOptimized: analysis.isOptimized,
        characterCount: analysis.characterCount,
        keywordMorphemeCount: analysis.keywordMorphemeCount,
        issues: analysis.issues,
        customMorphemes: analysis.customMorphemes
      });
      
      // 키워드 구성 요소들이 17회를 초과하지 않는지 엄격 검증
      let hasOveruse = false;
      const overuseDetails: string[] = [];
      
      for (const component of keywordComponents) {
        const componentMatches = findKeywordComponentMatches(extractKoreanMorphemes(content), keyword);
        const matches = componentMatches.get(component) || [];
        const count = matches.length;
        
        if (count > 17) {
          hasOveruse = true;
          overuseDetails.push(`${component}: ${count}회 (최대 17회 초과)`);
        }
      }
      
      // 모든 조건 상세 체크
      const completeKeywordCount = content.toLowerCase().split(keyword.toLowerCase()).length - 1;
      const characterCount = content.replace(/\s/g, '').length;
      
      console.log(`=== Detailed Condition Check (Attempt ${attempts}) ===`);
      console.log(`Complete keyword "${keyword}": ${completeKeywordCount} times (need 5)`);
      console.log(`Character count: ${characterCount} chars (need 1500-1700)`);
      
      const componentMatches = findKeywordComponentMatches(extractKoreanMorphemes(content), keyword);
      for (const component of keywordComponents) {
        const matches = componentMatches.get(component) || [];
        const count = matches.length;
        console.log(`Component "${component}": ${count} times (need 15-17)`);
      }
      
      // Check if conditions are met (including overuse check)
      if (analysis.isOptimized && !hasOveruse && completeKeywordCount >= 5 && characterCount >= 1500 && characterCount <= 1700) {
        console.log(`SUCCESS: All conditions met on attempt ${attempts}`);
        return {
          content,
          analysis,
          attempts,
          success: true
        };
      }
      
      if (hasOveruse) {
        console.log(`❌ Keyword component overuse detected: ${overuseDetails.join(', ')}`);
        
        // 형태소 과다 사용 해결 시도
        try {
          console.log('🔧 Attempting to resolve morpheme overuse...');
          const resolveResult = await resolveMorphemeOveruse(content, keyword);
          
          if (resolveResult.success) {
            console.log('✅ Morpheme overuse resolved successfully');
            console.log('Adjustments made:', resolveResult.adjustments);
            
            // 해결된 콘텐츠로 다시 분석
            const resolvedAnalysis = analyzeMorphemes(resolveResult.content, keyword, customMorphemes);
            
            if (resolvedAnalysis.isOptimized) {
              console.log(`SUCCESS: All conditions met after morpheme resolution on attempt ${attempts}`);
              return {
                content: resolveResult.content,
                analysis: resolvedAnalysis,
                attempts,
                success: true
              };
            }
          } else {
            console.log('⚠️ Morpheme overuse partially resolved:', resolveResult.adjustments);
          }
        } catch (error) {
          console.error('Morpheme overuse resolution failed:', error);
        }
      }
      
      // If not optimized, try advanced multi-stage optimization
      if (attempts <= 2) {
        try {
          console.log(`Applying advanced optimization on attempt ${attempts}`);
          
          const advancedResult = await optimizeContentAdvanced(
            content,
            keyword,
            businessInfo,
            subtitles,
            researchData
          );
          
          console.log(`Advanced optimization result: success=${advancedResult.success}, stage=${advancedResult.optimizationStage}`);
          
          if (advancedResult.analysis.isOptimized) {
            console.log(`SUCCESS: Advanced optimization achieved all conditions on attempt ${attempts}`);
            return {
              content: advancedResult.content,
              analysis: advancedResult.analysis,
              attempts,
              success: true
            };
          } else if (advancedResult.analysis.keywordMorphemeCount > analysis.keywordMorphemeCount || 
                     Math.abs(advancedResult.analysis.characterCount - 1600) < Math.abs(analysis.characterCount - 1600)) {
            console.log(`Improved content found in advanced optimization, using it for next attempt`);
            // 개선된 콘텐츠를 다음 시도에서 사용
            previousContent = advancedResult.content;
            continue;
          }
          
          // Continue with morpheme optimization on existing content
          console.log(`Continuing with morpheme optimization on existing content`);
          
          // 기존 콘텐츠를 개선된 버전으로 사용
          content = advancedResult.content;
          
          // Extract keyword morphemes for target counts
          const keywordParts = keyword.toLowerCase().match(/[가-힣a-z]+/g) || [];
          const targetCounts: Record<string, number> = {};
          
          // Set target to 16 (middle of 15-17 range)
          keywordParts.forEach((part: string) => {
            targetCounts[part] = 16;
          });
          
          const morphemeResult = await optimizeMorphemeUsage(content, keyword, targetCounts);
          const optimizedContent = restoreContentStructure(morphemeResult.optimizedContent, subtitles);
          
          const optimizedAnalysis = analyzeMorphemes(optimizedContent, keyword, customMorphemes);
          
          if (optimizedAnalysis.isOptimized) {
            console.log(`SUCCESS: Morpheme optimization successful on attempt ${attempts}`);
            return {
              content: optimizedContent,
              analysis: optimizedAnalysis,
              attempts,
              success: true
            };
          }
          
          console.log(`Optimization helped but still not perfect:`, optimizedAnalysis.issues);
          // 개선된 콘텐츠를 다음 시도에 사용
          previousContent = optimizedContent;
        } catch (optimizationError) {
          console.error(`Morpheme optimization failed on attempt ${attempts}:`, optimizationError);
        }
      }
      
    } catch (error) {
      console.error(`Generation attempt ${attempts} failed:`, error);
      // 오류가 발생해도 이전에 개선된 콘텐츠가 있다면 보존
      if (content && !previousContent) {
        previousContent = content;
      }
    }
  }
  
  // If all attempts failed, return the last attempt's result
  console.log(`FAILED: Could not meet morpheme conditions after ${maxAttempts} attempts`);
  
  // Make one final attempt with very strict prompts
  try {
    const customMorphemesArray = customMorphemes 
      ? customMorphemes.split(' ').filter(m => m.trim().length > 0)
      : [];
    
    const finalSuggestions = [
      `🚨 절대 필수 조건 🚨`,
      `BMW 형태소: 정확히 15-17회 (개수를 세면서 작성)`,
      `코딩 형태소: 정확히 15-17회 (개수를 세면서 작성)`,
      `공백 제외 1700-1800자`,
      `키워드 형태소가 가장 빈번한 단어가 되어야 함`,
      `조건을 만족하지 않으면 검색 엔진에서 패널티를 받습니다`
    ];
    
    if (customMorphemesArray.length > 0) {
      finalSuggestions.push(
        `다음 단어들을 글에 최소 1회씩 포함: ${customMorphemesArray.join(', ')}`
      );
    }
    
    const finalContent = await writeOptimizedBlogPost(
      keyword,
      subtitles,
      researchData,
      businessInfo,
      finalSuggestions
    );
    
    const finalAnalysis = analyzeMorphemes(finalContent, keyword);
    
    return {
      content: finalContent,
      analysis: finalAnalysis,
      attempts: maxAttempts + 1,
      success: finalAnalysis.isOptimized
    };
  } catch (finalError) {
    console.error("Final generation attempt failed:", finalError);
    
    // Return a basic fallback
    return {
      content: `${keyword}에 대한 기본 정보를 제공하는 글을 생성하는 중 오류가 발생했습니다.`,
      analysis: { isOptimized: false, characterCount: 0, keywordMorphemeCount: 0, issues: ["생성 실패"] },
      attempts: maxAttempts + 1,
      success: false
    };
  }
}

export async function regenerateWithStrictMorphemes(
  currentContent: string,
  keyword: string,
  subtitles: string[],
  researchData: { content: string; citations: string[] },
  businessInfo: BusinessInfo,
  customMorphemes?: string
): Promise<StrictGenerationResult> {
  console.log('Regenerating content with strict morpheme requirements');
  
  return await generateStrictMorphemeContent(
    keyword,
    subtitles,
    researchData,
    businessInfo,
    undefined, // referenceLinks
    customMorphemes
  );
}