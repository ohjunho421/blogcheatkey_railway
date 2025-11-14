// Enhanced Korean morpheme extraction with Hangul library support
import Hangul from 'hangul-js';

// Define MorphemeAnalysis type inline to avoid import issues
interface MorphemeAnalysis {
  isOptimized: boolean;
  isKeywordOptimized: boolean;
  isLengthOptimized: boolean;
  keywordMorphemeCount: number;
  characterCount: number;
  targetCharacterRange: string;
  issues: string[];
  suggestions: string[];
  customMorphemes: { used: string[], missing: string[] };
  isCustomMorphemesOptimized: boolean;
}

export function extractKoreanMorphemes(text: string): string[] {
  const morphemes: string[] = [];
  
  // Split by various Korean delimiters and extract meaningful segments
  const segments = text
    .split(/[\s.,!?;:'"()[\]{}\-_=+|\\\/~`@#$%^&*<>]+/)
    .filter(segment => segment.length > 0);
  
  for (const segment of segments) {
    // Extract Korean + alphanumeric sequences
    const matches = segment.match(/[가-힣a-zA-Z0-9]+/g);
    if (matches) {
      for (const match of matches) {
        if (match.length >= 1) {
          // 추가 처리: 한국어 단어인 경우 조사 분리
          const processed = processKoreanWord(match);
          morphemes.push(...processed);
        }
      }
    }
  }
  
  console.log(`Extracted morphemes:`, morphemes.slice(0, 20)); // First 20 for debugging
  return morphemes;
}

// 한국어 단어 처리 - 조사 분리 및 복합어 처리 (Hangul.js 활용)
function processKoreanWord(word: string): string[] {
  const result: string[] = [];
  
  // 한국어가 아닌 경우 그대로 반환
  if (!/[가-힣]/.test(word)) {
    return [word];
  }
  
  // Hangul.js를 사용하여 받침 확인 (조사 선택에 도움)
  const lastChar = word[word.length - 1];
  const disassembled = Hangul.disassemble(lastChar);
  const hasFinalConsonant = disassembled.length === 3; // 받침 있음
  
  // 한국어 조사/어미 패턴 (빈도 높은 순으로 정렬)
  const postpositions = [
    // 서술격 조사 및 어미 (우선 처리)
    '입니다', '습니다', '였습니다', '했습니다', '됩니다',
    // 복합 조사
    '에서는', '에서도', '으로는', '로는', '에게는', '에서의',
    // 기본 조사
    '에서', '으로', '로부터', '까지', '에게', '한테',
    '을', '를', '이', '가', '은', '는', '의', '에', '로',
    '와', '과', '도', '만', '부터', '께', '더러',
    // 용언 어미
    '니다', '이다', '합니다', '입니', '있습니', '됩니'
  ];
  
  // 조사 분리 시도 (긴 것부터 매칭)
  for (const postposition of postpositions) {
    if (word.endsWith(postposition) && word.length > postposition.length + 1) {
      const stem = word.slice(0, -postposition.length);
      // 어간이 의미있는 길이인 경우에만 분리 (한글 1글자 이상)
      if (stem.length >= 1 && /[가-힣]/.test(stem)) {
        result.push(stem);
        // 조사도 필요하면 추가 가능 (현재는 어간만 반환)
        return result;
      }
    }
  }
  
  // 조사 분리가 안 된 경우 원본 반환
  result.push(word);
  return result;
}

// 🆕 분해 결과 캐시 (동일 키워드 반복 방지)
const decompositionCache = new Map<string, string[]>();

// 🆕 AI 기반 키워드 분해 (hangul-js 보조, 캐싱 적용)
async function aiBasedKeywordDecomposer(keyword: string): Promise<string[]> {
  // 캐시 확인
  if (decompositionCache.has(keyword)) {
    console.log(`Using cached decomposition for "${keyword}"`);
    return decompositionCache.get(keyword)!;
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_ENV_VAR || '' 
    });

    // Hangul.js를 사용하여 한글 분석 보조
    const hasKorean = /[가-힣]/.test(keyword);
    const disassembled = hasKorean ? Hangul.disassemble(keyword) : null;
    const analysisPart = disassembled ? `\n참고: 자소 분석 결과 ${disassembled.length}개 자소` : '';

    const prompt = `다음 키워드를 의미있는 단어 단위로 분해하세요.

키워드: "${keyword}"${analysisPart}

규칙:
1. 최소 의미 단위로 분해 (각 단어가 독립적 의미를 가져야 함)
2. 너무 작게 쪼개지 말 것 (2글자 이상 권장)
3. 영어/숫자는 그대로 유지 (예: "BMW" → ["BMW"])

정확한 분해 예시:
✅ "벤츠엔진경고등" → ["벤츠", "엔진", "경고등"]
✅ "미션오일교체주기" → ["미션", "오일", "교체", "주기"]
✅ "냉각수부동액" → ["냉각수", "부동액"]  👈 중요: 냉각수와 부동액은 별개 단어
✅ "타이어교체비용" → ["타이어", "교체", "비용"]
✅ "영어학원추천" → ["영어", "학원", "추천"]

❌ "냉각수부동액" → ["냉각", "수", "부동", "액"]  (너무 작게 쪼갬)
❌ "냉각수부동액" → ["냉각수부동액"]  (분해 안 됨)

JSON 배열로만 응답 (예: ["단어1", "단어2", "단어3"])`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      config: {
        responseMimeType: "application/json"
      },
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    });

    const result = JSON.parse(response.text || '[]').filter((word: string) => word.length >= 1);
    console.log(`✨ AI decomposition (Hangul.js enhanced): "${keyword}" → [${result.join(', ')}]`);
    
    // 캐시 저장
    decompositionCache.set(keyword, result);
    return result;
  } catch (error) {
    console.error('AI decomposition failed, using enhanced fallback:', error);
    const fallback = fallbackPatternDecomposer(keyword);
    decompositionCache.set(keyword, fallback);
    return fallback;
  }
}

