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
  const analysis = await analyzeMorphemes(content, keyword, customMorphemes);
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
      target: 6, // 중간값 (5-7의 중간)
      current: analysis.keywordMorphemeCount
    });
    console.log(`❌ 키워드 부족: ${analysis.keywordMorphemeCount}회 (${deficit}회 부족)`);
  } else if (analysis.keywordMorphemeCount > 7) {
    const excess = analysis.keywordMorphemeCount - 7;
    issues.push({
      type: 'keyword_count',
      description: `키워드 "${keyword}" ${excess}회 초과`,
      target: 6, // 중간값 (5-7의 중간)
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
  
  // 4단계: 🆕 모든 문제를 통합 수정 (순차가 아닌 동시 해결)
  console.log(`🔧 ${issues.length}개 문제 통합 수정 시작`);
  
  if (issues.length === 1) {
    // 문제가 1개면 개별 수정
    const issue = issues[0];
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
  } else if (issues.length > 1) {
    // 문제가 2개 이상이면 통합 수정
    try {
      optimizedContent = await fixAllIssuesAtOnce(optimizedContent, issues, keyword);
      fixed.push(...issues.map(i => i.description));
    } catch (error) {
      console.error(`통합 수정 실패, 순차 수정으로 전환:`, error);
      // 통합 실패 시 순차 처리로 폴백
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
    }
  }
  
  // 5단계: 최종 검증 (과다사용 문제까지 확인)
  const finalAnalysis = await analyzeMorphemes(optimizedContent, keyword, customMorphemes);
  
  const hasNoOveruse = !finalAnalysis.issues.some(issue => 
    issue.includes('초과') || issue.includes('과다')
  );
  
  const isSuccess = 
    finalAnalysis.characterCount >= 1700 && 
    finalAnalysis.characterCount <= 2000 &&
    finalAnalysis.keywordMorphemeCount >= 5 &&
    finalAnalysis.keywordMorphemeCount <= 7 &&
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
 * 🆕 모든 문제를 한번에 해결하는 통합 수정 함수
 */
async function fixAllIssuesAtOnce(
  content: string,
  issues: OptimizationIssue[],
  keyword: string
): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_ENV_VAR || '' 
  });
  
  // 문제점과 해결방법을 구조화
  const problems: string[] = [];
  const solutions: string[] = [];
  
  issues.forEach(issue => {
    if (issue.type === 'character_count') {
      const diff = Math.abs(issue.target - issue.current);
      if (issue.current < issue.target) {
        problems.push(`글자수 ${diff}자 부족 (현재 ${issue.current}자, 목표 ${issue.target}자)`);
        solutions.push(`본론에 구체적 예시/설명 ${diff}자 추가`);
      } else {
        problems.push(`글자수 ${diff}자 초과 (현재 ${issue.current}자, 목표 ${issue.target}자)`);
        solutions.push(`불필요한 부연설명 ${diff}자 제거`);
      }
    } else if (issue.type === 'keyword_count') {
      const diff = Math.abs(issue.target - issue.current);
      if (issue.current < issue.target) {
        problems.push(`키워드 "${keyword}" ${diff}회 부족 (현재 ${issue.current}회)`);
        solutions.push(`"${keyword}" ${diff}회 자연스럽게 추가`);
      } else {
        problems.push(`키워드 "${keyword}" ${diff}회 과다 (현재 ${issue.current}회)`);
        solutions.push(`어색한 "${keyword}" ${diff}회 제거`);
      }
    } else if (issue.type === 'overused_word' && issue.word) {
      problems.push(`"${issue.word}" 과다 사용`);
      solutions.push(`"${issue.word}"를 5-7회 동의어로 치환`);
    }
  });

  const prompt = `다음 블로그 글을 수정하는 작업을 수행하세요.

[원본 글]
${content}

[발견된 ${problems.length}개 문제]
${problems.map((p, i) => `${i+1}. ${p}`).join('\n')}

[해결 방법 - 모두 동시에 적용]
${solutions.map((s, i) => `${i+1}. ${s}`).join('\n')}

[중요 작업 규칙]
1. 위 모든 문제를 동시에 해결하세요
2. 한 문제를 해결할 때 다른 문제가 생기지 않도록 주의하세요
3. 글의 자연스러운 흐름과 의미는 반드시 유지하세요
4. 숫자 조건(글자수, 빈도)을 정확히 맞추세요
5. 소제목은 그대로 유지하세요

[중요 출력 규칙]
- 수정된 블로그 글의 본문만 출력하세요
- 설명문, 메타 정보, 마크다운 형식 등 어떤 추가 텍스트도 포함하지 마세요
- "수정된 글:", "다음과 같이", "요청하신" 등의 서술 표현 절대 금지
- 순수한 블로그 본문 텍스트만 반환하세요`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }]
  });
  
  const optimized = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || content;
  
  console.log(`  ✓ 통합 수정 완료: ${issues.length}개 문제 동시 해결`);
  
  return optimized;
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
    ? `다음 블로그 글의 본론 부분을 ${amount}자 정도 확장하는 작업을 수행하세요.

[원본 글]
${content}

[작업 지침]
1. 본론 부분만 ${amount}자 정도 확장하세요
2. 키워드 "${keyword}"를 자연스럽게 포함하세요
3. 기존 내용의 흐름을 해치지 않고 자연스럽게 추가하세요
4. 구체적인 예시나 부연 설명을 추가하세요
5. 소제목은 그대로 유지하세요

[중요 출력 규칙]
- 수정된 블로그 글의 본문만 출력하세요
- 설명문, 메타 정보, 마크다운 형식 등 어떤 추가 텍스트도 포함하지 마세요
- "확장된 글:", "다음과 같이", "요청하신" 등의 서술 표현 절대 금지
- 순수한 블로그 본문 텍스트만 반환하세요`
    : `다음 블로그 글을 ${amount}자 정도 줄이는 작업을 수행하세요.

[원본 글]
${content}

[작업 지침]
1. ${amount}자 정도 축소하세요
2. 핵심 내용과 키워드 "${keyword}"는 유지하세요
3. 자연스러운 흐름을 유지하세요
4. 소제목은 그대로 유지하세요

[중요 출력 규칙]
- 수정된 블로그 글의 본문만 출력하세요
- 설명문, 메타 정보, 마크다운 형식 등 어떤 추가 텍스트도 포함하지 마세요
- "축소된 글:", "다음과 같이", "요청하신" 등의 서술 표현 절대 금지
- 순수한 블로그 본문 텍스트만 반환하세요`;
  
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
    ? `다음 블로그 글에 키워드 "${keyword}"를 ${amount}회 더 추가하는 작업을 수행하세요.

[원본 글]
${content}

[작업 지침]
1. 키워드 "${keyword}"를 정확히 ${amount}회 더 추가하세요
2. 본론 부분에 자연스럽게 배치하세요
3. 기존 문장을 자연스럽게 수정하여 키워드를 포함하세요
4. 억지로 끼워넣지 말고 문맥에 맞게 추가하세요
5. 전체 글의 흐름과 길이는 최대한 유지하세요

[중요 출력 규칙]
- 수정된 블로그 글의 본문만 출력하세요
- 설명문, 메타 정보, 마크다운 형식 등 어떤 추가 텍스트도 포함하지 마세요
- "수정된 글:", "다음과 같이", "요청하신" 등의 서술 표현 절대 금지
- 순수한 블로그 본문 텍스트만 반환하세요`
    : `다음 블로그 글에서 키워드 "${keyword}"를 ${amount}회 제거하는 작업을 수행하세요.

[원본 글]
${content}

[작업 지침]
1. 키워드 "${keyword}"를 정확히 ${amount}회 제거하세요
2. 가장 어색한 위치의 키워드부터 제거하세요
3. 문장을 자연스럽게 다시 작성하세요
4. 전체 글의 의미와 흐름은 유지하세요

[중요 출력 규칙]
- 수정된 블로그 글의 본문만 출력하세요
- 설명문, 메타 정보, 마크다운 형식 등 어떤 추가 텍스트도 포함하지 마세요
- "수정된 글:", "다음과 같이", "요청하신" 등의 서술 표현 절대 금지
- 순수한 블로그 본문 텍스트만 반환하세요`;
  
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
  
  const prompt = `다음 블로그 글에서 "${word}"라는 단어를 동의어로 일부 치환하는 작업을 수행하세요.

[원본 글]
${content}

[작업 지침]
1. "${word}"라는 단어 중 5-7개를 문맥에 맞는 자연스러운 동의어로 치환하세요
2. 글의 전체 의미와 흐름은 반드시 유지하세요
3. 너무 어색하거나 전문적이지 않은 단어는 사용하지 마세요

[중요 출력 규칙]
- 수정된 블로그 글의 본문만 출력하세요
- 설명문, 메타 정보, 마크다운 형식 등 어떤 추가 텍스트도 포함하지 마세요
- "수정된 글:", "다음과 같이", "요청하신" 등의 서술 표현 절대 금지
- 순수한 블로그 본문 텍스트만 반환하세요`;  
  
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
