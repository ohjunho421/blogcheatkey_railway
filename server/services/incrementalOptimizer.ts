import { analyzeMorphemes } from './morphemeAnalyzer';

interface OptimizationIssue {
  type: 'character_count' | 'keyword_count' | 'overused_word' | 'structure';
  description: string;
  target: number;
  current: number;
  word?: string;
  structureType?: 'intro_ratio' | 'conclusion_cta' | 'intro_empathy';
}

interface IncrementalOptimizationResult {
  content: string;
  success: boolean;
  issues: OptimizationIssue[];
  fixed: string[];
}

// 🆕 현재 상태 스냅샷 (롤백용)
interface ContentSnapshot {
  content: string;
  characterCount: number;
  keywordCount: number;
  overusedCount: number;
  score: number; // 종합 점수 (높을수록 좋음)
}

// 🆕 조건 충족 점수 계산 (0-100)
function calculateOptimizationScore(
  characterCount: number,
  keywordCount: number,
  overusedWords: number
): number {
  let score = 0;
  
  // 글자수 점수 (40점)
  if (characterCount >= 1700 && characterCount <= 2000) {
    score += 40;
  } else if (characterCount >= 1600 && characterCount <= 2100) {
    score += 30; // 근접
  } else if (characterCount >= 1500 && characterCount <= 2200) {
    score += 20;
  }
  
  // 키워드 빈도 점수 (40점)
  if (keywordCount >= 5 && keywordCount <= 7) {
    score += 40;
  } else if (keywordCount >= 4 && keywordCount <= 8) {
    score += 30;
  } else if (keywordCount >= 3) {
    score += 20;
  }
  
  // 과다 사용 단어 점수 (20점)
  if (overusedWords === 0) {
    score += 20;
  } else if (overusedWords <= 2) {
    score += 10;
  }
  
  return score;
}

// 🆕 스냅샷 생성
async function createSnapshot(content: string, keyword: string, customMorphemes?: string): Promise<ContentSnapshot> {
  const analysis = await analyzeMorphemes(content, keyword, customMorphemes);
  const overusedCount = analysis.issues.filter(i => i.includes('과다') || i.includes('초과')).length;
  
  return {
    content,
    characterCount: analysis.characterCount,
    keywordCount: analysis.keywordMorphemeCount,
    overusedCount,
    score: calculateOptimizationScore(analysis.characterCount, analysis.keywordMorphemeCount, overusedCount)
  };
}

// 🆕 설득력있는 글쓰기 구조 분석
interface StructureAnalysis {
  intro: { text: string; charCount: number; ratio: number };
  body: { text: string; charCount: number };
  conclusion: { text: string; charCount: number; hasCTA: boolean };
  hasEmpathy: boolean; // 서론에 독자 공감 요소
  issues: string[];
}