// 폴백: 개선된 패턴 기반 분해 (AI 실패 시)
function fallbackPatternDecomposer(text: string): string[] {
  console.log(`Using enhanced fallback pattern decomposition for: "${text}"`);
  
  // 일반적인 한국어 복합어 패턴 사전
  const commonPatterns = [
    // 자동차 관련 - 복합어 먼저 매칭
    { pattern: /냉각수부동액/, parts: ['냉각수', '부동액'] },
    { pattern: /엔진오일교체/, parts: ['엔진', '오일', '교체'] },
    { pattern: /미션오일교체/, parts: ['미션', '오일', '교체'] },
    { pattern: /타이어교체비용/, parts: ['타이어', '교체', '비용'] },
    { pattern: /벤츠엔진경고등/, parts: ['벤츠', '엔진', '경고등'] },
    { pattern: /엔진경고등/, parts: ['엔진', '경고등'] },
    { pattern: /벤츠엔진/, parts: ['벤츠', '엔진'] },
    { pattern: /오일교체/, parts: ['오일', '교체'] },
    { pattern: /타이어교체/, parts: ['타이어', '교체'] },
    { pattern: /브레이크패드/, parts: ['브레이크', '패드'] },
    { pattern: /에어컨필터/, parts: ['에어컨', '필터'] },
    { pattern: /냉각수/, parts: ['냉각수'] },
    { pattern: /부동액/, parts: ['부동액'] },
    { pattern: /첨가제/, parts: ['첨가제'] },
    
    // 교육 관련
    { pattern: /영어학원/, parts: ['영어', '학원'] },
    { pattern: /수학학원/, parts: ['수학', '학원'] },
    { pattern: /코딩교육/, parts: ['코딩', '교육'] },
    { pattern: /온라인강의/, parts: ['온라인', '강의'] },
    
    // 기술 관련
    { pattern: /인공지능/, parts: ['인공지능'] },
    { pattern: /머신러닝/, parts: ['머신', '러닝'] },
    { pattern: /딥러닝/, parts: ['딥', '러닝'] },
    { pattern: /빅데이터/, parts: ['빅', '데이터'] },
  ];
  
  const result: string[] = [];
  let pos = 0;
  
  while (pos < text.length) {
    const remaining = text.substring(pos);
    let matched = false;
    
    // 1. 패턴 매칭 시도
    for (const { pattern, parts } of commonPatterns) {
      const match = remaining.match(pattern);
      if (match && match.index === 0) {
        result.push(...parts);
        pos += match[0].length;
        matched = true;
        break;
      }
    }
    
    if (matched) continue;
    
    // 2. 영어+숫자 추출
    const engMatch = remaining.match(/^[a-zA-Z0-9]+/);
    if (engMatch) {
      result.push(engMatch[0]);
      pos += engMatch[0].length;
      continue;
    }
    
    // 3. 한글 2-3글자 단위 분할 (개선)
    const korMatch = remaining.match(/^[가-힣]+/);
    if (korMatch) {
      const korText = korMatch[0];
      
      // 3-1. 길이에 따른 스마트 분할
      if (korText.length <= 2) {
        result.push(korText);
        pos += korText.length;
      } else if (korText.length === 3) {
        // 3글자: 그대로 또는 2+1 분할
        result.push(korText.substring(0, 2));
        pos += 2;
      } else if (korText.length === 4) {
        // 4글자: 2+2 분할
        result.push(korText.substring(0, 2));
        pos += 2;
      } else {
        // 5글자 이상: 2-3글자씩
        const segmentLength = Math.min(3, korText.length);
        result.push(korText.substring(0, segmentLength));
        pos += segmentLength;
      }
      continue;
    }
    
    pos++;
  }
  
  return result.filter(word => word.length >= 1);
}

