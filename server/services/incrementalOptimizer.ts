import { analyzeMorphemes } from './morphemeAnalyzer';
import Anthropic from '@anthropic-ai/sdk';

// Claude API 클라이언트 (Gemini 대신 사용)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY_ENV_VAR || "default_key",
});
const MODEL = 'claude-sonnet-4-5-20250929';

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
 * 🆕 3회 시도 후 가장 좋은 결과 반환 (문제가 가장 적은 버전)
 */
export async function optimizeIncrementally(
  content: string,
  keyword: string,
  customMorphemes?: string
): Promise<IncrementalOptimizationResult> {
  
  console.log('📊 부분 최적화 시작 (최대 3회 시도, 최선 결과 반환)');
  
  const MAX_ATTEMPTS = 3;
  
  // 각 시도의 결과를 저장
  interface AttemptResult {
    content: string;
    issueCount: number;
    analysis: any;
  }
  const attempts: AttemptResult[] = [];
  
  let currentContent = content;
  
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`\n🔄 시도 ${attempt}/${MAX_ATTEMPTS}`);
    
    // 현재 상태 분석
    const analysis = await analyzeMorphemes(currentContent, keyword, customMorphemes);
    
    // 문제 개수 계산
    let issueCount = 0;
    if (analysis.characterCount < 1700 || analysis.characterCount > 2000) issueCount++;
    if (analysis.keywordMorphemeCount < 5) issueCount++;
    const overuseCount = analysis.issues.filter((i: string) => i.includes('초과') || i.includes('과다')).length;
    issueCount += overuseCount;
    
    console.log(`  상태: 글자수 ${analysis.characterCount}자, 키워드 ${analysis.keywordMorphemeCount}회, 문제 ${issueCount}개`);
    
    // 결과 저장
    attempts.push({
      content: currentContent,
      issueCount,
      analysis
    });
    
    // 완벽하면 바로 반환
    if (issueCount === 0) {
      console.log('✅ 모든 조건 충족!');
      return {
        content: currentContent,
        success: true,
        issues: [],
        fixed: [`${attempt}회 시도 후 최적화 완료`]
      };
    }
    
    // 마지막 시도가 아니면 수정 시도
    if (attempt < MAX_ATTEMPTS) {
      try {
        const issues: OptimizationIssue[] = [];
        
        if (analysis.characterCount < 1700) {
          issues.push({ type: 'character_count', description: '글자수 부족', target: 1700, current: analysis.characterCount });
        } else if (analysis.characterCount > 2000) {
          issues.push({ type: 'character_count', description: '글자수 초과', target: 2000, current: analysis.characterCount });
        }
        
        if (analysis.keywordMorphemeCount < 5) {
          issues.push({ type: 'keyword_count', description: '키워드 부족', target: 5, current: analysis.keywordMorphemeCount });
        }
        
        if (issues.length > 0) {
          currentContent = await fixAllIssuesAtOnce(currentContent, issues, keyword);
        }
      } catch (error) {
        console.error('수정 오류:', error);
      }
    }
  }
  
  // 🆕 가장 좋은 결과 선택 (문제가 가장 적은 버전)
  const bestAttempt = attempts.reduce((best, current) => 
    current.issueCount < best.issueCount ? current : best
  );
  
  console.log(`\n📤 최선 결과 반환: 문제 ${bestAttempt.issueCount}개`);
  
  return {
    content: bestAttempt.content,
    success: bestAttempt.issueCount === 0,
    issues: [],
    fixed: [`3회 시도 중 최선 결과 (문제 ${bestAttempt.issueCount}개)`]
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
 * 🆕 모든 문제를 한번에 해결하는 통합 수정 함수 (Claude 사용)
 */
async function fixAllIssuesAtOnce(
  content: string,
  issues: OptimizationIssue[],
  keyword: string
): Promise<string> {
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
      if (issue.current < issue.target) {
        const diff = issue.target - issue.current;
        problems.push(`키워드 "${keyword}" ${diff}회 부족 (현재 ${issue.current}회)`);
        solutions.push(`"${keyword}" ${diff}회 자연스럽게 추가`);
      }
    } else if (issue.type === 'overused_word' && issue.word) {
      problems.push(`"${issue.word}" 과다 사용`);
      solutions.push(`"${issue.word}"를 동의어로 5-7회 치환`);
    } else if (issue.type === 'keyword_dominance' && issue.dominantWords) {
      const wordsStr = issue.dominantWords.slice(0, 3).map(w => `"${w.word}"(${w.count}회)`).join(', ');
      problems.push(`키워드 우위성 미달: ${wordsStr} 등이 키워드보다 빈번함`);
      solutions.push(`위 단어들을 동의어로 치환하여 각 10회 이하로 줄임`);
    }
  });

  const prompt = `다음 블로그 글을 수정하세요.

[원본 글]
${content}

[문제점]
${problems.map((p, i) => `${i+1}. ${p}`).join('\n')}

[해결 방법]
${solutions.map((s, i) => `${i+1}. ${s}`).join('\n')}

[규칙]
1. 위 문제들을 모두 해결하되, 다른 조건이 깨지지 않도록 주의
2. 기존 글의 흐름과 소제목 유지
3. 수정된 블로그 본문만 출력 (설명 없이)`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });
    
    const messageContent = response.content[0];
    if (messageContent.type !== 'text') {
      return content;
    }
    
    console.log(`  ✓ Claude 통합 수정 완료: ${issues.length}개 문제`);
    return messageContent.text.trim();
  } catch (error) {
    console.error('Claude API 오류:', error);
    return content;
  }
}