function analyzePersuasiveStructure(content: string): StructureAnalysis {
  const totalCharCount = content.replace(/\s/g, '').length;
  const lines = content.split('\n');
  
  // 소제목 패턴으로 구조 파악
  const subtitlePattern = /^#+\s|^\d+\.|^[■●◆▶★☆※]/;
  
  let introEnd = -1;
  let conclusionStart = -1;
  
  // 첫 번째 소제목 찾기 (서론 끝)
  for (let i = 0; i < lines.length; i++) {
    if (subtitlePattern.test(lines[i].trim())) {
      introEnd = i;
      break;
    }
  }
  
  // 마지막 소제목 찾기 (결론 시작)
  for (let i = lines.length - 1; i >= 0; i--) {
    if (subtitlePattern.test(lines[i].trim())) {
      conclusionStart = i;
      break;
    }
  }
  
  // 구조 분리
  let introText = '';
  let bodyText = '';
  let conclusionText = '';
  
  if (introEnd > 0) {
    introText = lines.slice(0, introEnd).join('\n');
  } else {
    // 소제목이 없으면 첫 30%를 서론으로
    const introLines = Math.floor(lines.length * 0.3);
    introText = lines.slice(0, introLines).join('\n');
    introEnd = introLines;
  }
  
  if (conclusionStart > introEnd) {
    bodyText = lines.slice(introEnd, conclusionStart).join('\n');
    conclusionText = lines.slice(conclusionStart).join('\n');
  } else {
    // 결론 구분이 안되면 마지막 15%를 결론으로
    const conclusionLines = Math.floor(lines.length * 0.15);
    conclusionStart = lines.length - conclusionLines;
    bodyText = lines.slice(introEnd, conclusionStart).join('\n');
    conclusionText = lines.slice(conclusionStart).join('\n');
  }
  
  const introCharCount = introText.replace(/\s/g, '').length;
  const bodyCharCount = bodyText.replace(/\s/g, '').length;
  const conclusionCharCount = conclusionText.replace(/\s/g, '').length;
  const introRatio = totalCharCount > 0 ? (introCharCount / totalCharCount) * 100 : 0;
  
  // 독자 공감 요소 체크 (서론에 있어야 함)
  const empathyPatterns = [
    /많은\s*(분들이|사람들이|운전자들이)/,
    /혹시.*\?/,
    /궁금하/,
    /고민이/,
    /걱정이/,
    /어려움을/,
    /경험이\s*있으신가요/,
    /해보신\s*적/,
    /느끼신\s*적/,
    /알고\s*계신가요/
  ];
  const hasEmpathy = empathyPatterns.some(p => p.test(introText));
  
  // CTA(Call To Action) 체크 (결론에 있어야 함)
  const ctaPatterns = [
    /문의/,
    /연락/,
    /방문/,
    /상담/,
    /확인해\s*보세요/,
    /추천드립니다/,
    /참고하시기\s*바랍니다/,
    /도움이\s*되셨/,
    /알아보세요/
  ];
  const hasCTA = ctaPatterns.some(p => p.test(conclusionText));
  
  // 문제점 파악
  const issues: string[] = [];
  
  // 서론 비율 체크 (35-40% 권장)
  if (introRatio < 30) {
    issues.push(`서론 비율 부족: ${introRatio.toFixed(1)}% (35-40% 권장)`);
  } else if (introRatio > 45) {
    issues.push(`서론 비율 초과: ${introRatio.toFixed(1)}% (35-40% 권장)`);
  }
  
  // 독자 공감 체크
  if (!hasEmpathy) {
    issues.push('서론에 독자 공감 요소 부족');
  }
  
  // CTA 체크
  if (!hasCTA) {
    issues.push('결론에 CTA(행동 유도) 요소 부족');
  }
  
  return {
    intro: { text: introText, charCount: introCharCount, ratio: introRatio },
    body: { text: bodyText, charCount: bodyCharCount },
    conclusion: { text: conclusionText, charCount: conclusionCharCount, hasCTA },
    hasEmpathy,
    issues
  };
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
  
  console.log('📊 부분 최적화 시작: 조건 미달 부분만 정밀 수정 (롤백 지원)');
  
  // 🆕 0단계: 초기 스냅샷 저장 (롤백용)
  const initialSnapshot = await createSnapshot(content, keyword, customMorphemes);
  console.log(`📸 초기 상태 스냅샷: 점수 ${initialSnapshot.score}/100`);
  
  // 1단계: 현재 상태 분석
  const analysis = await analyzeMorphemes(content, keyword, customMorphemes);
  const issues: OptimizationIssue[] = [];
  const fixed: string[] = [];
  
  let optimizedContent = content;
  let bestSnapshot = initialSnapshot; // 🆕 최고 점수 스냅샷 추적
  
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
  
  // 키워드 빈도 체크 (5회 이상이면 통과)
  if (analysis.keywordMorphemeCount < 5) {
    const deficit = 5 - analysis.keywordMorphemeCount;
    issues.push({
      type: 'keyword_count',
      description: `키워드 "${keyword}" ${deficit}회 부족`,
      target: 5, // 최소값
      current: analysis.keywordMorphemeCount
    });
    console.log(`❌ 키워드 부족: ${analysis.keywordMorphemeCount}회 (${deficit}회 부족)`);
  } else {
    console.log(`✅ 키워드 빈도 적정: ${analysis.keywordMorphemeCount}회 (5회 이상)`);
  }
  // 5회 이상이면 과다 체크 안 함
  
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
  
  // 🆕 키워드 형태소 빈도 체크 (15-18회 엄격)
  const keywordDominanceIssues = analysis.issues
    .filter(issue => issue.includes('형태소 출현 횟수'));

  if (keywordDominanceIssues.length > 0) {
    console.log(`❌ 키워드 형태소 빈도 문제: ${keywordDominanceIssues.length}개`);
    keywordDominanceIssues.forEach(issue => {
      // "형태소 출현 횟수 불균형: 냉각: 12회 (부족, 15-18회 권장)" 형태에서 파싱
      const match = issue.match(/([가-힣a-zA-Z0-9]+):\s*(\d+)회/);
      if (match) {
        const morpheme = match[1];
        const count = parseInt(match[2]);
        const target = count < 15 ? 16 : 16; // 목표는 항상 16회
        issues.push({
          type: 'keyword_count',
          description: `키워드 형태소 "${morpheme}" ${issue.includes('부족') ? '부족' : '초과'} (현재 ${count}회 → 목표 15-18회)`,
          target: target,
          current: count,
          word: morpheme
        });
      }
    });
  }
  
  // 🆕 설득력있는 글쓰기 구조 체크
  const structureAnalysis = analyzePersuasiveStructure(content);
  console.log(`📝 설득력 구조 분석: 서론 ${structureAnalysis.intro.ratio.toFixed(1)}%, 공감 ${structureAnalysis.hasEmpathy ? '✅' : '❌'}, CTA ${structureAnalysis.conclusion.hasCTA ? '✅' : '❌'}`);
  
  if (structureAnalysis.issues.length > 0) {
    console.log(`❌ 설득력 구조 문제: ${structureAnalysis.issues.length}개`);
    structureAnalysis.issues.forEach(issue => {
      if (issue.includes('서론 비율')) {
        issues.push({
          type: 'structure',
          description: issue,
          target: 37, // 35-40%의 중간값
          current: Math.round(structureAnalysis.intro.ratio),
          structureType: 'intro_ratio'
        });
      } else if (issue.includes('독자 공감')) {
        issues.push({
          type: 'structure',
          description: issue,
          target: 1,
          current: 0,
          structureType: 'intro_empathy'
        });
      } else if (issue.includes('CTA')) {
        issues.push({
          type: 'structure',
          description: issue,
          target: 1,
          current: 0,
          structureType: 'conclusion_cta'
        });
      }
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
      // 🔍 디버깅: 수정 전 상태
      const beforeCharCount = optimizedContent.replace(/\s/g, '').length;
      const beforeKeywordCount = (optimizedContent.match(new RegExp(keyword, 'g')) || []).length;
      console.log(`\n📝 [수정 전] 글자수: ${beforeCharCount}자, 키워드 "${keyword}": ${beforeKeywordCount}회`);
      
      if (issue.type === 'character_count') {
        optimizedContent = await fixCharacterCount(optimizedContent, issue, keyword);
        fixed.push(issue.description);
      } else if (issue.type === 'keyword_count') {
        optimizedContent = await fixKeywordCount(optimizedContent, issue, keyword);
        fixed.push(issue.description);
      } else if (issue.type === 'overused_word' && issue.word) {
        optimizedContent = await fixOverusedWord(optimizedContent, issue.word, keyword);
        fixed.push(issue.description);
      } else if (issue.type === 'structure') {
        optimizedContent = await fixStructure(optimizedContent, issue, keyword);
        fixed.push(issue.description);
      }
      
      // 🔍 디버깅: 수정 후 상태
      const afterCharCount = optimizedContent.replace(/\s/g, '').length;
      const afterKeywordCount = (optimizedContent.match(new RegExp(keyword, 'g')) || []).length;
      console.log(`📝 [수정 후] 글자수: ${afterCharCount}자, 키워드 "${keyword}": ${afterKeywordCount}회`);
      console.log(`📊 [변화량] 글자수: ${afterCharCount - beforeCharCount > 0 ? '+' : ''}${afterCharCount - beforeCharCount}자, 키워드: ${afterKeywordCount - beforeKeywordCount > 0 ? '+' : ''}${afterKeywordCount - beforeKeywordCount}회`);
    } catch (error) {
      console.error(`수정 실패 (${issue.description}):`, error);
    }
  } else if (issues.length > 1) {
    // 문제가 2개 이상이면 통합 수정 (최대 2회 미세조정)
    let attemptCount = 0;
    const maxMicroAdjustments = 2; // 미세조정 최대 2회
    
    try {
      // 🔍 디버깅: 수정 전 상태
      const beforeCharCount = optimizedContent.replace(/\s/g, '').length;
      const beforeKeywordCount = (optimizedContent.match(new RegExp(keyword, 'g')) || []).length;
      console.log(`\n📝 [통합수정 전] 글자수: ${beforeCharCount}자, 키워드 "${keyword}": ${beforeKeywordCount}회`);
      
      // 1차 통합 수정
      optimizedContent = await fixAllIssuesAtOnce(optimizedContent, issues, keyword);
      fixed.push(...issues.map(i => i.description));
      
      // 🔍 디버깅: 수정 후 상태
      const afterCharCount = optimizedContent.replace(/\s/g, '').length;
      const afterKeywordCount = (optimizedContent.match(new RegExp(keyword, 'g')) || []).length;
      console.log(`📝 [통합수정 후] 글자수: ${afterCharCount}자, 키워드 "${keyword}": ${afterKeywordCount}회`);
      console.log(`📊 [변화량] 글자수: ${afterCharCount - beforeCharCount > 0 ? '+' : ''}${afterCharCount - beforeCharCount}자, 키워드: ${afterKeywordCount - beforeKeywordCount > 0 ? '+' : ''}${afterKeywordCount - beforeKeywordCount}회`);
      
      if (optimizedContent === content) {
        console.log(`⚠️ [경고] Gemini가 내용을 변경하지 않음!`);
      }
      
      // 미세조정: 키워드 빈도만 재확인하고 1-2회 조정 (5회 미만일 때만)
      while (attemptCount < maxMicroAdjustments) {
        const quickCheck = await analyzeMorphemes(optimizedContent, keyword, customMorphemes);
        const currentKeywordCount = quickCheck.keywordMorphemeCount;
        
        if (currentKeywordCount >= 5) {
          console.log(`✓ 미세조정 불필요: 키워드 ${currentKeywordCount}회 (5회 이상)`);
          break;
        }
        
        // 1-2회만 부족하면 미세조정
        const diff = 5 - currentKeywordCount;
        if (diff <= 2) {
          console.log(`🔧 미세조정 시도 ${attemptCount + 1}: 키워드 ${diff}회 추가 필요`);
          const microIssue: OptimizationIssue = {
            type: 'keyword_count',
            description: `키워드 미세조정 ${diff}회`,
            target: 5,
            current: currentKeywordCount
          };
          optimizedContent = await fixKeywordCount(optimizedContent, microIssue, keyword);
          attemptCount++;
        } else {
          console.log(`⚠️ 차이가 커서 미세조정 스킵 (${diff}회 부족)`);
          break;
        }
      }
      
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
            optimizedContent = await fixOverusedWord(optimizedContent, issue.word, keyword);
            fixed.push(issue.description);
          } else if (issue.type === 'structure') {
            optimizedContent = await fixStructure(optimizedContent, issue, keyword);
            fixed.push(issue.description);
          }
        } catch (error) {
          console.error(`수정 실패 (${issue.description}):`, error);
        }
      }
    }
  }
  
  // 5단계: 최종 검증 + 롤백 판단 (과다사용 문제까지 확인)
  const finalAnalysis = await analyzeMorphemes(optimizedContent, keyword, customMorphemes);
  
  const hasNoOveruse = !finalAnalysis.issues.some(issue => 
    issue.includes('초과') || issue.includes('과다')
  );
  
  const isSuccess = 
    finalAnalysis.characterCount >= 1700 && 
    finalAnalysis.characterCount <= 2000 &&
    finalAnalysis.keywordMorphemeCount >= 5 &&
    hasNoOveruse; // 과다사용 문제도 확인
  
  // 🆕 롤백 판단: 수정 후 점수가 크게 낮아졌으면 원본 사용 (10점 이상 하락 시에만)
  const finalSnapshot = await createSnapshot(optimizedContent, keyword, customMorphemes);
  
  const scoreDrop = bestSnapshot.score - finalSnapshot.score;
  if (scoreDrop > 10) {
    console.log(`⚠️ 롤백 실행: 수정 후 점수(${finalSnapshot.score}) << 원본 점수(${bestSnapshot.score}) - ${scoreDrop}점 하락`);
    console.log(`   → 원본 콘텐츠로 복원합니다.`);
    
    return {
      content: bestSnapshot.content,
      success: bestSnapshot.score >= 80,
      issues,
      fixed: []
    };
  }
  
  // 점수가 약간 낮아지거나 같아도 수정된 콘텐츠 사용 (AI가 다른 부분을 개선했을 수 있음)
  if (scoreDrop > 0 && scoreDrop <= 10) {
    console.log(`⚠️ 점수 소폭 하락 (${scoreDrop}점), 수정된 콘텐츠 유지`);
  }
  
  console.log(`${isSuccess ? '✅' : '⚠️'} 부분 최적화 완료: ${fixed.length}개 수정`);
  console.log(`  최종 검증: 글자수 ${finalAnalysis.characterCount}자, 키워드 ${finalAnalysis.keywordMorphemeCount}회, 과다사용 ${hasNoOveruse ? '없음' : '있음'}`);
  console.log(`  점수 변화: ${initialSnapshot.score} → ${finalSnapshot.score} (${finalSnapshot.score - initialSnapshot.score > 0 ? '+' : ''}${finalSnapshot.score - initialSnapshot.score})`);
  
  return {
    content: optimizedContent,
    success: isSuccess,
    issues,
    fixed
  };
}