// 지능적 복합어 분해 함수 (한국어 + 영어 + 숫자 혼합 지원) - 사전 기반 (폐기 예정)
function intelligentKoreanDecomposer(text: string): string[] {
  console.log(`=== Intelligent decomposing: "${text}" ===`);
  
  // 1단계: 핵심 단어 사전
  const coreWords = [
    // 한국어 2글자 핵심 명사
    '자동', '전기', '수학', '영어', '국어', '과학', '물리', '화학', '생물', '역사', '사회',
    '학원', '과외', '교육', '학습', '공부', '시험', '성적', '입시', '수능', 
    '엔진', '타이어', '브레이크', '배터리', '에어컨', '필터', '센서', '부품', '미션',
    '냉각', '오일', '교체', '점검', '수리', '정비', '시기', '주기', '방법', '가격',
    '비용', '추천', '후기', '리뷰', '정보', '소식', '뉴스', '서비스', '업체',
    '회사', '전문', '맞춤', '개인', '온라인', '화상', '대면', '코딩', '개발',
    '시스템', '데이터', '머신', '딥러닝', '빅데이터', '언어', '치료', '심리',
    '발달', '재활', '상담', '지원', '아이', '어린이', '유아', '청소년',
    '벤츠', '경고', '고등', '벤츠엔',
    
    // 한국어 3글자 핵심 명사  
    '오토바이', '하이브리드', '친환경', '경고등', '엔진경고', '웹사이트', '홈페이지', '커뮤니티',
    '프로그래밍', '소프트웨어', '데이터베이스', '인공지능', '언어치료', '심리치료',
    '발달재활', '언어발달', '심리상담',
    
    // 한국어 4글자 이상 핵심 명사 및 복합어
    '지구과학', '우리아이', '아이심리', '심리지원', '지원서비스', '우리아이심리',
    '심리지원서비스', '우리아이심리지원서비스',
    '엔진경고등', '벤츠엔진',
    
    // 영어 단어들 (소문자로 저장)
    'bmw', 'audi', 'benz', 'mercedes', 'hyundai', 'kia', 'lg', 'samsung',
    'coding', 'tuning', 'programming', 'filter', 'engine', 'tire', 'brake',
    'battery', 'sensor', 'system', 'data', 'machine', 'deep', 'learning',
    'big', 'software', 'database', 'ai', 'web', 'app', 'blog', 'site',
    
    // 영어+숫자 조합들
    'a1', 'a3', 'a4', 'a6', 'a8', 'q3', 'q5', 'q7', 'q8',
    'x1', 'x3', 'x5', 'x7', 'i3', 'i8', 'm3', 'm5',
    'c200', 'c300', 'e200', 'e300', 's300', 's500',
    '520d', '530i', '540i', '10w30', '10w40', '5w30', '5w40'
  ];
  
  // 2단계: 한국어 어미/접미사 패턴
  const suffixPatterns = ['수', '제', '기', '등', '차', '품', '드', '값', '률', '량', '도'];
  
  // 3단계: 지능적 분해 알고리즘 (한영 혼합 지원)
  function smartDecompose(text: string): string[] {
    const result: string[] = [];
    let pos = 0;
    
    while (pos < text.length) {
      let bestMatch = '';
      let bestLength = 0;
      
      // 현재 위치에서 가장 긴 의미있는 단어 찾기
      for (let len = Math.min(8, text.length - pos); len >= 1; len--) {
        const candidate = text.substring(pos, pos + len);
        const candidateLower = candidate.toLowerCase();
        
        // 한국어 단어 또는 영어 단어 매칭
        if (coreWords.includes(candidate) || coreWords.includes(candidateLower)) {
          if (len > bestLength) {
            bestMatch = candidate;
            bestLength = len;
          }
        }
      }
      
      if (bestMatch) {
        result.push(bestMatch);
        pos += bestLength;
      } else {
        // 사전에 없는 경우 패턴 기반 분해
        const remaining = text.substring(pos);
        const analyzed = analyzeUnknownSegment(remaining);
        
        if (analyzed.length > 0) {
          result.push(analyzed[0]);
          pos += analyzed[0].length;
        } else {
          // 최후의 수단: 문자 유형별 분할
          const segmentInfo = getSegmentInfo(remaining);
          if (segmentInfo.length >= 1) {
            result.push(segmentInfo.segment);
            pos += segmentInfo.length;
          } else {
            pos++; // 1글자는 건너뛰기
          }
        }
      }
    }
    
    return result.filter(word => word.length >= 1); // 영어나 숫자는 1글자도 허용
  }
  
  // 새로운 함수: 문자 유형별 세그먼트 정보 반환
  function getSegmentInfo(text: string): { segment: string; length: number } {
    if (text.length === 0) return { segment: '', length: 0 };
    
    const firstChar = text[0];
    
    // 영어인 경우
    if (/[a-zA-Z]/.test(firstChar)) {
      const match = text.match(/^[a-zA-Z0-9]+/);
      return { segment: match ? match[0] : firstChar, length: match ? match[0].length : 1 };
    }
    
    // 숫자인 경우
    if (/[0-9]/.test(firstChar)) {
      const match = text.match(/^[0-9]+[a-zA-Z]*/);
      return { segment: match ? match[0] : firstChar, length: match ? match[0].length : 1 };
    }
    
    // 한국어인 경우
    if (/[가-힣]/.test(firstChar)) {
      const koreanMatch = text.match(/^[가-힣]+/);
      if (koreanMatch) {
        const segment = koreanMatch[0];
        // 2-3글자씩 분할
        const segmentLength = Math.min(3, segment.length);
        return { segment: segment.substring(0, segmentLength), length: segmentLength };
      }
    }
    
    return { segment: firstChar, length: 1 };
  }
  
  // 4단계: 미지의 세그먼트 분석 (한영 혼합 지원)
  function analyzeUnknownSegment(segment: string): string[] {
    console.log(`Analyzing unknown segment: "${segment}"`);
    
    // 혼합 패턴 감지 (한국어+영어+숫자)
    const mixedPattern = segment.match(/([가-힣]+)|([a-zA-Z]+[0-9]*)|([0-9]+[a-zA-Z]*)/g);
    if (mixedPattern && mixedPattern.length > 1) {
      console.log(`Mixed pattern detected: [${mixedPattern.join(', ')}]`);
      return mixedPattern.filter(part => part.length >= 1);
    }
    
    // 순수 한국어 세그먼트 분석
    if (/^[가-힣]+$/.test(segment)) {
      if (segment.length >= 4) {
        // 4글자 이상인 경우 2+2 또는 3+나머지로 분할 시도
        const firstHalf = segment.substring(0, 2);
        const secondHalf = segment.substring(2);
        
        // 뒷부분이 일반적인 접미사 패턴인지 확인
        if (suffixPatterns.some(suffix => secondHalf.startsWith(suffix))) {
          return [firstHalf, secondHalf];
        }
        
        // 3+나머지 패턴 시도
        if (segment.length >= 5) {
          const first3 = segment.substring(0, 3);
          const rest = segment.substring(3);
          return [first3, rest];
        }
        
        // 기본 2+2 분할
        return [firstHalf, secondHalf];
      } else if (segment.length >= 2) {
        return [segment];
      }
    }
    
    // 순수 영어+숫자 세그먼트
    if (/^[a-zA-Z0-9]+$/.test(segment)) {
      // 영어+숫자 조합은 그대로 유지 (예: "a6", "520d")
      return [segment];
    }
    
    return [];
  }
  
  const decomposed = smartDecompose(text);
  console.log(`Decomposed "${text}" → [${decomposed.join(', ')}]`);
  
  return decomposed;
}

