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
  const maxAttempts = 3; // 최대 3회 시도 (타임아웃 방지 + 사용자 대기 시간 최소화)
  let previousAnalysis: any = null; // 이전 시도 분석 결과 저장
  let generatedContent: string | null = null; // 1차 생성 결과 저장
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🎯 시도 ${attempt}/${maxAttempts}: ${attempt === 1 ? 'AI 콘텐츠 생성' : '부분 최적화'}`);
      console.log(`${'='.repeat(60)}\n`);
      
      // 기본 지침 (더 강화된 SEO 조건)
      const baseInstructions = [
        `🔥🔥 글자수 절대 준수! 1750-1950자 범위 필수!`,
        `   → 1800-1900자를 정확히 목표로! (1700자 이하 ❌, 2000자 이상 ❌)`,
        `   → 서론 650자 + 본론 1000자 + 결론 250자 = 약 1900자`,
        `   → 작성 중 실시간으로 글자수를 세면서 작성하세요!`,
        ``,
        `🎯 키워드 "${keyword}"의 완전한 형태를 정확히 5-7회 사용 (6회 목표)`,
        `   → 작성하면서 키워드를 몇 번 사용했는지 세면서 작성하세요!`,
        ``,
        `🎯🎯🎯 가장 중요: 키워드 형태소를 15-18회씩 사용 (16회 목표)`,
        `   `,
        `   ⚠️ 냉각수부동액의 경우:`,
        `   키워드 형태소: ["냉각", "부동"] (2글자 이상만)`,
        `   `,
        `   체크되는 단어들 (각각 별도 카운트):`,
        `     • "냉각" 16회 → "냉각 시스템", "냉각 효과" 등`,
        `     • "냉각수" 16회 → "냉각수를", "냉각수가" 등`,
        `     • "부동" 16회 → "부동 성능", "부동 기능" 등`,
        `     • "부동액" 16회 → "부동액을", "부동액이" 등`,
        `   `,
        `   💡 4개 단어 모두 각각 16회씩 사용하세요!`,
        `   ⚠️ "수", "액" 같은 1글자는 제외 (너무 일반적)`,
        `   ⚠️ 주의: "냉각" 23회는 과다! → 16회로 조절`,
        `   `,
        `   💡 다른 예시:`,
        `     • "벤츠엔진경고등" → 형태소: ["벤츠", "엔진", "경고"]`,
        `       → "벤츠" 16회, "엔진" 16회, "경고" 16회, "경고등" 16회 (각각!)`,
        `     • "타이어교체비용" → 형태소: ["타이어", "교체", "비용"]`,
        `   `,
        `   → 작성 중 "냉각: 14회, 냉각수: 15회, 부동: 13회, 부동액: 16회..." 이렇게 세세요!`,
        ``,
        `🚨🚨 절대 규칙: 어떤 단어든 20회 절대 초과 금지! 🚨🚨`,
        `   • 키워드 관련 단어: 최대 18회까지만`,
        `   • 일반 단어: 최대 14회까지만`,
        `   • 20회 이상 = 심각한 과다 → 반드시 동의어로 분산`,
        ``,
        `🚨 일반 단어: 14회 이하로 제한`,
        `   → 10-12회 정도가 적당합니다.`,
        `   → 동의어 예시: 교체→변경/갈아주기, 점검→확인/체크, 문제→이슈/고장`,
        ``,
        `⚠️ 문장 길이 조절: 한 문장은 30-50자 정도가 적당합니다.`,
        `   → 30자 이하 문장은 그대로 유지 (끊지 말 것!)`,
        `   → 너무 긴 문장(70자 이상)만 두 문장으로 나누세요.`,
        ``,
        `📖 분량 배치: 서론 600-700자 (35-40%), 본론 900-1100자, 결론 200-300자`,
        `✅ 서론: 독자 공감형 또는 경고형 스토리텔링`,
        `✅ 결론: 핵심 요약 + 한계 인정 + 부담없는 CTA`
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
          const overusedDetails = previousAnalysis.overusedWords.slice(0, 5).map((word: any) => {
            if (typeof word === 'object' && word.word && word.count) {
              const excess = word.count - 14;
              // 20회 이상은 심각한 과다
              if (word.count >= 20) {
                return `"${word.word}" ${word.count}회 (🚨 심각한 과다! 20회 초과)`;
              }
              return `"${word.word}" ${word.count}회 (${excess}회 초과)`;
            }
            return `"${word}"`;
          });
          problems.push(`과다 사용 단어: ${overusedDetails.join(', ')}`);
          
          // 구체적인 치환 방법 제시
          const replacementGuide = previousAnalysis.overusedWords.slice(0, 5).map((word: any) => {
            const wordText = typeof word === 'object' ? word.word : word;
            const count = typeof word === 'object' ? word.count : 0;
            const excess = count - 14;
            
            // 20회 이상 특별 처리
            if (count >= 20) {
              return `"${wordText}" 🚨 심각한 과다 (${count}회)! 반드시 동의어로 최소 ${count - 14}회 치환`;
            }
            
            // 단어별 동의어 제안
            let synonyms = '동의어나 표현 변경';
            if (wordText.includes('냉각')) synonyms = '"쿨링", "온도 조절", "열 관리"';
            else if (wordText.includes('부동액')) synonyms = '"쿨런트", "냉각수"';
            else if (wordText.includes('교체')) synonyms = '"변경", "새로 교환", "갈아주기"';
            else if (wordText.includes('점검')) synonyms = '"확인", "체크", "살펴보기"';
            
            return `"${wordText}"를 ${excess > 0 ? excess : '일부'}회 ${synonyms}로 치환`;
          }).join(', ');
          
          solutions.push(`과다 사용 단어 치환: ${replacementGuide}`);
          solutions.push(`⚠️ 중요: 키워드가 아닌 단어는 반드시 14회 이하로 제한하세요!`);
          solutions.push(`🚨 절대 규칙: 어떤 단어든 20회 절대 초과 금지! 20회 이상은 반드시 동의어로 분산!`);
        }
        
        // 🆕 통합 수정 지침
        if (problems.length > 0) {
          seoSuggestions.push(`\n❌ 발견된 ${problems.length}개 문제:\n${problems.map((p, i) => `  ${i+1}. ${p}`).join('\n')}`);
          seoSuggestions.push(`\n✅ 해결 방법 (모두 동시에 적용):\n${solutions.map((s, i) => `  ${i+1}. ${s}`).join('\n')}`);
          seoSuggestions.push(`\n⚠️ 중요: 위 모든 문제를 동시에 해결하되, 글의 자연스러운 흐름은 반드시 유지하세요!`);
        }
        
        // 시도별 강조 (3회 시도 - 효율적이고 집중적인 개선)
        if (attempt === 2) {
          seoSuggestions.push(`\n🔥 2차 수정 [중요]: 위 ${problems.length}개 문제를 정확히 해결해주세요!`);
          seoSuggestions.push(`💡 특히 과다 사용 단어는 즉시 동의어로 치환하세요!`);
          seoSuggestions.push(`📊 글자수 체크: 1750-1950자 범위 (1800-1900자 목표)`);
          seoSuggestions.push(`📊 키워드 관련 단어 각각 15-18회로 조절`);
          seoSuggestions.push(`   예) "냉각" 16회, "냉각수" 16회 (각각 별도!)`);
          seoSuggestions.push(`🚨 절대 규칙: 어떤 단어든 20회 절대 초과 금지!`);
          seoSuggestions.push(`⏰ 다음이 마지막 시도입니다. 이번에 최대한 정확하게 수정하세요!`);
        } else if (attempt === 3) {
          seoSuggestions.push(`\n🔥🔥🔥 최종 3차 수정 [매우 긴급]: 마지막 기회입니다!`);
          seoSuggestions.push(`📊 모든 숫자 조건을 정확히 맞춰주세요:`);
          seoSuggestions.push(`   • 글자수: 1800-1900자 정확히! (1750-1950자 범위, 1700자 이하 ❌)`);
          seoSuggestions.push(`   • 완전 키워드 "${keyword}": 6회 (5-7회 범위)`);
          seoSuggestions.push(`   • 키워드 형태소 + 파생어: 각각 별도로 16회 (15-18회 범위)`);
          seoSuggestions.push(`     예) "냉각수부동액" → "냉각" 16회, "냉각수" 16회, "부동" 16회, "부동액" 16회 (각각!)`);
          seoSuggestions.push(`   • 일반 단어: 14회 이하 (10-12회 권장)`);
          seoSuggestions.push(`   🚨 절대 규칙: 어떤 단어든 20회 절대 초과 금지!`);
          seoSuggestions.push(`⚠️ 이번이 마지막 시도! 각 단어를 쓸 때마다 횟수를 세면서 작성하세요!`);
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
          .map(issue => {
            // "형태소 과다 사용: "냉각" 34회 (최대 14회)" 형식에서 추출
            const match = issue.match(/"([^"]+)"\s+(\d+)회/);
            if (match) {
              return { word: match[1], count: parseInt(match[2]) };
            }
            // 폴백: 단어만 추출
            const word = issue.split(' ')[0].replace(/"/g, '');
            return { word, count: 0 };
          })
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
            .map(issue => {
              // "형태소 과다 사용: "냉각" 34회 (최대 14회)" 형식에서 추출
              const match = issue.match(/"([^"]+)"\s+(\d+)회/);
              if (match) {
                return { word: match[1], count: parseInt(match[2]) };
              }
              // 폴백: 단어만 추출
              const word = issue.split(' ')[0].replace(/"/g, '');
              return { word, count: 0 };
            })
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