/**
 * 🆕 글 구조 분석 - 서론/본론/결론 위치 파악
 */
function analyzeContentStructure(content: string): {
  intro: { start: number; end: number; text: string };
  body: { start: number; end: number; text: string };
  conclusion: { start: number; end: number; text: string };
  subtitles: string[];
} {
  const lines = content.split('\n');
  let introEnd = 0;
  let conclusionStart = content.length;
  const subtitles: string[] = [];
  
  // 소제목 패턴 찾기 (## 또는 숫자. 또는 ● 등)
  const subtitlePattern = /^(#{1,3}\s|[0-9]+\.\s|●\s|■\s|▶\s|[①-⑩]\s)/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (subtitlePattern.test(line)) {
      subtitles.push(line);
      if (introEnd === 0 && i > 2) {
        // 첫 소제목 전까지가 서론
        introEnd = content.indexOf(line);
      }
    }
    // 결론 키워드 찾기
    if (line.includes('마무리') || line.includes('결론') || line.includes('정리하면') || 
        line.includes('요약하면') || line.includes('마지막으로')) {
      conclusionStart = content.indexOf(line);
    }
  }
  
  // 기본값 설정 (소제목 없는 경우)
  if (introEnd === 0) introEnd = Math.floor(content.length * 0.3);
  if (conclusionStart === content.length) conclusionStart = Math.floor(content.length * 0.85);
  
  return {
    intro: { start: 0, end: introEnd, text: content.substring(0, introEnd) },
    body: { start: introEnd, end: conclusionStart, text: content.substring(introEnd, conclusionStart) },
    conclusion: { start: conclusionStart, end: content.length, text: content.substring(conclusionStart) },
    subtitles
  };
}