// 🆕 더블 체크: 패턴 기반 + AI 기반 비교
async function doubleCheckDecomposition(keyword: string): Promise<string[]> {
  console.log(`🔍 Double-check decomposition for: "${keyword}"`);
  
  // 방법 1: 빠른 패턴 기반
  const patternBased = fallbackPatternDecomposer(keyword);
  console.log(`  패턴 기반: [${patternBased.join(', ')}]`);
  
  // 방법 2: 정확한 AI 기반
  const aiBased = await aiBasedKeywordDecomposer(keyword);
  console.log(`  AI 기반: [${aiBased.join(', ')}]`);
  
  // 결과 비교 및 최종 결정
  if (patternBased.length === aiBased.length && 
      patternBased.every((word, i) => word === aiBased[i])) {
    console.log(`  ✅ 일치! 결과 사용: [${aiBased.join(', ')}]`);
    return aiBased;
  }
  
  // 불일치 시 AI 우선 (더 정확함)
  console.log(`  ⚠️ 불일치 감지. AI 결과 우선 사용: [${aiBased.join(', ')}]`);
  console.log(`  참고용 패턴 결과: [${patternBased.join(', ')}]`);
  return aiBased;
}

// Extract individual keyword components for SEO optimization (🆕 더블 체크 기반)
export async function extractKeywordComponents(keyword: string): Promise<string[]> {
  const components: string[] = [];
  
  console.log(`=== Starting double-check keyword decomposition for: "${keyword}" ===`);
  
  // Handle compound keywords with comma separator
  if (keyword.includes(',')) {
    console.log('Comma-separated compound keyword detected');
    const parts = keyword.split(',').map(part => part.trim()).filter(Boolean);
    console.log('Split parts:', parts);
    
    // For compound keywords, treat each complete part as the main component
    for (const part of parts) {
      if (part.length > 0) {
        components.push(part);
        
        // 🆕 더블 체크 분해
        const subComponents = await doubleCheckDecomposition(part);
        for (const subComp of subComponents) {
          if (subComp.length >= 2 && !components.includes(subComp)) {
            components.push(subComp);
          }
        }
      }
    }
  } else {
    // 🆕 Single keyword double-check decomposition
    const decomposed = await doubleCheckDecomposition(keyword);
    console.log(`Double-check decomposition result: [${decomposed.join(', ')}]`);
    
    for (const comp of decomposed) {
      if (!components.includes(comp) && comp.length >= 1) {
        components.push(comp);
      }
    }
  }
  
  console.log(`Keyword components extracted from "${keyword}":`, components);
  return components;
}

