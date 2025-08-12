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

// Simple Korean morpheme extraction function
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
          morphemes.push(match);
        }
      }
    }
  }
  
  console.log(`Extracted morphemes:`, morphemes.slice(0, 20)); // First 20 for debugging
  return morphemes;
}

// 지능적 복합어 분해 함수 (한국어 + 영어 + 숫자 혼합 지원)
function intelligentKoreanDecomposer(text: string): string[] {
  console.log(`=== Intelligent decomposing: "${text}" ===`);
  
  // 1단계: 핵심 단어 사전
  const coreWords = [
    // 한국어 2글자 핵심 명사
    '자동', '전기', '수학', '영어', '국어', '과학', '물리', '화학', '생물', '역사', '사회',
    '학원', '과외', '교육', '학습', '공부', '시험', '성적', '입시', '수능', 
    '엔진', '타이어', '브레이크', '배터리', '에어컨', '필터', '센서', '부품',
    '냉각', '오일', '교체', '점검', '수리', '정비', '시기', '방법', '가격',
    '비용', '추천', '후기', '리뷰', '정보', '소식', '뉴스', '서비스', '업체',
    '회사', '전문', '맞춤', '개인', '온라인', '화상', '대면', '코딩', '개발',
    '시스템', '데이터', '머신', '딥러닝', '빅데이터',
    
    // 한국어 3글자 핵심 명사  
    '오토바이', '하이브리드', '친환경', '경고등', '웹사이트', '홈페이지', '커뮤니티',
    '프로그래밍', '소프트웨어', '데이터베이스', '인공지능',
    
    // 한국어 4글자 이상 핵심 명사
    '지구과학',
    
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

// Extract individual keyword components for SEO optimization
export function extractKeywordComponents(keyword: string): string[] {
  const components = [];
  
  // 지능적 분해 시스템을 우선 적용 (기존 패턴 매칭 대체)
  console.log(`=== Starting keyword decomposition for: "${keyword}" ===`);
  
  // 전체 키워드를 지능적으로 분해 (한영숫자 혼합 지원)
  const decomposed = intelligentKoreanDecomposer(keyword);
  console.log(`Intelligent decomposition result: [${decomposed.join(', ')}]`);
  
  for (const comp of decomposed) {
    if (!components.includes(comp) && comp.length >= 1) {
      components.push(comp);
    }
  }
  
  console.log(`Keyword components extracted from "${keyword}":`, components);
  return components;
}

// Find complete keyword matches - 완전한 키워드의 정확한 출현만 카운트
export function findCompleteKeywordMatches(morphemes: string[], keyword: string): string[] {
  const matches: string[] = [];
  const lowerKeyword = keyword.toLowerCase();
  
  console.log(`Looking for complete keyword: "${keyword}"`);
  
  for (const morpheme of morphemes) {
    const lowerMorpheme = morpheme.toLowerCase();
    
    // 완전한 키워드 자체 또는 조사가 붙은 형태만 인정 (예: 벤츠엔진경고등, 벤츠엔진경고등에, 벤츠엔진경고등을)
    if (lowerMorpheme === lowerKeyword || 
        (lowerMorpheme.startsWith(lowerKeyword) && 
         lowerMorpheme.length <= lowerKeyword.length + 2)) { // 조사 최대 2글자
      matches.push(morpheme);
      console.log(`✓ Complete keyword match: "${morpheme}"`);
    }
  }
  
  console.log(`Total complete keyword matches found: ${matches.length}`);
  return matches;
}

// Find individual keyword component matches (for 15-17 occurrences each)
export function findKeywordComponentMatches(morphemes: string[], keyword: string): Map<string, string[]> {
  const keywordComponents = extractKeywordComponents(keyword);
  const componentMatches = new Map<string, string[]>();
  
  console.log(`Target keyword components:`, keywordComponents);
  console.log(`Sample content morphemes:`, morphemes.slice(0, 30));
  
  for (const component of keywordComponents) {
    const matches: string[] = [];
    const lowerComponent = component.toLowerCase();
    
    for (const morpheme of morphemes) {
      const lowerMorpheme = morpheme.toLowerCase();
      
      // Component matching - includes occurrences within compound words
      let isMatch = false;
      
      if (lowerComponent === 'bmw') {
        // Exact BMW matches including variations
        isMatch = lowerMorpheme === 'bmw' || lowerMorpheme === 'BMW' || lowerMorpheme === 'Bmw';
      } else if (lowerComponent === '코딩') {
        // Korean coding-related terms
        isMatch = lowerMorpheme === '코딩' || lowerMorpheme === '튜닝' || lowerMorpheme === '프로그래밍' || lowerMorpheme === '설정';
      } else if (lowerComponent === '벤츠') {
        // 벤츠 matches including compound words like 벤츠엔진경고등
        isMatch = lowerMorpheme.includes('벤츠');
      } else if (lowerComponent === '엔진') {
        // 엔진 matches including compound words like 벤츠엔진경고등
        isMatch = lowerMorpheme.includes('엔진');
      } else if (lowerComponent === '경고') {
        // 경고 matches including compound words and variations
        isMatch = lowerMorpheme.includes('경고');
      } else if (lowerComponent === '10w40') {
        // Oil grade matches including variations
        isMatch = lowerMorpheme === '10w40' || lowerMorpheme.includes('10w40');
      } else if (lowerComponent === '오일') {
        // 오일 matches including compound words like 엔진오일
        isMatch = lowerMorpheme.includes('오일');
      } else if (lowerComponent === '영어') {
        // 영어 matches including compound words like 영어학원블로그
        isMatch = lowerMorpheme.includes('영어');
      } else if (lowerComponent === '학원') {
        // 학원 matches including compound words like 영어학원블로그
        isMatch = lowerMorpheme.includes('학원');
      } else if (lowerComponent === '블로그') {
        // 블로그 matches including compound words like 영어학원블로그
        isMatch = lowerMorpheme.includes('블로그');
      } else if (lowerComponent === '전기') {
        // 전기 matches including compound words like 전기오토바이
        isMatch = lowerMorpheme.includes('전기');
      } else if (lowerComponent === '오토바이') {
        // 오토바이 matches including compound words like 전기오토바이
        isMatch = lowerMorpheme.includes('오토바이');
      } else if (lowerComponent === '냉각수') {
        // 냉각수 matches including compound words like 냉각수첨가제
        isMatch = lowerMorpheme.includes('냉각수');
      } else if (lowerComponent === '첨가제') {
        // 첨가제 matches including compound words like 냉각수첨가제
        isMatch = lowerMorpheme.includes('첨가제');
      } else if (lowerComponent === '자동차') {
        // 자동차 matches including compound words like 자동차부품
        isMatch = lowerMorpheme.includes('자동차');
      } else if (lowerComponent === '부품') {
        // 부품 matches including compound words like 자동차부품
        isMatch = lowerMorpheme.includes('부품');
      } else if (lowerComponent === '타이어') {
        // 타이어 matches including compound words like 타이어교체시기
        isMatch = lowerMorpheme.includes('타이어');
      } else if (lowerComponent === '교체') {
        // 교체 matches including compound words like 타이어교체시기, 엔진오일교체
        isMatch = lowerMorpheme.includes('교체');
      } else if (lowerComponent === '시기') {
        // 시기 matches including compound words like 타이어교체시기
        isMatch = lowerMorpheme.includes('시기');
      } else if (lowerComponent === '브레이크') {
        // 브레이크 matches including compound words like 브레이크패드교체
        isMatch = lowerMorpheme.includes('브레이크');
      } else if (lowerComponent === '패드') {
        // 패드 matches including compound words like 브레이크패드교체
        isMatch = lowerMorpheme.includes('패드');
      } else if (lowerComponent === '에어컨') {
        // 에어컨 matches including compound words like 에어컨필터교체
        isMatch = lowerMorpheme.includes('에어컨');
      } else if (lowerComponent === '필터') {
        // 필터 matches including compound words like 에어컨필터교체
        isMatch = lowerMorpheme.includes('필터');
      } else if (lowerComponent === '배터리') {
        // 배터리 matches including compound words like 배터리점검
        isMatch = lowerMorpheme.includes('배터리');
      } else if (lowerComponent === '점검') {
        // 점검 matches including compound words like 배터리점검
        isMatch = lowerMorpheme.includes('점검');
      } else if (lowerComponent === '하이브리드') {
        // 하이브리드 matches including compound words like 하이브리드차량
        isMatch = lowerMorpheme.includes('하이브리드');
      } else if (lowerComponent === '차량') {
        // 차량 matches including compound words like 하이브리드차량
        isMatch = lowerMorpheme.includes('차량');
      } else if (lowerComponent === '친환경') {
        // 친환경 matches including compound words like 친환경자동차
        isMatch = lowerMorpheme.includes('친환경');
      } else {
        // Generic matching for other components
        isMatch = lowerMorpheme === lowerComponent || lowerMorpheme.includes(lowerComponent);
      }
      
      if (isMatch) {
        matches.push(morpheme);
        console.log(`✓ Component match: "${morpheme}" contains "${component}"`);
      }
    }
    
    componentMatches.set(component, matches);
    console.log(`"${component}" appears ${matches.length} times`);
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

export function analyzeMorphemes(content: string, keyword: string, customMorphemes?: string): MorphemeAnalysis {
  console.log(`=== Morpheme Analysis for keyword: "${keyword}" ===`);
  
  // Extract all morphemes from content
  const allMorphemes = extractKoreanMorphemes(content);
  console.log(`Total morphemes extracted: ${allMorphemes.length}`);
  
  // Calculate character count (excluding spaces)
  const characterCount = content.replace(/\s/g, '').length;
  
  // Find complete keyword matches (minimum 5 required)
  const completeKeywordMatches = findCompleteKeywordMatches(allMorphemes, keyword);
  const completeKeywordCount = completeKeywordMatches.length;
  
  // Find individual component matches (15-17 required each)
  const componentMatches = findKeywordComponentMatches(allMorphemes, keyword);
  const keywordComponents = extractKeywordComponents(keyword);
  
  // Check complete keyword condition (5-7 times)
  const isCompleteKeywordOptimized = completeKeywordCount >= 5 && completeKeywordCount <= 7;
  
  // Check individual component conditions (15-17 times each)
  let areComponentsOptimized = true;
  const componentIssues: string[] = [];
  
  console.log(`Complete keyword "${keyword}" appears: ${completeKeywordCount} times (5-7 times required)`);
  
  for (const component of keywordComponents) {
    const matches = componentMatches.get(component) || [];
    const count = matches.length;
    
    if (count < 15 || count > 17) {
      areComponentsOptimized = false;
      if (count < 15) {
        componentIssues.push(`${component}: ${count}회 (부족, 15-17회 필요)`);
      } else {
        componentIssues.push(`${component}: ${count}회 (과다, 15-17회 필요)`);
      }
    }
  }
  
  // Check length condition (1500-1700 characters excluding spaces)
  const isLengthOptimized = characterCount >= 1500 && characterCount <= 1700;
  
  // Overall keyword optimization status
  const isKeywordOptimized = isCompleteKeywordOptimized && areComponentsOptimized;
  
  // Check custom morphemes
  const customMorphemeCheck = checkCustomMorphemes(content, customMorphemes);
  const isCustomMorphemesOptimized = customMorphemeCheck.missing.length === 0;
  
  // Overall optimization status
  const isOptimized = isKeywordOptimized && isLengthOptimized && isCustomMorphemesOptimized;
  
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
    suggestions.push(`키워드 구성 요소들(${keywordComponents.join(', ')})을 각각 15-17회씩 사용해주세요`);
  }
  
  if (!isLengthOptimized) {
    if (characterCount < 1500) {
      issues.push(`글자수 부족: ${characterCount}자 (1500-1700자 필요)`);
      suggestions.push(`내용을 추가하여 1500자 이상으로 늘려주세요`);
    } else if (characterCount > 1700) {
      issues.push(`글자수 초과: ${characterCount}자 (1500-1700자 필요)`);
      suggestions.push(`내용을 줄여서 1700자 이하로 맞춰주세요`);
    }
  }
  
  if (!isCustomMorphemesOptimized && customMorphemes) {
    issues.push(`누락된 필수 형태소: ${customMorphemeCheck.missing.join(', ')}`);
    suggestions.push(`다음 단어들을 글에 포함해주세요: ${customMorphemeCheck.missing.join(', ')}`);
  }

  return {
    isOptimized,
    isKeywordOptimized,
    isLengthOptimized,
    keywordMorphemeCount: completeKeywordCount,
    characterCount,
    targetCharacterRange: '1500-1700자',
    issues,
    suggestions,
    customMorphemes: customMorphemeCheck,
    isCustomMorphemesOptimized
  };
}

// Enhanced SEO analysis combining morpheme analysis with basic metrics
export function enhancedSEOAnalysis(content: string, keyword: string) {
  const morphemeAnalysis = analyzeMorphemes(content, keyword);
  
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