/**
 * 🆕 구체적인 수정 가이드 생성 - AI가 정확히 어디에 무엇을 어떻게 수정할지 안내
 */
function generateDetailedFixGuide(
  content: string,
  issues: OptimizationIssue[],
  keyword: string,
  structure: ReturnType<typeof analyzeContentStructure>
): string {
  const guides: string[] = [];
  
  for (const issue of issues) {
    if (issue.type === 'character_count') {
      const diff = Math.abs(issue.target - issue.current);
      
      if (issue.current < issue.target) {
        // 글자수 부족 - 구체적인 확장 위치와 방법 안내
        guides.push(`
📝 [글자수 ${diff}자 추가 방법]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 추가할 위치: 본론 (서론/결론은 건드리지 마세요!)

✅ 추가 방법 (택1):
   방법1) 기존 문장을 더 자세히 풀어쓰기
          예: "중요합니다" → "매우 중요한 부분이라 꼭 기억해두셔야 합니다"
   
   방법2) 구체적인 예시 추가
          예: "효과가 있습니다" → "효과가 있습니다. 예를 들어 A의 경우 B처럼 됩니다"
   
   방법3) 이유/원인 설명 추가
          예: "필요합니다" → "필요합니다. 왜냐하면 C 때문입니다"

⚠️ 절대 하지 말 것:
   - 새로운 소제목 추가 ❌
   - 키워드 "${keyword}" 빈도 변경 ❌ (현재 빈도 유지!)
   - 서론이나 결론 수정 ❌
`);
      } else {
        // 글자수 초과 - 구체적인 축소 위치와 방법 안내
        guides.push(`
📝 [글자수 ${diff}자 축소 방법]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 축소할 위치: 본론의 부연설명 부분

✅ 축소 방법:
   - 중복되는 설명 제거
   - "~라고 할 수 있습니다" → "~입니다" (간결하게)
   - 불필요한 접속사 제거 ("그리고", "또한" 등)

⚠️ 절대 하지 말 것:
   - 키워드 "${keyword}" 포함 문장 삭제 ❌
   - 소제목 삭제 ❌
   - 핵심 정보 삭제 ❌
`);
      }
    } else if (issue.type === 'keyword_count') {
      const diff = issue.target - issue.current;
      
      if (diff > 0) {
        // 키워드 부족 - 정확한 삽입 위치와 문장 패턴 제공
        guides.push(`
🔑 [키워드 "${keyword}" ${diff}회 추가 방법]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 추가할 위치와 문장 패턴:

${diff >= 1 ? `   1회차: 본론 첫 번째 단락에 추가
          패턴: "이러한 ${keyword}의 경우..." 또는 "${keyword}를 선택할 때..."` : ''}

${diff >= 2 ? `   2회차: 본론 중간 단락에 추가  
          패턴: "${keyword}의 장점은..." 또는 "좋은 ${keyword}란..."` : ''}

${diff >= 3 ? `   3회차: 결론 직전 단락에 추가
          패턴: "${keyword}에 대해 정리하면..." 또는 "올바른 ${keyword} 선택을 위해..."` : ''}

✅ 자연스러운 삽입 예시:
   - 기존: "이 제품은 효과가 좋습니다"
   - 수정: "이 ${keyword}는 효과가 좋습니다"

⚠️ 절대 하지 말 것:
   - 같은 문장에 키워드 2번 넣기 ❌
   - 어색한 위치에 억지로 넣기 ❌
   - 글자수 크게 변경 ❌ (±50자 이내 유지)
`);
      }
    } else if (issue.type === 'overused_word' && issue.word) {
      // 과다 사용 단어 - 동의어 목록과 치환 위치 안내
      const synonymMap: Record<string, string[]> = {
        '자동차': ['차량', '승용차', '이 차', '해당 차종'],
        '차량': ['자동차', '승용차', '이 차', '해당 모델'],
        '엔진': ['동력장치', '파워트레인', '심장부', '구동계'],
        '교체': ['변경', '갈아주기', '새로 장착', '바꾸기'],
        '점검': ['확인', '체크', '살펴보기', '검사'],
        '정비': ['관리', '수리', '손질', '케어'],
        '문제': ['이슈', '고장', '트러블', '증상'],
        '사용': ['활용', '이용', '쓰기', '적용'],
        '필요': ['중요', '필수', '요구', '권장'],
        '경우': ['상황', '케이스', '때', '시점'],
        '냉각': ['쿨링', '온도조절', '열관리', '냉각계통'],
        '부동액': ['쿨런트', '냉각수', '부동 성분', '동결방지액'],
      };
      
      const synonyms = synonymMap[issue.word] || ['동의어1', '동의어2', '다른 표현'];
      
      guides.push(`
🔄 ["${issue.word}" 과다 사용 해결 방법]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 치환할 동의어 목록:
   ${synonyms.map((s, i) => `${i+1}. "${s}"`).join('\n   ')}

✅ 치환 방법:
   - "${issue.word}"가 나오는 문장 중 5-7개를 위 동의어로 교체
   - 문맥에 맞는 동의어 선택 (어색하면 다른 동의어 사용)

✅ 치환 예시:
   - 기존: "${issue.word}을 확인하세요"
   - 수정: "${synonyms[0]}을 확인하세요"

⚠️ 절대 하지 말 것:
   - 키워드 "${keyword}" 포함 문장의 "${issue.word}" 치환 ❌
   - 소제목의 "${issue.word}" 치환 ❌
   - 의미가 달라지는 치환 ❌
`);
    }
  }
  
  return guides.join('\n');
}