// Find complete keyword matches - 완전한 키워드의 정확한 출현만 카운트
export function findCompleteKeywordMatches(morphemes: string[], keyword: string): string[] {
  const matches: string[] = [];
  console.log(`Looking for complete keyword: "${keyword}"`);
  
  // Handle compound keywords with comma separator
  if (keyword.includes(',')) {
    const parts = keyword.split(',').map(part => part.trim()).filter(Boolean);
    console.log('Looking for compound keyword parts:', parts);
    
    // For compound keywords, we need to be more selective about what counts as "complete"
    // Count only instances where BOTH parts appear close together or as the full compound
    let compoundMatches = 0;
    
    // Look for cases where both parts appear near each other in the text
    const fullText = morphemes.join(' ').toLowerCase();
    const part1 = parts[0].toLowerCase();
    const part2 = parts[1]?.toLowerCase();
    
    if (part1 && part2) {
      // Count occurrences where both parts appear within reasonable proximity (within 50 characters)
      let searchIndex = 0;
      while (searchIndex < fullText.length) {
        const index1 = fullText.indexOf(part1, searchIndex);
        if (index1 === -1) break;
        
        const index2 = fullText.indexOf(part2, index1);
        if (index2 !== -1 && (index2 - index1) <= 50) {
          compoundMatches++;
          console.log(`✓ Compound keyword proximity match found: "${part1}" + "${part2}"`);
          searchIndex = index1 + part1.length;
        } else {
          searchIndex = index1 + part1.length;
        }
      }
      
      // Add dummy matches to reach the compound count
      for (let i = 0; i < compoundMatches; i++) {
        matches.push(`${parts[0]}, ${parts[1]}`);
      }
    }
    
    // Also look for the complete compound keyword written together (less common)
    const fullKeyword = keyword.replace(/,\s*/g, ''); // Remove comma and spaces
    const lowerFullKeyword = fullKeyword.toLowerCase();
    for (const morpheme of morphemes) {
      const lowerMorpheme = morpheme.toLowerCase();
      if (lowerMorpheme === lowerFullKeyword || 
          (lowerMorpheme.startsWith(lowerFullKeyword) && 
           lowerMorpheme.length <= lowerFullKeyword.length + 2)) {
        matches.push(morpheme);
        console.log(`✓ Complete compound keyword match: "${morpheme}"`);
      }
    }
  } else {
    // Single keyword matching
    const lowerKeyword = keyword.toLowerCase();
    for (const morpheme of morphemes) {
      const lowerMorpheme = morpheme.toLowerCase();
      
      // 완전한 키워드 자체 또는 조사가 붙은 형태만 인정
      if (lowerMorpheme === lowerKeyword || 
          (lowerMorpheme.startsWith(lowerKeyword) && 
           lowerMorpheme.length <= lowerKeyword.length + 2)) {
        matches.push(morpheme);
        console.log(`✓ Complete keyword match: "${morpheme}"`);
      }
    }
  }
  
  console.log(`Total complete keyword matches found: ${matches.length}`);
  return matches;
}

