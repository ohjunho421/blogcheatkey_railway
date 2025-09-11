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
  // 배포 버전 a43e2530과 동일: 단순한 1회 시도 로직
  const attempts = 1;
  
  try {
    console.log(`Strict morpheme generation attempt ${attempts}/1 (배포 버전 로직)`);
    
    // 엄격한 SEO 지침 생성 (글자수와 형태소 빈도 정확히 맞춤)
    const seoSuggestions = [
      `공백 제외 정확히 1700-2000자 범위 안에서 글을 작성해주세요. (1700자 미만이나 2000자 초과 절대 금지)`,
      `키워드 "${keyword}"의 완전한 형태를 정확히 5-7회 사용해주세요.`,
      `키워드를 구성하는 각 형태소를 정확히 15-17회씩 사용해주세요.`,
      `키워드 형태소가 아닌 모든 단어는 14회 미만으로 제한해주세요.`,
      `서론 600-700자, 본론 900-1100자, 결론 200-300자로 분량을 정확히 배치해주세요.`,
      `어떤 단어도 20회를 초과하면 절대 안됩니다. (검색엔진 스팸 인식)`,
      `키워드 형태소: 정확히 15-17회, 일반 단어: 14회 미만 엄격히 준수!`
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
    
    // 강력한 검증: 글자수, 키워드, 형태소 빈도 모든 조건 확인
    const isCharacterCountValid = analysis.characterCount >= 1700 && analysis.characterCount <= 2000;
    const isKeywordCountValid = analysis.keywordMorphemeCount >= 5 && analysis.keywordMorphemeCount <= 7;
    
    // 과다 사용 형태소 검사 (20회 초과 방지)
    const hasOverusedMorphemes = analysis.issues.some(issue => 
      issue.includes('형태소 과다 사용') || issue.includes('초과 사용')
    );
    
    console.log(`강력한 검증 결과:`, {
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
    
    console.log(`Content generation completed on attempt ${attempts} - All conditions met: ${allConditionsMet}`);
    
    // 검증 실패 시 성공을 false로 반환
    if (!allConditionsMet) {
      console.log(`❌ SEO 최적화 조건 미달성으로 콘텐츠 거부`);
      console.log(`실패 원인: 글자수 ${isCharacterCountValid ? '✓' : '✗'}, 키워드 빈도 ${isKeywordCountValid ? '✓' : '✗'}, 형태소 과다사용 ${!hasOverusedMorphemes ? '✓' : '✗'}, 전체 최적화 ${analysis.isOptimized ? '✓' : '✗'}`);
      return {
        content,
        analysis: {
          ...analysis,
          isOptimized: false,
          isLengthOptimized: isCharacterCountValid,
          isKeywordOptimized: isKeywordCountValid
        },
        attempts,
        success: false
      };
    }
    
    return {
      content,
      analysis: {
        ...analysis,
        isOptimized: true,
        isLengthOptimized: isCharacterCountValid,
        isKeywordOptimized: isKeywordCountValid
      },
      attempts,
      success: true
    };
    
  } catch (error) {
    console.error(`Generation attempt ${attempts} failed:`, error);
    if (error instanceof Error) {
      console.error(`Error stack:`, error.stack);
    }
    
    // 에러 발생 시 실패로 처리 (더 이상 기본 콘텐츠로 우회하지 않음)
    return {
      content: `${keyword}에 대한 콘텐츠 생성 중 오류가 발생했습니다.`,
      analysis: { isOptimized: false, issues: ['콘텐츠 생성 중 오류 발생'], keywordMorphemeCount: 0, characterCount: 0 },
      attempts: 1,
      success: false
    };
  }
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