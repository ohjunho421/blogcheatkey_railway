import { analyzeMorphemes } from './morphemeAnalyzer';

interface OptimizationIssue {
  type: 'character_count' | 'keyword_count' | 'overused_word';
  description: string;
  target: number;
  current: number;
  word?: string;
}

interface IncrementalOptimizationResult {
  content: string;
  success: boolean;
  issues: OptimizationIssue[];
  fixed: string[];
}

/**
 * 조건에 안 맞는 부분만 찾아서 자연스럽게 수정하는 함수
 * 재생성이 아닌 정밀한 부분 수정 방식 사용
 */
export async function optimizeIncrementally(
  content: string,
  keyword: string,
  customMorphemes?: string
): Promise<IncrementalOptimizationResult> {
  
  console.log('📊 부분 최적화 시작: 조건 미달 부분만 정밀 수정');
  
  // 1단계: 현재 상태 분석
  const analysis = analyzeMorphemes(content, keyword, customMorphemes);
  const issues: OptimizationIssue[] = [];
  const fixed: string[] = [];
  
  let optimizedContent = content;
  
  console.log('현재 상태:', {
    글자수: analysis.characterCount,
    키워드빈도: analysis.keywordMorphemeCount,
    최적화여부: analysis.isOptimized
  });
  
  // 2단계: 문제점 파악
  console.log('🔍 문제점 파악 중...');
  
  // 글자수 체크
  if (analysis.characterCount < 1700) {
    const deficit = 1700 - analysis.characterCount;
    issues.push({
      type: 'character_count',
      description: `글자수 ${deficit}자 부족`,
      target: 1700,
      current: analysis.characterCount
    });
    console.log(`❌ 글자수 부족: ${analysis.characterCount}자 (${deficit}자 부족)`);
  } else if (analysis.characterCount > 2000) {
    const excess = analysis.characterCount - 2000;
    issues.push({
      type: 'character_count',
      description: `글자수 ${excess}자 초과`,
      target: 2000,
      current: analysis.characterCount
    });
    console.log(`❌ 글자수 초과: ${analysis.characterCount}자 (${excess}자 초과)`);
  } else {
    console.log(`✅ 글자수 적정: ${analysis.characterCount}자`);
  }
  
  // 키워드 빈도 체크
  if (analysis.keywordMorphemeCount < 5) {
    const deficit = 5 - analysis.keywordMorphemeCount;
    issues.push({
      type: 'keyword_count',
      description: `키워드 "${keyword}" ${deficit}회 부족`,
      target: 10, // 중간값 (5-15의 중간)
      current: analysis.keywordMorphemeCount
    });
    console.log(`❌ 키워드 부족: ${analysis.keywordMorphemeCount}회 (${deficit}회 부족)`);
  } else if (analysis.keywordMorphemeCount > 15) {
    const excess = analysis.keywordMorphemeCount - 15;
    issues.push({
      type: 'keyword_count',
      description: `키워드 "${keyword}" ${excess}회 초과`,
      target: 10, // 중간값 (5-15의 중간)
      current: analysis.keywordMorphemeCount
    });
    console.log(`❌ 키워드 초과: ${analysis.keywordMorphemeCount}회 (${excess}회 초과)`);
  } else {
    console.log(`✅ 키워드 빈도 적정: ${analysis.keywordMorphemeCount}회`);
  }
  
  // 과다 사용 단어 체크
  const overusedWords = analysis.issues
    .filter(issue => issue.includes('초과') || issue.includes('과다'))
    .slice(0, 3);
  
  if (overusedWords.length > 0) {
    console.log(`❌ 과다 사용 단어 발견: ${overusedWords.length}개`);
    overusedWords.forEach(issue => {
      const word = issue.split(' ')[0];
      issues.push({
        type: 'overused_word',
        description: issue,
        target: 14,
        current: 15,
        word
      });
    });
  }
  
  // 3단계: 문제가 없으면 그대로 반환
  if (issues.length === 0) {
    console.log('✅ 모든 조건 충족, 수정 불필요');
    return {
      content,
      success: true,
      issues: [],
      fixed: []
    };
  }
  
  // 4단계: 문제점만 골라서 수정
  console.log(`🔧 ${issues.length}개 문제 수정 시작`);
  
  for (const issue of issues) {
    try {
      if (issue.type === 'character_count') {
        optimizedContent = await fixCharacterCount(optimizedContent, issue, keyword);
        fixed.push(issue.description);
      } else if (issue.type === 'keyword_count') {
        optimizedContent = await fixKeywordCount(optimizedContent, issue, keyword);
        fixed.push(issue.description);
      } else if (issue.type === 'overused_word' && issue.word) {
        optimizedContent = await fixOverusedWord(optimizedContent, issue.word);
        fixed.push(issue.description);
      }
    } catch (error) {
      console.error(`수정 실패 (${issue.description}):`, error);
    }
  }
  
  // 5단계: 최종 검증 (과다사용 문제까지 확인)
  const finalAnalysis = analyzeMorphemes(optimizedContent, keyword, customMorphemes);
  
  const hasNoOveruse = !finalAnalysis.issues.some(issue => 
    issue.includes('초과') || issue.includes('과다')
  );
  
  const isSuccess = 
    finalAnalysis.characterCount >= 1700 && 
    finalAnalysis.characterCount <= 2000 &&
    finalAnalysis.keywordMorphemeCount >= 5 &&
    finalAnalysis.keywordMorphemeCount <= 15 &&
    hasNoOveruse; // 과다사용 문제도 확인
  
  console.log(`${isSuccess ? '✅' : '⚠️'} 부분 최적화 완료: ${fixed.length}개 수정`);
  console.log(`  최종 검증: 글자수 ${finalAnalysis.characterCount}자, 키워드 ${finalAnalysis.keywordMorphemeCount}회, 과다사용 ${hasNoOveruse ? '없음' : '있음'}`);
  
  return {
    content: optimizedContent,
    success: isSuccess,
    issues,
    fixed
  };
}