/**
 * Detect if a component is a foreign word (English, numbers, mixed)
 */
function isForeignWord(component: string): boolean {
  // Contains Latin alphabet or numbers
  return /[a-zA-Z0-9]/.test(component);
}

/**
 * Intelligent matching for keyword components
 * Handles both Korean and foreign words appropriately
 */
function isComponentMatch(morpheme: string, component: string): boolean {
  const lowerMorpheme = morpheme.toLowerCase();
  const lowerComponent = component.toLowerCase();
  
  // Exact match (case-insensitive)
  if (lowerMorpheme === lowerComponent) {
    return true;
  }
  
  // Detect if component is foreign word
  const isForeign = isForeignWord(component);
  
  if (isForeign) {
    // For foreign words (English, numbers, mixed):
    // Match if morpheme contains the component as a whole word or part
    // Examples: "BMW" matches "bmw", "BMW", "Bmw"
    //           "10w40" matches "10w40", "10W40"
    
    // Exact case-insensitive match
    if (lowerMorpheme === lowerComponent) {
      return true;
    }
    
    // Contains match for foreign words in compound contexts
    // Example: "엔진오일10w40" should match "10w40"
    if (lowerMorpheme.includes(lowerComponent)) {
      return true;
    }
    
    // Also check if morpheme starts or ends with the component
    // This helps with cases like "BMW코딩" matching "BMW"
    if (lowerMorpheme.startsWith(lowerComponent) || lowerMorpheme.endsWith(lowerComponent)) {
      return true;
    }
  } else {
    // For Korean words:
    // More flexible matching to catch compound words
    // Examples: "벤츠" should match "벤츠엔진경고등"
    //           "엔진" should match "벤츠엔진", "엔진오일"
    
    // Exact match
    if (lowerMorpheme === lowerComponent) {
      return true;
    }
    
    // Contains match for Korean components (allows finding in compound words)
    if (lowerMorpheme.includes(lowerComponent)) {
      return true;
    }
    
    // Check if component appears as a distinct part
    // This handles cases where the component is a meaningful unit within a larger word
    const componentLength = component.length;
    if (componentLength >= 2 && lowerMorpheme.includes(lowerComponent)) {
      return true;
    }
  }
  
  return false;
}

// Find individual keyword component matches (for 15-17 occurrences each)
export async function findKeywordComponentMatches(morphemes: string[], keyword: string): Promise<Map<string, string[]>> {
  const keywordComponents = await extractKeywordComponents(keyword);
  const componentMatches = new Map<string, string[]>();
  
  console.log(`Target keyword components:`, keywordComponents);
  console.log(`Sample content morphemes:`, morphemes.slice(0, 30));
  
  for (const component of keywordComponents) {
    const matches: string[] = [];
    const componentType = isForeignWord(component) ? '외래어' : '한글';
    
    console.log(`\n🔍 Analyzing component: "${component}" (${componentType})`);
    
    for (const morpheme of morphemes) {
      if (isComponentMatch(morpheme, component)) {
        matches.push(morpheme);
        console.log(`  ✓ Match found: "${morpheme}"`);
      }
    }
    
    componentMatches.set(component, matches);
    console.log(`📊 "${component}" appears ${matches.length} times in content`);
  }
  
  return componentMatches;
}

// Check if custom morphemes are present in content
function checkCustomMorphemes(content: string, customMorphemes?: string): { used: string[], missing: string[] } {
  if (!customMorphemes) {
    return { used: [], missing: [] };
  }
  
  const morphemesArray = customMorphemes.split(' ').filter(m => m.trim().length > 0);
  const contentLower = content.toLowerCase();
  const used: string[] = [];
  const missing: string[] = [];
  
  console.log(`Checking custom morphemes:`, morphemesArray);
  
  for (const morpheme of morphemesArray) {
    if (contentLower.includes(morpheme.toLowerCase())) {
      used.push(morpheme);
      console.log(`✓ Custom morpheme found: "${morpheme}"`);
    } else {
      missing.push(morpheme);
      console.log(`✗ Custom morpheme missing: "${morpheme}"`);
    }
  }
  
  return { used, missing };
}