/**
 * 🆕 모든 문제를 한번에 해결하는 통합 수정 함수 (구체적 가이드 포함)
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

  // 키워드 형태소 추출
  const { extractKeywordComponents } = await import('./morphemeAnalyzer');
  const keywordMorphemes = await extractKeywordComponents(keyword);

  // 글 구조 분석
  const structure = analyzeContentStructure(content);

  // 구체적인 수정 가이드 생성
  const detailedGuide = generateDetailedFixGuide(content, issues, keyword, structure);

  // 현재 상태 요약
  const currentCharCount = content.replace(/\s/g, '').length;
  const currentKeywordCount = (content.match(new RegExp(keyword, 'g')) || []).length;

  // 🆕 각 형태소 현재 빈도 계산
  const { extractKoreanMorphemes } = await import('./morphemeAnalyzer');
  const allMorphemes = extractKoreanMorphemes(content);
  const morphemeFrequency = new Map<string, number>();
  allMorphemes.forEach(m => {
    const lower = m.toLowerCase();
    morphemeFrequency.set(lower, (morphemeFrequency.get(lower) || 0) + 1);
  });

  const morphemeStatus = keywordMorphemes.map(m => {
    const count = morphemeFrequency.get(m.toLowerCase()) || 0;
    return `"${m}": ${count}회 (목표 15-18회)`;
  }).join('\n');

  const prompt = `당신은 SEO 전문 에디터입니다. 아래 블로그 글을 수정해주세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 현재 상태
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 글자수: ${currentCharCount}자 (목표: 1750-1950자 엄격, 2000자 초과 금지!)
- 완전 키워드 "${keyword}": ${currentKeywordCount}회 (목표: 5-7회)
- 서론: 약 ${structure.intro.text.length}자
- 본론: 약 ${structure.body.text.length}자
- 결론: 약 ${structure.conclusion.text.length}자

🚨 [가장 중요] 키워드 형태소 빈도 (각각 별도로!)
키워드 "${keyword}"는 다음 형태소로 구성:
${morphemeStatus}

⚠️ 주의: 각 형태소는 독립적으로 세어집니다!
- 예: "자동차"가 "자동차냉각수"에 포함되어도 별도로 1회 카운트
- 반드시 각 형태소를 15-18회 범위로 맞추세요!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 수정 가이드 (반드시 따라주세요!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${detailedGuide}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 핵심 규칙 (위반 시 실패!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 한 문제 해결할 때 다른 조건 깨뜨리지 않기
2. 소제목 구조 100% 유지
3. 글의 자연스러운 흐름 유지
4. 수정 후 반드시 조건 재확인:
   - 글자수 1750-1950자 범위인가? (2000자 초과 절대 금지!)
   - 완전 키워드 5-7회인가?
   - 각 형태소 15-18회인가? (가장 중요!)
   - 과다 사용 단어 없는가?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 원본 글
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✏️ 출력 규칙
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 수정된 블로그 글 본문만 출력
- 설명문, 메타정보 절대 포함 금지
- "수정된 글:", "다음과 같이" 등 서술 표현 금지`;

  try {
    console.log(`  🤖 Gemini API 호출 중... (통합 수정)`);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    });
    
    const optimized = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!optimized || optimized.length < 100) {
      console.log(`  ⚠️ Gemini 응답이 비정상적, 원본 유지`);
      return content;
    }
    
    console.log(`  ✓ 통합 수정 완료: ${issues.length}개 문제 (구체적 가이드 적용)`);
    return optimized;
  } catch (error) {
    console.error(`  ❌ Gemini API 오류:`, error);
    return content; // 오류 시 원본 반환
  }
}

/**
 * 글자수 조정 (부족하면 확장, 초과하면 축소) - 구체적 가이드 포함
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
  const currentKeywordCount = (content.match(new RegExp(keyword, 'g')) || []).length;
  
  const prompt = isDeficit
    ? `당신은 SEO 전문 에디터입니다. 글자수를 ${amount}자 추가해주세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 현재 상태 (반드시 유지해야 할 조건)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 현재 글자수: ${issue.current}자 → 목표: 1750-1950자 (절대 2000자 초과 금지!)
- 키워드 "${keyword}": 현재 ${currentKeywordCount}회 ⚠️ 이 횟수 그대로 유지!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 ${amount}자 추가 방법 (구체적 가이드)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 추가 위치: 본론 부분만! (서론/결론 건드리지 마세요)

✅ 추가 방법 예시:
   1. 짧은 문장을 풀어쓰기
      "중요합니다" → "정말 중요한 부분이니 꼭 기억해두시면 좋겠습니다"
      (+15자 정도)
   
   2. 구체적 예시 추가
      "효과가 있습니다" → "효과가 있습니다. 실제로 많은 분들이 이 방법으로 좋은 결과를 얻고 계십니다"
      (+30자 정도)
   
   3. 이유/원인 설명 추가
      "필요합니다" → "필요합니다. 그 이유는 시간이 지나면서 성능이 저하되기 때문입니다"
      (+25자 정도)

⚠️ 절대 하지 말 것:
   - 키워드 "${keyword}" 추가/삭제 ❌ (현재 ${currentKeywordCount}회 유지!)
   - 새로운 소제목 추가 ❌
   - 서론/결론 수정 ❌

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 원본 글
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✏️ 출력: 수정된 블로그 글 본문만 (설명문 금지)`
    : `당신은 SEO 전문 에디터입니다. 글자수를 ${amount}자 줄여주세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 현재 상태 (반드시 유지해야 할 조건)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 현재 글자수: ${issue.current}자 → 목표: ${issue.target}자 이하
- 키워드 "${keyword}": 현재 ${currentKeywordCount}회 ⚠️ 이 횟수 그대로 유지!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 ${amount}자 축소 방법 (구체적 가이드)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 축소 위치: 본론의 부연설명 부분

✅ 축소 방법 예시:
   1. 장황한 표현 간결하게
      "~라고 할 수 있습니다" → "~입니다" (-5자)
      "~하는 것이 좋습니다" → "~하세요" (-5자)
   
   2. 불필요한 접속사 제거
      "그리고 또한" → 삭제 (-4자)
      "따라서 그러므로" → "따라서" (-4자)
   
   3. 중복 설명 제거
      같은 내용 반복하는 문장 삭제

⚠️ 절대 하지 말 것:
   - 키워드 "${keyword}" 포함 문장 삭제 ❌
   - 소제목 삭제 ❌
   - 핵심 정보 삭제 ❌

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 원본 글
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✏️ 출력: 수정된 블로그 글 본문만 (설명문 금지)`;
  
  try {
    console.log(`  🤖 Gemini API 호출 중... (글자수 조정)`);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    });
    
    const optimized = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!optimized || optimized.length < 100) {
      console.log(`  ⚠️ Gemini 응답이 비정상적, 원본 유지`);
      return content;
    }
    
    console.log(`  ✓ 글자수 조정 완료: ${issue.current}자 → ${optimized.replace(/\s/g, '').length}자`);
    return optimized;
  } catch (error) {
    console.error(`  ❌ Gemini API 오류 (글자수 조정):`, error);
    return content;
  }
}

/**
 * 키워드/형태소 빈도 조정 - 글자수 변화 없이 치환 방식으로!
 * 핵심: 새 문장 추가가 아니라, 기존 단어를 키워드/형태소로 "치환"
 * 
 * issue.word가 있으면: 키워드 형태소 추가 (예: "냉각", "부동")
 * issue.word가 없으면: 완전한 키워드 추가 (예: "냉각수부동액")
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
  
  // 형태소 추가인지 완전한 키워드 추가인지 구분
  const targetWord = issue.word || keyword;
  const isMorpheme = !!issue.word;
  
  const amount = issue.target - issue.current;
  const currentCharCount = content.replace(/\s/g, '').length;
  const targetWordLength = targetWord.length;
  
  // 🆕 키워드로 치환 가능한 대상 찾기 (비슷한 글자수의 단어)
  // 예: "냉각수부동액"(6자) → "이 제품"(3자)을 치환하면 글자수 +3
  // 따라서 비슷한 길이의 단어를 찾아서 치환해야 함
  
  const replacementCandidates: string[] = [];
  
  // "이것", "그것", "이 제품", "해당 제품" 등 대명사/지시어 찾기
  const pronounPatterns = [
    '이것', '그것', '저것', '이 제품', '그 제품', '해당 제품',
    '이 방법', '그 방법', '이런 것', '그런 것', '이러한 것',
    '이 부분', '그 부분', '해당 부분', '이 경우', '그 경우'
  ];
  
  for (const pronoun of pronounPatterns) {
    if (content.includes(pronoun)) {
      replacementCandidates.push(pronoun);
    }
  }
  
  const prompt = `당신은 SEO 전문 에디터입니다. 키워드를 ${amount}회 추가해주세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
� 가장 중요: 글자수 변화 최소화!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
현재 글자수: ${currentCharCount}자
허용 범위: ${currentCharCount - 30}자 ~ ${currentCharCount + 30}자
→ 글자수가 이 범위를 벗어나면 실패입니다!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 키워드 조건
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${isMorpheme ? `형태소 "${targetWord}"` : `키워드 "${keyword}"`} (${targetWordLength}자)
현재: ${issue.current}회 → 목표: ${issue.target}회 (${amount}회 추가)

${isMorpheme ? `⚠️ 중요 - 형태소 카운트 규칙:
- "${targetWord}"를 포함하는 모든 단어가 카운트됩니다
  예: "${targetWord}", "${targetWord}수", "${targetWord}기" 등
- 목표: 15-18회 범위 (16회 목표)` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 글자수 유지하면서 키워드 추가하는 방법
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 방법1: 대명사/지시어를 키워드로 치환 (글자수 변화 최소)
${replacementCandidates.length > 0 ? `
   발견된 치환 대상: ${replacementCandidates.slice(0, 5).join(', ')}
   
   예시:
   - "이것은 효과가 좋습니다" → "${keyword}은 효과가 좋습니다"
   - "이 제품을 사용하면" → "${keyword}을 사용하면"
   - "해당 부분이 중요합니다" → "${keyword}이 중요합니다"
` : `
   예시:
   - "이것은 효과가 좋습니다" → "${keyword}은 효과가 좋습니다"
   - "이 제품을 사용하면" → "${keyword}을 사용하면"
`}

✅ 방법2: 기존 문장 내 단어 교체 (글자수 동일하게)
   - 기존: "좋은 제품을 선택하세요" (10자)
   - 수정: "${keyword}을 선택하세요" (${keyword.length + 5}자)
   → 차이나는 글자수만큼 다른 곳에서 조절

✅ 방법3: 문장 압축 + 키워드 추가 (글자수 상쇄)
   - 기존: "이러한 것들을 잘 확인하는 것이 중요합니다" (22자)
   - 수정: "${keyword} 확인이 중요합니다" (${keyword.length + 8}자)

⚠️ 절대 하지 말 것:
   - 새 문장 추가 ❌ (글자수 증가)
   - 문장 삭제 ❌ (글자수 감소)
   - 키워드만 끼워넣기 ❌ (글자수 증가)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 원본 글
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✏️ 출력 규칙
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 수정된 블로그 글 본문만 출력
2. 설명문 금지
3. 작업 후 체크:
   - "${keyword}"가 ${issue.target}회인가?
   - 글자수가 ${currentCharCount - 30}~${currentCharCount + 30}자 범위인가?`;
  
  try {
    console.log(`  🤖 Gemini API 호출 중... (키워드 조정)`);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    });
    
    const optimized = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!optimized || optimized.length < 100) {
      console.log(`  ⚠️ Gemini 응답이 비정상적, 원본 유지`);
      return content;
    }
    
    const newCharCount = optimized.replace(/\s/g, '').length;
    const charDiff = newCharCount - currentCharCount;
    
    console.log(`  ✓ 키워드 조정: ${issue.current}회 → 목표 ${issue.target}회`);
    console.log(`  ✓ 글자수 변화: ${currentCharCount} → ${newCharCount} (${charDiff > 0 ? '+' : ''}${charDiff}자)`);
    
    return optimized;
  } catch (error) {
    console.error(`  ❌ Gemini API 오류 (키워드 조정):`, error);
    return content;
  }
}

/**
 * 과다 사용 단어를 동의어로 치환 - 구체적 동의어 목록과 치환 가이드 제공
 */
