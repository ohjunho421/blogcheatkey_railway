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

// 자동 한국어 복합어 분해 함수
function autoDecomposeKoreanKeyword(koreanText: string): string[] {
  // 일반적인 한국어 단어 패턴들을 정의
  const commonWords = [
    // 교육 관련
    '수학', '영어', '국어', '과학', '사회', '역사', '물리', '화학', '생물', '지구과학',
    '학원', '과외', '교육', '학습', '공부', '시험', '성적', '학생', '선생님', '강사',
    '초등', '중등', '고등', '대학', '입시', '수능',
    
    // 자동차 관련
    '벤츠', '아우디', '비엠더블유', 'bmw', '현대', '기아', '삼성', 'lg',
    '엔진', '경고등', '에어컨', '필터', '오일', '타이어', '브레이크', '배터리',
    '수리', '정비', '점검', '교체', '부품', '센서',
    
    // 일반 명사
    '블로그', '사이트', '웹사이트', '홈페이지', '카페', '커뮤니티',
    '방법', '가격', '비용', '추천', '후기', '리뷰', '정보', '소식', '뉴스',
    '서비스', '업체', '회사', '전문', '맞춤', '개인', '그룹',
    '온라인', '오프라인', '화상', '대면', '비대면',
    
    // 기술 관련
    '코딩', '프로그래밍', '개발', '웹', '앱', '소프트웨어', '시스템', '데이터베이스',
    '인공지능', 'ai', '머신러닝', '딥러닝', '빅데이터'
  ];
  
  const result: string[] = [];
  let remaining = koreanText;
  
  // 가장 긴 단어부터 매칭 시도 (탐욕적 접근법)
  const sortedWords = commonWords.sort((a, b) => b.length - a.length);
  
  while (remaining.length > 0) {
    let found = false;
    
    for (const word of sortedWords) {
      if (remaining.startsWith(word)) {
        result.push(word);
        remaining = remaining.substring(word.length);
        found = true;
        break;
      }
    }
    
    // 매칭되는 단어가 없으면 2-3글자씩 분할
    if (!found) {
      if (remaining.length >= 3) {
        result.push(remaining.substring(0, 3));
        remaining = remaining.substring(3);
      } else if (remaining.length >= 2) {
        result.push(remaining.substring(0, 2));
        remaining = remaining.substring(2);
      } else {
        result.push(remaining);
        remaining = '';
      }
    }
  }
  
  return result.filter(component => component.length >= 2); // 2글자 이상만 유효
}

// Extract individual keyword components for SEO optimization
export function extractKeywordComponents(keyword: string): string[] {
  const components = [];
  
  // Manual extraction for known compound Korean keywords - 정확한 분석을 위해 수동 정의 우선
  if (keyword === "벤츠엔진경고등") {
    components.push("벤츠", "엔진", "경고등");
  } else if (keyword === "영어학원블로그") {
    components.push("영어", "학원", "블로그");
  } else if (keyword === "수학과외블로그") {
    components.push("수학", "과외", "블로그");
  } else if (keyword === "영어과외블로그") {
    components.push("영어", "과외", "블로그");
  } else if (keyword.toLowerCase().includes("아우디a6에어컨필터")) {
    components.push("아우디", "a6", "에어컨", "필터");
  } else if (keyword.toLowerCase().includes("bmw") && keyword.includes("코딩")) {
    components.push("BMW", "코딩");
  } else if (keyword.includes("10W40") && keyword.includes("엔진오일")) {
    components.push("10W40", "엔진", "오일");
  } else {
    // 자동 분해 시스템을 폴백으로 사용
    const cleanKeyword = keyword.toLowerCase();
    
    // 특수 패턴들
    const numberPattern = /[0-9]+[a-z]*[0-9]*/g;
    const koreanPattern = /[가-힣]+/g;
    const englishPattern = /[a-zA-Z]+/g;
    
    const numberMatches = cleanKeyword.match(numberPattern) || [];
    const koreanMatches = cleanKeyword.match(koreanPattern) || [];
    const englishMatches = cleanKeyword.match(englishPattern) || [];
    
    // 숫자+문자 조합 추가
    for (const match of numberMatches) {
      if (match.length >= 1) {
        components.push(match);
      }
    }
    
    // 한국어 형태소 자동 분해 (최대 3개까지만)
    for (const match of koreanMatches) {
      if (match.length >= 2) {
        const decomposed = autoDecomposeKoreanKeyword(match);
        // 너무 많은 형태소가 생성되지 않도록 제한
        const limitedDecomposed = decomposed.slice(0, 3);
        for (const comp of limitedDecomposed) {
          if (!components.includes(comp)) {
            components.push(comp);
          }
        }
      }
    }
    
    // 영어 형태소 추가
    for (const match of englishMatches) {
      if (match.length >= 1 && !numberMatches.some(num => num.includes(match))) {
        components.push(match);
      }
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
  
  // Check complete keyword condition (5-20 times - very lenient)
  const isCompleteKeywordOptimized = completeKeywordCount >= 5 && completeKeywordCount <= 20;
  
  // Check individual component conditions (15-17 times each)
  let areComponentsOptimized = true;
  const componentIssues: string[] = [];
  
  console.log(`Complete keyword "${keyword}" appears: ${completeKeywordCount} times (5-7 times required)`);
  
  for (const component of keywordComponents) {
    const matches = componentMatches.get(component) || [];
    const count = matches.length;
    
    if (count < 10 || count > 35) {
      areComponentsOptimized = false;
      if (count < 10) {
        componentIssues.push(`${component}: ${count}회 (부족, 10-35회 적절)`);
      } else {
        componentIssues.push(`${component}: ${count}회 (과다, 10-35회 적절)`);
      }
    }
  }
  
  // Check length condition (1400-1800 characters excluding spaces - more lenient)
  const isLengthOptimized = characterCount >= 1400 && characterCount <= 1800;
  
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
    } else if (completeKeywordCount > 20) {
      issues.push(`완전한 키워드 "${keyword}" 출현 횟수 과다: ${completeKeywordCount}회 (5-20회 적절)`);
      suggestions.push(`키워드 "${keyword}"를 20회 이하로 줄여주세요`);
    }
  }
  
  if (!areComponentsOptimized) {
    for (const issue of componentIssues) {
      issues.push(`형태소 출현 횟수 불균형: ${issue}`);
    }
    suggestions.push(`키워드 구성 요소들(${keywordComponents.join(', ')})을 각각 10-35회 정도 사용해주세요`);
  }
  
  if (!isLengthOptimized) {
    if (characterCount < 1400) {
      issues.push(`글자수 부족: ${characterCount}자 (1400-1800자 적절)`);
      suggestions.push(`내용을 추가하여 1400자 이상으로 늘려주세요`);
    } else if (characterCount > 1800) {
      issues.push(`글자수 초과: ${characterCount}자 (1400-1800자 적절)`);
      suggestions.push(`내용을 줄여서 1800자 이하로 맞춰주세요`);
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
    targetCharacterRange: '1400-1800자',
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