// 전체 형태소 빈도 검사 함수 (20회 초과 방지)
async function checkAllMorphemeFrequencies(content: string, keyword: string): Promise<{ overused: Array<{morpheme: string, count: number}>, allCounts: Map<string, number> }> {
  console.log('🔍 전체 형태소 빈도 검사 시작...');
  
  const allMorphemes = extractKoreanMorphemes(content);
  const keywordComponents = await extractKeywordComponents(keyword);
  const keywordComponentsLower = keywordComponents.map(comp => comp.toLowerCase());
  
  // 모든 형태소 빈도 계산
  const morphemeFrequency = new Map<string, number>();
  allMorphemes.forEach(morpheme => {
    const cleanMorpheme = morpheme.toLowerCase();
    morphemeFrequency.set(cleanMorpheme, (morphemeFrequency.get(cleanMorpheme) || 0) + 1);
  });
  
  // 과다 사용 형태소 찾기 (키워드 우위성 확보)
  const overused: Array<{morpheme: string, count: number}> = [];
  for (const [morpheme, count] of Array.from(morphemeFrequency.entries())) {
    const isKeywordComponent = keywordComponentsLower.includes(morpheme);
    const maxAllowed = isKeywordComponent ? 18 : 14; // 키워드: 15-18회, 다른 단어: 14회 이하
    
    if (count > maxAllowed) {
      overused.push({ morpheme, count });
      console.log(`❌ "${morpheme}" 초과 사용: ${count}회 (최대 ${maxAllowed}회) ${isKeywordComponent ? '[키워드 형태소]' : '[일반 형태소]'}`);
    }
  }
  
  console.log(`전체 형태소 빈도 검사 완료. 초과 사용: ${overused.length}개`);
  return { overused, allCounts: morphemeFrequency };
}