async function fixOverusedWord(
  content: string,
  word: string,
  keyword?: string
): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_ENV_VAR || '' 
  });
  
  // 단어별 동의어 사전
  const synonymMap: Record<string, string[]> = {
    '자동차': ['차량', '승용차', '이 차', '해당 차종', '운전하는 차'],
    '차량': ['자동차', '승용차', '이 차', '해당 모델', '운전하는 차'],
    '엔진': ['동력장치', '파워트레인', '심장부', '구동계', '동력원'],
    '교체': ['변경', '갈아주기', '새로 장착', '바꾸기', '교환'],
    '점검': ['확인', '체크', '살펴보기', '검사', '진단'],
    '정비': ['관리', '수리', '손질', '케어', '유지보수'],
    '문제': ['이슈', '고장', '트러블', '증상', '현상'],
    '사용': ['활용', '이용', '쓰기', '적용', '사용하기'],
    '필요': ['중요', '필수', '요구', '권장', '필요한'],
    '경우': ['상황', '케이스', '때', '시점', '경우에'],
    '냉각': ['쿨링', '온도조절', '열관리', '냉각계통', '온도관리'],
    '부동액': ['쿨런트', '냉각수', '부동 성분', '동결방지액', '냉각제'],
    '중요': ['핵심적', '필수적', '꼭 필요한', '빠뜨릴 수 없는', '주요한'],
    '확인': ['체크', '살펴보기', '점검', '검토', '파악'],
    '추천': ['권장', '제안', '소개', '안내', '추천드리는'],
  };
  
  const synonyms = synonymMap[word] || ['동의어1', '동의어2', '다른 표현', '유사 표현', '대체 표현'];
  const currentCharCount = content.replace(/\s/g, '').length;
  const wordCount = (content.match(new RegExp(word, 'g')) || []).length;
  const replaceCount = Math.min(Math.max(wordCount - 14, 5), 7); // 14회 이하로 맞추기 위해 필요한 치환 수
  
  // 치환하면 안 되는 위치 찾기 (키워드 포함 문장, 소제목)
  const protectedLines: string[] = [];
  content.split('\n').forEach(line => {
    if (keyword && line.includes(keyword)) {
      protectedLines.push(line.substring(0, 30) + '...');
    }
    if (/^(#{1,3}\s|[0-9]+\.\s|●|■|▶)/.test(line.trim())) {
      protectedLines.push(line.substring(0, 30) + '...');
    }
  });
  
  const prompt = `당신은 SEO 전문 에디터입니다. 과다 사용된 단어를 치환해주세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 현재 상태
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- "${word}": 현재 ${wordCount}회 → 목표: 14회 이하 (${replaceCount}회 치환 필요)
- 글자수: ${currentCharCount}자 ⚠️ 그대로 유지!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 "${word}" ${replaceCount}회 치환 방법
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 사용할 동의어 목록:
${synonyms.map((s, i) => `   ${i+1}. "${s}"`).join('\n')}

✅ 치환 예시:
   - 기존: "${word}을 확인하세요"
   - 수정: "${synonyms[0]}을 확인하세요"
   
   - 기존: "${word}이 중요합니다"
   - 수정: "${synonyms[1]}이 중요합니다"

✅ 치환 우선순위:
   1. 본론 중간 부분의 "${word}" 먼저 치환
   2. 같은 문단에 "${word}"가 2번 이상 있으면 하나 치환
   3. 문맥에 가장 자연스러운 동의어 선택

${protectedLines.length > 0 ? `
⛔ 치환하면 안 되는 문장 (건드리지 마세요!):
${protectedLines.slice(0, 3).map((p, i) => `   ${i+1}. "${p}"`).join('\n')}` : ''}

⚠️ 절대 하지 말 것:
   - 소제목의 "${word}" 치환 ❌
   ${keyword ? `- 키워드 "${keyword}" 포함 문장의 "${word}" 치환 ❌` : ''}
   - 글자수 변경 ❌
   - 의미가 달라지는 치환 ❌

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 원본 글
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✏️ 출력: 수정된 블로그 글 본문만 (설명문 금지)`;  
  
  try {
    console.log(`  🤖 Gemini API 호출 중... (과다 사용 단어 치환)`);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    });
    
    const optimized = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!optimized || optimized.length < 100) {
      console.log(`  ⚠️ Gemini 응답이 비정상적, 원본 유지`);
      return content;
    }
    
    console.log(`  ✓ 과다 사용 단어 치환 완료: "${word}" (${replaceCount}회 치환)`);
    return optimized;
  } catch (error) {
    console.error(`  ❌ Gemini API 오류 (과다 사용 단어 치환):`, error);
    return content;
  }
}