/**
 * 글자수 조정 (부족하면 확장, 초과하면 축소)
 */
async function fixCharacterCount(
  content: string,
  issue: OptimizationIssue,
  keyword: string
): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_ENV_VAR || '' 
  });
  
  const isDeficit = issue.current < issue.target;
  const amount = Math.abs(issue.target - issue.current);
  
  const prompt = isDeficit 
    ? `다음 블로그 글의 본론 부분을 ${amount}자 정도 확장해주세요. 키워드 "${keyword}"를 자연스럽게 포함하면서 내용을 더 상세하게 설명해주세요.

글 전체:
${content}

조건:
- 본론 부분만 ${amount}자 정도 확장
- 키워드 "${keyword}" 자연스럽게 포함
- 기존 내용의 흐름을 해치지 않고 자연스럽게 추가
- 구체적인 예시나 부연 설명 추가
- 소제목은 그대로 유지

확장된 전체 글을 출력해주세요:`
    : `다음 블로그 글을 ${amount}자 정도 줄여주세요. 핵심 내용은 유지하면서 불필요한 부연 설명만 제거해주세요.

글 전체:
${content}

조건:
- ${amount}자 정도 축소
- 핵심 내용과 키워드 "${keyword}"는 유지
- 자연스러운 흐름 유지
- 소제목은 그대로 유지

축소된 전체 글을 출력해주세요:`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }]
  });
  
  const optimized = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || content;
  
  console.log(`  ✓ 글자수 조정 완료: ${issue.current}자 → ${optimized.replace(/\s/g, '').length}자`);
  
  return optimized;
}

/**
 * 키워드 빈도 조정
 */
async function fixKeywordCount(
  content: string,
  issue: OptimizationIssue,
  keyword: string
): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_ENV_VAR || '' 
  });
  
  const isDeficit = issue.current < issue.target;
  const amount = Math.abs(issue.target - issue.current);
  
  const prompt = isDeficit
    ? `다음 블로그 글에 키워드 "${keyword}"를 ${amount}회 더 자연스럽게 추가해주세요.

글 전체:
${content}

조건:
- 키워드 "${keyword}"를 정확히 ${amount}회 더 추가
- 본론 부분에 자연스럽게 배치
- 기존 문장을 자연스럽게 수정하여 키워드 포함
- 억지로 끼워넣지 말고 문맥에 맞게 추가
- 전체 글의 흐름과 길이는 최대한 유지

수정된 전체 글을 출력해주세요:`
    : `다음 블로그 글에서 키워드 "${keyword}"를 ${amount}회 제거해주세요.

글 전체:
${content}

조건:
- 키워드 "${keyword}"를 정확히 ${amount}회 제거
- 가장 어색한 위치의 키워드부터 제거
- 문장을 자연스럽게 다시 작성
- 전체 글의 의미와 흐름은 유지

수정된 전체 글을 출력해주세요:`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }]
  });
  
  const optimized = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || content;
  
  console.log(`  ✓ 키워드 조정 완료: ${issue.current}회 → 목표 ${issue.target}회`);
  
  return optimized;
}

/**
 * 과다 사용 단어를 동의어로 치환
 */
async function fixOverusedWord(
  content: string,
  word: string
): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_ENV_VAR || '' 
  });
  
  const prompt = `다음 블로그 글에서 "${word}" 단어를 동의어로 일부 치환해주세요.

글 전체:
${content}

조건:
- "${word}" 단어 중 5-7개를 자연스러운 동의어로 치환
- 문맥에 맞는 적절한 동의어 사용
- 전체 글의 의미와 흐름은 유지
- 너무 어색한 단어는 사용하지 말기

수정된 전체 글을 출력해주세요:`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }]
  });
  
  const optimized = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || content;
  
  console.log(`  ✓ 과다 사용 단어 치환 완료: "${word}"`);
  
  return optimized;
}
