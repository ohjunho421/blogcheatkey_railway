import { analyzeMorphemes } from './morphemeAnalyzer';

interface OptimizationIssue {
  type: 'character_count' | 'keyword_count' | 'overused_word' | 'keyword_dominance';
  description: string;
  target: number;
  current: number;
  word?: string;
  dominantWords?: Array<{word: string, count: number}>; // 🆕 키워드보다 빈번한 일반 단어들
}

interface IncrementalOptimizationResult {
  content: string;
  success: boolean;
  issues: OptimizationIssue[];
  fixed: string[];
}

/**
 * 조건에 안 맞는 부분만 찾아서 자연스럽게 수정하는 함수
 * 🆕 반복 검증 루프: 수정 → 검증 → 다시 수정 (최대 3회)
 */
export async function optimizeIncrementally(
  content: string,
  keyword: string,
  customMorphemes?: string
): Promise<IncrementalOptimizationResult> {
  
  console.log('📊 부분 최적화 시작: 조건 미달 부분만 정밀 수정 (반복 검증 방식)');
  
  const MAX_ITERATIONS = 3; // 최대 반복 횟수
  let optimizedContent = content;
  const allFixed: string[] = [];
  let iteration = 0;
  
  while (iteration < MAX_ITERATIONS) {
    iteration++;
    console.log(`\n🔄 === 최적화 시도 ${iteration}/${MAX_ITERATIONS} ===`);
    
    // 1단계: 현재 상태 분석
    const analysis = await analyzeMorphemes(optimizedContent, keyword, customMorphemes);
    const issues: OptimizationIssue[] = [];
    
    console.log('현재 상태:', {
      글자수: analysis.characterCount,
      키워드빈도: analysis.keywordMorphemeCount,
      최적화여부: analysis.isOptimized
    });
    
    // 2단계: 문제점 파악 (모든 조건 체크)
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
    
    // 키워드 빈도 체크 (5회 이상이면 통과)
    if (analysis.keywordMorphemeCount < 5) {
      const deficit = 5 - analysis.keywordMorphemeCount;
      issues.push({
        type: 'keyword_count',
        description: `키워드 "${keyword}" ${deficit}회 부족`,
        target: 5,
        current: analysis.keywordMorphemeCount
      });
      console.log(`❌ 키워드 부족: ${analysis.keywordMorphemeCount}회 (${deficit}회 부족)`);
    } else {
      console.log(`✅ 키워드 빈도 적정: ${analysis.keywordMorphemeCount}회 (5회 이상)`);
    }
    
    // 과다 사용 단어 체크
    const overusedWords = analysis.issues
      .filter(issue => issue.includes('초과') || issue.includes('과다'))
      .slice(0, 3);
    
    if (overusedWords.length > 0) {
      console.log(`❌ 과다 사용 단어 발견: ${overusedWords.length}개`);
      overusedWords.forEach(issue => {
        const match = issue.match(/"([^"]+)"/);
        const word = match ? match[1] : issue.split(' ')[0];
        issues.push({
          type: 'overused_word',
          description: issue,
          target: 14,
          current: 15,
          word
        });
      });
    } else {
      console.log(`✅ 과다 사용 단어 없음`);
    }
    
    // 키워드 우위성 체크
    const dominanceIssues = analysis.issues.filter(issue => issue.includes('키워드 우위성 미달'));
    if (dominanceIssues.length > 0) {
      console.log(`❌ 키워드 우위성 미달: ${dominanceIssues.length}개 일반 단어가 키워드보다 빈번함`);
      
      const dominantWords: Array<{word: string, count: number}> = [];
      dominanceIssues.forEach(issue => {
        const match = issue.match(/"([^"]+)"\s+(\d+)회/);
        if (match) {
          dominantWords.push({ word: match[1], count: parseInt(match[2]) });
        }
      });
      
      issues.push({
        type: 'keyword_dominance',
        description: `키워드보다 빈번한 일반 단어: ${dominantWords.map(w => `"${w.word}"(${w.count}회)`).join(', ')}`,
        target: 0,
        current: dominantWords.length,
        dominantWords
      });
    } else {
      console.log(`✅ 키워드 우위성 확보`);
    }
    
    // 3단계: 문제가 없으면 성공 반환
    if (issues.length === 0) {
      console.log(`\n✅ 모든 조건 충족! (${iteration}회 시도 후 성공)`);
      return {
        content: optimizedContent,
        success: true,
        issues: [],
        fixed: allFixed
      };
    }
    
    console.log(`\n🔧 ${issues.length}개 문제 발견, 수정 시작...`);
    
    // 4단계: 문제 수정
    try {
      if (issues.length === 1) {
        // 문제가 1개면 개별 수정
        const issue = issues[0];
        optimizedContent = await fixSingleIssue(optimizedContent, issue, keyword);
        allFixed.push(`[시도${iteration}] ${issue.description}`);
      } else {
        // 문제가 2개 이상이면 통합 수정
        optimizedContent = await fixAllIssuesAtOnce(optimizedContent, issues, keyword);
        issues.forEach(i => allFixed.push(`[시도${iteration}] ${i.description}`));
      }
    } catch (error) {
      console.error(`수정 중 오류 발생:`, error);
      // 오류 발생해도 다음 반복 시도
    }
  }
  
  // 최대 반복 후에도 완료 못 했을 경우 최종 상태 반환
  console.log(`\n⚠️ 최대 ${MAX_ITERATIONS}회 시도 후에도 일부 조건 미달`);
  
  const finalAnalysis = await analyzeMorphemes(optimizedContent, keyword, customMorphemes);
  const isSuccess = finalAnalysis.isOptimized;
  
  console.log(`최종 상태: 글자수 ${finalAnalysis.characterCount}자, 키워드 ${finalAnalysis.keywordMorphemeCount}회, 최적화 ${isSuccess ? '완료' : '미완료'}`);
  
  return {
    content: optimizedContent,
    success: isSuccess,
    issues: [],
    fixed: allFixed
  };
}