/**
 * 설득력있는 글쓰기 구조 수정
 * - 서론 비율 조정 (35-40%)
 * - 독자 공감 요소 추가
 * - CTA(행동 유도) 추가
 */
async function fixStructure(
  content: string,
  issue: OptimizationIssue,
  keyword: string
): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_ENV_VAR || '' 
  });
  
  const currentCharCount = content.replace(/\s/g, '').length;
  const structureType = issue.structureType;
  
  let specificGuide = '';
  
  if (structureType === 'intro_ratio') {
    const currentRatio = issue.current;
    if (currentRatio < 30) {
      // 서론이 부족 - 서론 늘리기
      specificGuide = `
🔧 서론 비율 늘리기 (현재 ${currentRatio}% → 목표 35-40%)

✅ 방법:
1. 서론 첫 문단에 독자 상황 공감 문장 1-2개 추가
   예: "많은 분들이 ${keyword}에 대해 한 번쯤 고민해보셨을 겁니다."
   예: "혹시 ${keyword} 때문에 걱정되신 적 있으신가요?"

2. 서론 마지막에 글의 목적 문장 추가
   예: "오늘은 ${keyword}에 대해 자세히 알아보겠습니다."

⚠️ 주의: 본론/결론 내용은 그대로 유지!`;
    } else {
      // 서론이 과다 - 서론 줄이기
      specificGuide = `
🔧 서론 비율 줄이기 (현재 ${currentRatio}% → 목표 35-40%)

✅ 방법:
1. 서론의 반복되는 내용 압축
2. 불필요한 배경 설명 제거
3. 핵심 메시지만 남기기

⚠️ 주의: 독자 공감 요소는 유지!`;
    }
  } else if (structureType === 'intro_empathy') {
    specificGuide = `
🔧 서론에 독자 공감 요소 추가

✅ 서론 첫 부분에 다음 중 하나 추가:
- "많은 분들이 ${keyword}에 대해 궁금해하십니다."
- "혹시 ${keyword} 관련해서 고민이 있으신가요?"
- "${keyword}에 대해 걱정되셨던 경험이 있으신가요?"
- "알고 계신가요? ${keyword}는 생각보다 중요합니다."

✅ 삽입 위치: 서론 첫 번째 또는 두 번째 문장

⚠️ 주의: 
- 글자수 최소한으로 변경 (±30자 이내)
- 기존 서론 내용 유지`;
  } else if (structureType === 'conclusion_cta') {
    specificGuide = `
🔧 결론에 CTA(행동 유도) 요소 추가

✅ 결론 마지막에 다음 중 하나 추가:
- "더 궁금한 점이 있으시면 문의해 주세요."
- "도움이 되셨다면 다른 글도 확인해 보세요."
- "전문가 상담이 필요하시면 연락 주세요."
- "${keyword} 관련 추가 정보가 필요하시면 방문해 주세요."

✅ 삽입 위치: 결론 마지막 문장

⚠️ 주의:
- 부담스럽지 않은 자연스러운 CTA
- 글자수 최소한으로 변경 (±30자 이내)`;
  }
  
  const prompt = `당신은 설득력있는 글쓰기 전문가입니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 현재 상태
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 문제: ${issue.description}
- 글자수: ${currentCharCount}자 (±30자 이내 유지!)

${specificGuide}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 원본 글
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✏️ 출력 규칙
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 수정된 블로그 글 본문만 출력
2. 설명문 금지
3. 소제목 구조 유지
4. 글자수 ${currentCharCount - 30}~${currentCharCount + 30}자 범위 유지`;

  try {
    console.log(`  🤖 Gemini API 호출 중... (설득력 구조 수정)`);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    });
    
    const optimized = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!optimized || optimized.length < 100) {
      console.log(`  ⚠️ Gemini 응답이 비정상적, 원본 유지`);
      return content;
    }
    
    const newCharCount = optimized.replace(/\s/g, '').length;
    
    console.log(`  ✓ 설득력 구조 수정 완료: ${issue.description}`);
    console.log(`  ✓ 글자수 변화: ${currentCharCount} → ${newCharCount} (${newCharCount - currentCharCount > 0 ? '+' : ''}${newCharCount - currentCharCount}자)`);
    
    return optimized;
  } catch (error) {
    console.error(`  ❌ Gemini API 오류 (설득력 구조 수정):`, error);
    return content;
  }
}
