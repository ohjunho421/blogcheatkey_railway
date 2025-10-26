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
  customMorphemes?: string,
  searchIntent?: string,
  userConcerns?: string
): Promise<StrictGenerationResult> {
  const maxAttempts = 3; // 최대 3회 시도 (1회 생성 + 2회 부분 수정) - 타임아웃 및 사용자 대기 시간 고려
  let previousAnalysis: any = null; // 이전 시도 분석 결과 저장
  let generatedContent: string | null = null; // 1차 생성 결과 저장
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🎯 시도 ${attempt}/${maxAttempts}: ${attempt === 1 ? 'AI 콘텐츠 생성' : '부분 최적화'}`);
      console.log(`${'='.repeat(60)}\n`);
      
      // 기본 지침 (더 강화된 SEO 조건)
      const baseInstructions = [
        `🔥 공백 제외 정확히 1700-2000자 범위 안에서 글을 작성해주세요. (1700자 미만이나 2000자 초과 절대 금지)`,
        `🎯 키워드 "${keyword}"의 완전한 형태를 정확히 5-7회 사용해주세요. (4회 이하나 8회 이상 절대 금지)`,
        `🎯 중요: 키워드 "${keyword}"를 이루는 각각의 단어들을 16회를 목표로 사용해주세요 (15-18회 허용). 예를 들어 "영어학원 블로그"라는 키워드라면 "영어학원"이라는 단어와 "블로그"라는 단어를 각각 약 16회씩 사용하세요.`,
        `🚨 키워드를 구성하는 단어가 아닌 다른 모든 단어는 14회 이하로 제한해주세요. (키워드 우위성 확보 필수)`,
        `📖 서론 600-700자 (전체의 35-40%), 본론 900-1100자, 결론 200-300자로 분량을 정확히 배치해주세요.`,
        `✅ 서론은 독자 공감형(전략 A) 또는 경고형(전략 B) 중 하나를 선택하여 스토리텔링 중심으로 작성`,
        `✅ 결론은 핵심 요약 + 한계 인정 + 부담없는 CTA 구조로 자연스럽게 작성`
      ];
      
      const seoSuggestions = [...baseInstructions];
      
      // 이전 시도 결과를 분석해서 구체적인 수정 지침 추가
      if (previousAnalysis && attempt > 1) {
        console.log(`🔍 이전 시도 분석 기반 맞춤 수정 지침 생성 (attempt ${attempt})`);
        
        // 🆕 통합 피드백: 모든 문제를 한번에 제시
        const problems = [];
        const solutions = [];
        
        // 글자수 문제 해결
        if (previousAnalysis.characterCount < 1700) {
          const needed = 1700 - previousAnalysis.characterCount;
          problems.push(`글자수 ${needed}자 부족 (현재 ${previousAnalysis.characterCount}자)`);
          solutions.push(`본론 부분에 구체적인 예시, 사례, 설명을 ${needed}자 추가`);
        } else if (previousAnalysis.characterCount > 2000) {
          const excess = previousAnalysis.characterCount - 2000;
          problems.push(`글자수 ${excess}자 초과 (현재 ${previousAnalysis.characterCount}자)`);
          solutions.push(`불필요한 부연설명 제거하여 ${excess}자 축소`);
        }
        
        // 키워드 빈도 문제 해결  
        if (previousAnalysis.keywordMorphemeCount < 5) {
          const needed = 5 - previousAnalysis.keywordMorphemeCount;
          problems.push(`키워드 "${keyword}" ${needed}회 부족 (현재 ${previousAnalysis.keywordMorphemeCount}회)`);
          solutions.push(`서론/본론/결론에 "${keyword}"를 자연스럽게 ${needed}회 추가`);
        } else if (previousAnalysis.keywordMorphemeCount > 7) {
          const excess = previousAnalysis.keywordMorphemeCount - 7;
          problems.push(`키워드 "${keyword}" ${excess}회 과다 (현재 ${previousAnalysis.keywordMorphemeCount}회)`);
          solutions.push(`어색한 위치의 "${keyword}"를 ${excess}회 제거하고 문장 자연스럽게 재작성`);
        }
        
        // 과다 사용 단어 문제 해결
        if (previousAnalysis.overusedWords && previousAnalysis.overusedWords.length > 0) {
          const overusedList = previousAnalysis.overusedWords.slice(0, 3).join(', ');
          problems.push(`과다 사용 단어: ${overusedList}`);
          solutions.push(`"${overusedList}" 각각을 5-7회씩 동의어로 치환 (예: 블로그→포스팅, 학원→교육기관)`);
        }
        
        // 🆕 통합 수정 지침
        if (problems.length > 0) {
          seoSuggestions.push(`\n❌ 발견된 ${problems.length}개 문제:\n${problems.map((p, i) => `  ${i+1}. ${p}`).join('\n')}`);
          seoSuggestions.push(`\n✅ 해결 방법 (모두 동시에 적용):\n${solutions.map((s, i) => `  ${i+1}. ${s}`).join('\n')}`);
          seoSuggestions.push(`\n⚠️ 중요: 위 모든 문제를 동시에 해결하되, 글의 자연스러운 흐름은 반드시 유지하세요!`);
        }
        
        // 시도별 강조 (3회 안에 완성)
        if (attempt === 2) {
          seoSuggestions.push(`\n🔥 2차 수정 [중요]: 위 ${problems.length}개 문제를 정확히 해결해주세요!`);
          seoSuggestions.push(`⏰ 다음이 마지막 시도입니다. 이번에 최대한 정확하게 수정해주세요!`);
        } else if (attempt === 3) {
          seoSuggestions.push(`\n🔥🔥🔥 최종 3차 수정 [매우 중요]: 마지막 기회입니다!`);
          seoSuggestions.push(`📊 숫자 조건을 정확히 맞춰주세요: 글자수 1700-2000자, 키워드 5-7회`);
          seoSuggestions.push(`⚠️ 이번 시도가 실패하면 SEO 조건 미달로 완료됩니다. 반드시 모든 조건을 충족해주세요!`);
        }
      }
      
      // 추가 형태소가 있으면 포함
      if (customMorphemes) {
        const customMorphemesArray = customMorphemes.split(' ').filter(m => m.trim().length > 0);
        if (customMorphemesArray.length > 0) {
          seoSuggestions.push(`다음 단어들도 자연스럽게 포함해주세요: ${customMorphemesArray.join(', ')}`);
        }
      }
      
      let content: string = '';
      
      // 첫 시도는 AI 생성, 이후는 부분 수정만
      if (attempt === 1) {
        console.log(`🤖 Claude로 초기 콘텐츠 생성 중...`);
        
        content = await writeOptimizedBlogPost(
          keyword,
          subtitles,
          researchData,
          businessInfo,
          seoSuggestions,
          referenceLinks,
          searchIntent,
          userConcerns
        );
        
        generatedContent = content; // 1차 생성 결과 저장
        console.log(`✅ 초기 콘텐츠 생성 완료: ${content.length} characters`);
      } else {
        console.log(`🔧 이전 콘텐츠 부분 수정 시도 중...`);
        
        // 2차 이후는 부분 최적화만 수행 (재생성 X)
        const { optimizeIncrementally } = await import('./incrementalOptimizer');
        const optimized = await optimizeIncrementally(
          generatedContent || '',
          keyword,
          customMorphemes
        );
        
        if (optimized.success) {
          console.log(`✅ 부분 최적화 성공! ${optimized.fixed.length}개 문제 해결`);
          content = optimized.content;
        } else {
          console.log(`⚠️ 부분 최적화 미완료, 현재 상태 유지`);
          content = optimized.content; // 개선된 버전이라도 사용
        }
      }
    
      console.log(`📊 형태소 분석 시작 (attempt ${attempt})...`);
      
      // 형태소 분석
      const analysis = await analyzeMorphemes(content, keyword, customMorphemes);
      
      console.log(`Morpheme analysis completed for attempt ${attempt}`);
      console.log(`Attempt ${attempt} analysis:`, {
        isOptimized: analysis.isOptimized,
        characterCount: analysis.characterCount,
        keywordMorphemeCount: analysis.keywordMorphemeCount,
        issues: analysis.issues.slice(0, 3)
      });
      
      // 다음 시도를 위해 현재 분석 결과 저장
      previousAnalysis = {
        characterCount: analysis.characterCount,
        keywordMorphemeCount: analysis.keywordMorphemeCount,
        isOptimized: analysis.isOptimized,
        overusedWords: analysis.issues
          .filter(issue => issue.includes('초과 사용') || issue.includes('과다 사용'))
          .map(issue => issue.split(' ')[0]) // 단어 추출
          .slice(0, 5)
      };
      
      // SEO 최적화 조건 검증 (단순화)
      // analysis.isOptimized는 이미 글자수, 키워드 빈도, 구성요소 빈도, 과다사용을 모두 체크함
      const isCharacterCountValid = analysis.characterCount >= 1700 && analysis.characterCount <= 2000;
      const isKeywordCountValid = analysis.keywordMorphemeCount >= 5 && analysis.keywordMorphemeCount <= 7;
      const hasOverusedMorphemes = analysis.issues.some(issue => 
        issue.includes('형태소 과다 사용') || issue.includes('초과 사용')
      );
      
      console.log(`📊 검증 결과 (시도 ${attempt}/${maxAttempts}):`, {
        '글자수': `${analysis.characterCount}자 ${isCharacterCountValid ? '✓' : '✗'}`,
        '완전키워드': `${analysis.keywordMorphemeCount}회 ${isKeywordCountValid ? '✓' : '✗'}`,
        '과다사용': hasOverusedMorphemes ? '있음 ✗' : '없음 ✓',
        '전체최적화': analysis.isOptimized ? '완료 ✓' : '미완료 ✗',
        '문제수': analysis.issues.length
      });
      
      // analysis.isOptimized를 주 기준으로 사용 (이미 모든 조건 포함)
      const allConditionsMet = analysis.isOptimized;
      
      console.log(`✨ 최종 판정: ${allConditionsMet ? '성공 ✅' : '미달 ⚠️'}`);
      
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
      
      // 마지막 시도가 아니면 다음 부분 수정 시도로 계속
      if (attempt < maxAttempts) {
        console.log(`\n⚠️ SEO 조건 미달성 - 다음 시도 준비 (${attempt + 1}/${maxAttempts})`);
        console.log(`현재 상태: 글자수 ${isCharacterCountValid ? '✓' : '✗'}, 키워드 빈도 ${isKeywordCountValid ? '✓' : '✗'}, 형태소 과다사용 ${!hasOverusedMorphemes ? '✓' : '✗'}`);
        console.log(`다음 시도는 부분 수정만 수행합니다 (재생성 X)\n`);
        
        // 다음 시도를 위한 정보 저장
        previousAnalysis = {
          characterCount: analysis.characterCount,
          keywordMorphemeCount: analysis.keywordMorphemeCount,
          isOptimized: analysis.isOptimized,
          overusedWords: analysis.issues
            .filter(issue => issue.includes('초과 사용') || issue.includes('과다 사용'))
            .map(issue => issue.split(' ')[0])
            .slice(0, 5)
        };
        
        continue; // 다음 부분 최적화 시도로
      }
      
      // 최대 시도 후 최종본 반환
      console.log(`\n${'='.repeat(60)}`);
      console.log(`✅ ${maxAttempts}회 시도 완료 - 최종 결과 출력`);
      console.log(`${'='.repeat(60)}`);
      console.log(`최종 상태:`);
      console.log(`  글자수: ${analysis.characterCount}자 ${isCharacterCountValid ? '✓' : '✗'}`);
      console.log(`  키워드 빈도: ${analysis.keywordMorphemeCount}회 ${isKeywordCountValid ? '✓' : '✗'}`);
      console.log(`  형태소 과다사용: ${!hasOverusedMorphemes ? '없음 ✓' : '있음 ✗'}`);
      console.log(`  전체 최적화: ${analysis.isOptimized ? '완료 ✓' : '미완료 ✗'}\n`);
      
      // 최대 시도 후에는 현재 상태 그대로 반환
      return {
        content,
        analysis,
        attempts: maxAttempts,
        success: allConditionsMet // 실제 조건 충족 여부 반환
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
  
  // 모든 시도 실패 (에러로 도달)
  console.log(`\n❌ ${maxAttempts}회 시도 완료 - 모든 시도 실패`);
  return {
    content: generatedContent || `${keyword}에 대한 기본 콘텐츠가 생성되었습니다.`,
    analysis: { isOptimized: false, issues: ['SEO 조건 미달성'], keywordMorphemeCount: 0, characterCount: 0 },
    attempts: maxAttempts,
    success: false // 실패로 명확히 표시
  };
}

// 재생성을 위한 함수 추가
export async function regenerateWithStrictMorphemes(
  currentContent: string,
  keyword: string,
  subtitles: string[],
  researchData: { content: string; citations: string[] },
  businessInfo: BusinessInfo,
  customMorphemes?: string,
  searchIntent?: string,
  userConcerns?: string
): Promise<StrictGenerationResult> {
  // 기존 콘텐츠를 바탕으로 새로 생성 (동일한 로직 사용)
  return generateStrictMorphemeContent(
    keyword,
    subtitles,
    researchData,
    businessInfo,
    undefined,
    customMorphemes,
    searchIntent,
    userConcerns
  );
}