/**
 * 🆕 단일 문제 수정 헬퍼 함수
 */
async function fixSingleIssue(
  content: string,
  issue: OptimizationIssue,
  keyword: string
): Promise<string> {
  if (issue.type === 'character_count') {
    return await fixCharacterCount(content, issue, keyword);
  } else if (issue.type === 'keyword_count') {
    return await fixKeywordCount(content, issue, keyword);
  } else if (issue.type === 'overused_word' && issue.word) {
    return await fixOverusedWord(content, issue.word);
  } else if (issue.type === 'keyword_dominance' && issue.dominantWords) {
    return await fixKeywordDominance(content, issue.dominantWords, keyword);
  }
  return content;
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
      // 키워드는 5회 미만일 때만 문제로 처리
      if (issue.current < issue.target) {
        const diff = issue.target - issue.current;
        problems.push(`키워드 "${keyword}" ${diff}회 부족 (현재 ${issue.current}회)`);
        solutions.push(`"${keyword}" ${diff}회 자연스럽게 추가`);
      }
      // 5회 이상이면 과다 처리 안 함
    } else if (issue.type === 'overused_word' && issue.word) {
      problems.push(`"${issue.word}" 과다 사용`);
      solutions.push(`"${issue.word}"를 5-7회 동의어로 치환`);
    } else if (issue.type === 'keyword_dominance' && issue.dominantWords) {
      // 🆕 키워드 우위성 문제 처리
      const wordsStr = issue.dominantWords.slice(0, 3).map(w => `"${w.word}"(${w.count}회)`).join(', ');
      problems.push(`키워드 우위성 미달: ${wordsStr} 등이 키워드보다 빈번함`);
      solutions.push(`위 단어들을 동의어로 치환하여 각 10회 이하로 줄이고, 키워드 "${keyword}"가 가장 빈번하게 유지`);
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
  
  // 5회 이상이면 이 함수가 호출되지 않음 (추가만 수행)
  const amount = issue.target - issue.current;
  
  const prompt = `다음 블로그 글에 키워드 "${keyword}"를 ${amount}회 더 추가하는 작업을 수행하세요.

[원본 글]
${content}

[작업 지침]
1. 키워드 "${keyword}"를 정확히 ${amount}회만 추가하세요 (${amount}회 초과 금지)
2. 추가 위치 예시:
   - 서론: "이번에는 ${keyword}에 대해..."
   - 본론: "${keyword}의 경우에는...", "${keyword}를 선택할 때..."
   - 결론: "${keyword}에 대한 올바른 이해..."
3. 기존 문장을 자연스럽게 수정하여 키워드를 포함하세요
4. 억지로 끼워넣지 말고 문맥에 맞게 추가하세요
5. 전체 글의 흐름과 길이는 최대한 유지하세요
6. ⚠️ 중요: 정확히 ${amount}회만 추가하고, 추가한 위치를 마음속으로 세어가며 작업하세요

[검증]
작업 완료 후 키워드 "${keyword}"가 정확히 ${amount}회 추가되었는지 확인하세요.

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

/**
 * 🆕 키워드 우위성 확보: 키워드보다 빈번한 일반 단어들의 빈도를 낮춤
 */
async function fixKeywordDominance(
  content: string,
  dominantWords: Array<{word: string, count: number}>,
  keyword: string
): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_ENV_VAR || '' 
  });
  
  const wordsToReduce = dominantWords.slice(0, 5).map(w => `"${w.word}"(현재 ${w.count}회 → 10회 이하로)`).join('\n   - ');
  
  const prompt = `다음 블로그 글에서 특정 단어들의 빈도를 줄여서 키워드 "${keyword}"가 가장 빈번하게 사용되도록 수정하세요.

[원본 글]
${content}

[문제점]
키워드 "${keyword}"보다 다음 일반 단어들이 더 많이 사용되어 SEO 키워드 우위성이 확보되지 않았습니다.

[빈도를 낮춰야 할 단어들]
   - ${wordsToReduce}

[작업 지침]
1. 위 단어들 중 일부를 동의어나 다른 표현으로 치환하여 빈도를 낮추세요
2. 키워드 "${keyword}"는 현재 빈도를 유지하거나 살짝 늘려주세요
3. 글의 자연스러운 흐름과 의미는 반드시 유지하세요
4. 소제목은 그대로 유지하세요
5. 각 단어를 10회 이하로 줄이는 것이 목표입니다

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
  
  console.log(`  ✓ 키워드 우위성 확보 완료: ${dominantWords.length}개 단어 빈도 조정`);
  
  return optimized;
}