export async function analyzeMorphemes(content: string, keyword: string, customMorphemes?: string): Promise<MorphemeAnalysis> {
  console.log(`=== Morpheme Analysis for keyword: "${keyword}" ===`);
  
  try {
    // 전체 형태소 빈도 먼저 검사
    const frequencyCheck = await checkAllMorphemeFrequencies(content, keyword);
    
    // Extract all morphemes from content
    const allMorphemes = extractKoreanMorphemes(content);
    console.log(`Total morphemes extracted: ${allMorphemes.length}`);
    
    // Calculate character count (excluding spaces)
    const characterCount = content.replace(/\s/g, '').length;
  
  // Find complete keyword matches (minimum 5 required)
  const completeKeywordMatches = findCompleteKeywordMatches(allMorphemes, keyword);
  const completeKeywordCount = completeKeywordMatches.length;
  
  // Find individual component matches (15-18회 허용)
  const componentMatches = await findKeywordComponentMatches(allMorphemes, keyword);
  const keywordComponents = await extractKeywordComponents(keyword);
  
  // Check complete keyword condition (5-7 times)
  const isCompleteKeywordOptimized = completeKeywordCount >= 5 && completeKeywordCount <= 7;
  
  // Check individual component conditions (15-18 times each) - 실용적인 SEO 기준
  let areComponentsOptimized = true;
  const componentIssues: string[] = [];
  
  console.log(`Complete keyword "${keyword}" appears: ${completeKeywordCount} times (5-7 times required)`);
  
  for (const component of keywordComponents) {
    const matches = componentMatches.get(component) || [];
    const count = matches.length;
    
    if (count < 15 || count > 18) {
      areComponentsOptimized = false;
      if (count < 15) {
        componentIssues.push(`${component}: ${count}회 (부족, 15-18회 권장)`);
      } else if (count > 18) {
        componentIssues.push(`${component}: ${count}회 (과다, 15-18회 권장)`);
      }
    }
  }
  
  // Check length condition (1700-2000 characters excluding spaces)
  const isLengthOptimized = characterCount >= 1700 && characterCount <= 2000;
  
  // Overall keyword optimization status
  const isKeywordOptimized = isCompleteKeywordOptimized && areComponentsOptimized;
  
  // Check custom morphemes
  const customMorphemeCheck = checkCustomMorphemes(content, customMorphemes);
  const isCustomMorphemesOptimized = customMorphemeCheck.missing.length === 0;
  
  // 형태소 빈도 검사 결과 반영
  const hasOverusedMorphemes = frequencyCheck.overused.length > 0;
  const isOptimized = isLengthOptimized && isKeywordOptimized && !hasOverusedMorphemes;
  
  // Generate issues and suggestions
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Add specific issues and suggestions
  if (!isCompleteKeywordOptimized) {
    if (completeKeywordCount < 5) {
      issues.push(`완전한 키워드 "${keyword}" 출현 횟수 부족: ${completeKeywordCount}회 (5-7회 필요)`);
      suggestions.push(`키워드 "${keyword}"를 5-7회 사용해주세요`);
    } else if (completeKeywordCount > 7) {
      issues.push(`완전한 키워드 "${keyword}" 출현 횟수 과다: ${completeKeywordCount}회 (5-7회 필요)`);
      suggestions.push(`키워드 "${keyword}"를 7회 이하로 줄여주세요`);
    }
  }
  
  if (!areComponentsOptimized) {
    for (const issue of componentIssues) {
      issues.push(`형태소 출현 횟수 불균형: ${issue}`);
    }
    suggestions.push(`키워드 구성 요소들(${keywordComponents.join(', ')})을 각각 16회를 목표로 사용해주세요 (15-18회 허용)`);
  }
  
  if (!isLengthOptimized) {
    if (characterCount < 1700) {
      issues.push(`글자수 부족: ${characterCount}자 (1700-2000자 필요)`);
      suggestions.push(`내용을 추가하여 1700자 이상으로 늘려주세요`);
    } else if (characterCount > 2000) {
      issues.push(`글자수 초과: ${characterCount}자 (1700-2000자 필요)`);
      suggestions.push(`내용을 줄여서 2000자 이하로 맞춰주세요`);
    }
  }
  
  if (!isCustomMorphemesOptimized && customMorphemes) {
    issues.push(`누락된 필수 형태소: ${customMorphemeCheck.missing.join(', ')}`);
    suggestions.push(`다음 단어들을 글에 포함해주세요: ${customMorphemeCheck.missing.join(', ')}`);
  }
  
  // 형태소 초과 사용 검사 결과 추가
  if (hasOverusedMorphemes) {
    const keywordComponentsLower = keywordComponents.map(comp => comp.toLowerCase());
    for (const overused of frequencyCheck.overused) {
      const isKeywordComponent = keywordComponentsLower.includes(overused.morpheme.toLowerCase());
      const maxAllowed = isKeywordComponent ? 18 : 14;
      issues.push(`형태소 과다 사용: "${overused.morpheme}" ${overused.count}회 (최대 ${maxAllowed}회)`);
    }
    suggestions.push(`과다 사용된 형태소들을 동의어나 유의어로 교체해주세요`);
  }

  return {
    isOptimized,
    isKeywordOptimized,
    isLengthOptimized,
    keywordMorphemeCount: completeKeywordCount,
    characterCount,
    targetCharacterRange: '1700-2000자',
    issues,
    suggestions,
    customMorphemes: customMorphemeCheck,
    isCustomMorphemesOptimized
  };
  
  } catch (error) {
    console.error(`Morpheme analysis failed for keyword "${keyword}":`, error);
    return {
      isOptimized: false,
      isKeywordOptimized: false,
      isLengthOptimized: false,
      keywordMorphemeCount: 0,
      characterCount: content.replace(/\s/g, '').length,
      targetCharacterRange: '1700-2000자',
      issues: ['형태소 분석 중 오류가 발생했습니다'],
      suggestions: ['키워드를 다시 확인해주세요'],
      customMorphemes: { used: [], missing: [] },
      isCustomMorphemesOptimized: false
    };
  }
}

// Enhanced SEO analysis combining morpheme analysis with basic metrics
export async function enhancedSEOAnalysis(content: string, keyword: string) {
  const morphemeAnalysis = await analyzeMorphemes(content, keyword);
  
  return {
    keywordFrequency: morphemeAnalysis.keywordMorphemeCount,
    characterCount: morphemeAnalysis.characterCount,
    morphemeCount: morphemeAnalysis.keywordMorphemeCount,
    isOptimized: morphemeAnalysis.isOptimized,
    issues: morphemeAnalysis.issues,
    suggestions: morphemeAnalysis.suggestions,
    targetCharacterRange: morphemeAnalysis.targetCharacterRange
  };
}