/**
 * 글자수 조정 (Claude 사용)
 */
async function fixCharacterCount(
  content: string,
  issue: OptimizationIssue,
  keyword: string
): Promise<string> {
  const isDeficit = issue.current < issue.target;
  const amount = Math.abs(issue.target - issue.current);
  
  const prompt = isDeficit 
    ? `블로그 글을 ${amount}자 정도 확장하세요. 키워드 "${keyword}" 유지. 본문만 출력.\n\n${content}`
    : `블로그 글을 ${amount}자 정도 축소하세요. 키워드 "${keyword}" 유지. 본문만 출력.\n\n${content}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });
    
    const messageContent = response.content[0];
    if (messageContent.type !== 'text') return content;
    
    const optimized = messageContent.text.trim();
    console.log(`  ✓ 글자수 조정: ${issue.current}자 → ${optimized.replace(/\s/g, '').length}자`);
    return optimized;
  } catch (error) {
    console.error('Claude API 오류:', error);
    return content;
  }
}

/**
 * 키워드 빈도 조정 (Claude 사용)
 */
async function fixKeywordCount(
  content: string,
  issue: OptimizationIssue,
  keyword: string
): Promise<string> {
  const amount = issue.target - issue.current;
  
  const prompt = `블로그 글에 키워드 "${keyword}"를 ${amount}회만 자연스럽게 추가하세요. 다른 조건 유지. 본문만 출력.\n\n${content}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });
    
    const messageContent = response.content[0];
    if (messageContent.type !== 'text') return content;
    
    console.log(`  ✓ 키워드 추가: ${issue.current}회 → 목표 ${issue.target}회`);
    return messageContent.text.trim();
  } catch (error) {
    console.error('Claude API 오류:', error);
    return content;
  }
}

/**
 * 과다 사용 단어를 동의어로 치환 (Claude 사용)
 */
async function fixOverusedWord(
  content: string,
  word: string
): Promise<string> {
  const prompt = `블로그 글에서 "${word}"를 5-7회 동의어로 치환하세요. 흐름 유지. 본문만 출력.\n\n${content}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });
    
    const messageContent = response.content[0];
    if (messageContent.type !== 'text') return content;
    
    console.log(`  ✓ 과다 단어 치환: "${word}"`);
    return messageContent.text.trim();
  } catch (error) {
    console.error('Claude API 오류:', error);
    return content;
  }
}

/**
 * 키워드 우위성 확보 (Claude 사용)
 */
async function fixKeywordDominance(
  content: string,
  dominantWords: Array<{word: string, count: number}>,
  keyword: string
): Promise<string> {
  const wordsStr = dominantWords.slice(0, 3).map(w => `"${w.word}"(${w.count}회)`).join(', ');
  
  const prompt = `블로그 글에서 ${wordsStr} 단어들을 동의어로 치환하여 빈도를 10회 이하로 줄이세요. 키워드 "${keyword}"는 유지. 본문만 출력.\n\n${content}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });
    
    const messageContent = response.content[0];
    if (messageContent.type !== 'text') return content;
    
    console.log(`  ✓ 키워드 우위성 확보: ${dominantWords.length}개 단어 조정`);
    return messageContent.text.trim();
  } catch (error) {
    console.error('Claude API 오류:', error);
    return content;
  }
}
