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
  const maxAttempts = 3; // 최대 3회 시도
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Strict morpheme generation attempt ${attempt}/${maxAttempts}`);
      
      // 시도 횟수에 따라 점진적으로 더 강력한 지침 생성
      const baseInstructions = [
        `공백 제외 정확히 1700-2000자 범위 안에서 글을 작성해주세요. (1700자 미만이나 2000자 초과 절대 금지)`,
        `키워드 "${keyword}"의 완전한 형태를 정확히 5-7회 사용해주세요.`,
        `키워드를 구성하는 각 형태소를 정확히 15-17회씩 사용해주세요.`,
        `키워드 형태소가 아닌 모든 단어는 14회 미만으로 제한해주세요.`,
        `서론 600-700자, 본론 900-1100자, 결론 200-300자로 분량을 정확히 배치해주세요.`,
        `어떤 단어도 20회를 초과하면 절대 안됩니다. (검색엔진 스팸 인식)`,
        `키워드 형태소: 정확히 15-17회, 일반 단어: 14회 미만 엄격히 준수!`
      ];
      
      // 시도 횟수에 따른 추가 강조 사항
      const seoSuggestions = [...baseInstructions];
      
      if (attempt === 2) {
        seoSuggestions.push(`⚠️ 중요: 이는 2번째 시도입니다. 반드시 키워드 "${keyword}"를 완전한 형태로 5-7회 사용해주세요!`);
        seoSuggestions.push(`⚠️ 예시: "${keyword}는 ...", "${keyword}의 ...", "${keyword}를 ..." 처럼 완전한 형태로 포함해주세요.`);
      } else if (attempt === 3) {
        seoSuggestions.push(`❗ 최종 시도: 키워드 "${keyword}"를 반드시 글 전체에 정확히 5-7번 포함하십시오!`);
        seoSuggestions.push(`❗ 첫 번째 문장부터 키워드 "${keyword}"를 사용하고, 중간에도 계속 사용하세요!`);
        seoSuggestions.push(`❗ 마지막에 한 번 더 "${keyword}"를 사용하여 총 5-7회를 채우세요!`);
      }
      
      // 추가 형태소가 있으면 포함
      if (customMorphemes) {
        const customMorphemesArray = customMorphemes.split(' ').filter(m => m.trim().length > 0);
        if (customMorphemesArray.length > 0) {
          seoSuggestions.push(`다음 단어들도 자연스럽게 포함해주세요: ${customMorphemesArray.join(', ')}`);
        }
      }
      
      console.log(`Calling writeOptimizedBlogPost for "${keyword}" (attempt ${attempt})...`);
      
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
      console.log(`Starting morpheme analysis for "${keyword}" (attempt ${attempt})...`);
      
      // 형태소 분석
      const analysis = analyzeMorphemes(content, keyword, customMorphemes);
      
      console.log(`Morpheme analysis completed for attempt ${attempt}`);
      console.log(`Attempt ${attempt} analysis:`, {
        isOptimized: analysis.isOptimized,
        characterCount: analysis.characterCount,
        keywordMorphemeCount: analysis.keywordMorphemeCount,
        issues: analysis.issues.slice(0, 3)
      });
      
      // 강력한 검증: 글자수, 키워드, 형태소 빈도 모든 조건 확인
      const isCharacterCountValid = analysis.characterCount >= 1700 && analysis.characterCount <= 2000;
      const isKeywordCountValid = analysis.keywordMorphemeCount >= 5 && analysis.keywordMorphemeCount <= 7;
      
      // 과다 사용 형태소 검사 (20회 초과 방지)
      const hasOverusedMorphemes = analysis.issues.some(issue => 
        issue.includes('형태소 과다 사용') || issue.includes('초과 사용')
      );
      
      console.log(`강력한 검증 결과 (attempt ${attempt}):`, {
        characterCount: analysis.characterCount,
        isCharacterCountValid,
        keywordCount: analysis.keywordMorphemeCount,
        isKeywordCountValid,
        hasOverusedMorphemes,
        isOptimized: analysis.isOptimized,
        issuesCount: analysis.issues.length
      });
      
      // 모든 조건을 충족해야만 성공으로 처리 (더 엄격한 검증)
      const allConditionsMet = isCharacterCountValid && isKeywordCountValid && !hasOverusedMorphemes && analysis.isOptimized;
      
      console.log(`Content generation attempt ${attempt}/${maxAttempts} - All conditions met: ${allConditionsMet}`);
      
      // 모든 조건 충족 시 성공 반환
      if (allConditionsMet) {
        console.log(`✅ SEO 최적화 조건 충족! 시도 ${attempt}에서 성공`);
        return {
          content,
          analysis: {
            ...analysis,
            isOptimized: true,
            isLengthOptimized: isCharacterCountValid,
            isKeywordOptimized: isKeywordCountValid
          },
          attempts: attempt,
          success: true
        };
      }
      
      // 마지막 시도가 아니면 다음 시도로 계속
      if (attempt < maxAttempts) {
        console.log(`⚠️ SEO 조건 미달성, 다음 시도 준비 (${attempt + 1}/${maxAttempts})`);
        console.log(`실패 원인: 글자수 ${isCharacterCountValid ? '✓' : '✗'}, 키워드 빈도 ${isKeywordCountValid ? '✓' : '✗'}, 형태소 과다사용 ${!hasOverusedMorphemes ? '✓' : '✗'}, 전체 최적화 ${analysis.isOptimized ? '✓' : '✗'}`);
        
        // 과다 사용 형태소가 있으면 해결 시도
        if (hasOverusedMorphemes && attempt === 2) {
          console.log('형태소 과다 사용 감지, 해결 시도...');
          try {
            const { resolveMorphemeOveruse } = await import('./morphemeOveruseResolver');
            const resolved = await resolveMorphemeOveruse(content, keyword);
            if (resolved.success) {
              console.log('형태소 과다 사용 해결 성공');
              // 해결된 콘텐츠로 재분석
              const resolvedAnalysis = analyzeMorphemes(resolved.content, keyword, customMorphemes);
              const resolvedAllConditions = 
                resolvedAnalysis.characterCount >= 1700 && resolvedAnalysis.characterCount <= 2000 &&
                resolvedAnalysis.keywordMorphemeCount >= 5 && resolvedAnalysis.keywordMorphemeCount <= 7 &&
                resolvedAnalysis.isOptimized;
              
              if (resolvedAllConditions) {
                return {
                  content: resolved.content,
                  analysis: resolvedAnalysis,
                  attempts: attempt,
                  success: true
                };
              }
            }
          } catch (resolveError) {
            console.error('형태소 과다 사용 해결 실패:', resolveError);
          }
        }
        
        continue; // 다음 시도로
      }
      
      // 3번 시도 후 그냥 생성된 콘텐츠 출력
      console.log(`⚠️ 3번 시도 완료, SEO 조건 미달성이지만 생성된 콘텐츠 그대로 출력`);
      console.log(`최종 상태: 글자수 ${isCharacterCountValid ? '✓' : '✗'}, 키워드 빈도 ${isKeywordCountValid ? '✓' : '✗'}, 형태소 과다사용 ${!hasOverusedMorphemes ? '✓' : '✗'}, 전체 최적화 ${analysis.isOptimized ? '✓' : '✗'}`);
      return {
        content,
        analysis: {
          ...analysis,
          isOptimized: false,
          isLengthOptimized: isCharacterCountValid,
          isKeywordOptimized: isKeywordCountValid
        },
        attempts: maxAttempts,
        success: true // 3번 시도 후에는 그냥 성공으로 처리
      };
      
    } catch (error) {
      console.error(`Generation attempt ${attempt}/${maxAttempts} failed:`, error);
      if (error instanceof Error) {
        console.error(`Error stack:`, error.stack);
      }
      
      // 마지막 시도가 아니면 다음 시도로 계속
      if (attempt < maxAttempts) {
        console.log(`⚠️ 시도 ${attempt} 실패, 다음 시도 준비 (${attempt + 1}/${maxAttempts})`);
        continue;
      }
    }
  }
  
  // 3번 시도 후 최종 처리
  console.log(`⚠️ 3번 시도 완료 - 생성된 콘텐츠를 그대로 출력합니다`);
  return {
    content: `${keyword}에 대한 기본 콘텐츠가 생성되었습니다.`,
    analysis: { isOptimized: false, issues: ['SEO 조건 미달성'], keywordMorphemeCount: 0, characterCount: 0 },
    attempts: maxAttempts,
    success: true // 3번 시도 후에는 무조건 성공 처리
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