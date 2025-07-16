// Korean morpheme analysis service
// Using simple regex-based approach for Korean morpheme analysis

interface MorphemeAnalysis {
  keywordMorphemes: string[];
  totalMorphemeCount: number;
  keywordMorphemeCount: number;
  characterCount: number;
  isOptimized: boolean;
  issues: string[];
  suggestions: string[];
  morphemeCounts: Record<string, number>;
}

// Simple Korean morpheme extraction using common patterns
function extractKoreanMorphemes(text: string): string[] {
  // Remove punctuation and special characters
  const cleanText = text.replace(/[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF\s]/g, ' ');
  
  // Split by whitespace and filter out empty strings
  const words = cleanText.split(/\s+/).filter(word => word.length > 0);
  
  const morphemes: string[] = [];
  
  for (const word of words) {
    // For Korean, we'll treat each character cluster as a potential morpheme
    // This is a simplified approach - a proper morpheme analyzer would be more accurate
    if (word.length === 1) {
      morphemes.push(word);
    } else {
      // Break down compound words into potential morphemes
      // For BMW코딩 -> ['BMW', '코딩']
      const parts = word.match(/([A-Za-z]+|[\uAC00-\uD7AF]+)/g) || [word];
      morphemes.push(...parts);
    }
  }
  
  return morphemes;
}

// More sophisticated Korean morpheme matching
function findKeywordMorphemes(morphemes: string[], keyword: string): string[] {
  const keywordMorphemes = extractKoreanMorphemes(keyword.toLowerCase());
  const foundMorphemes: string[] = [];
  
  // console.log('Keyword morphemes:', keywordMorphemes);
  // console.log('All morphemes:', morphemes);
  
  for (const morpheme of morphemes) {
    const lowerMorpheme = morpheme.toLowerCase();
    
    for (const keywordMorpheme of keywordMorphemes) {
      const lowerKeywordMorpheme = keywordMorpheme.toLowerCase();
      
      // Exact match (case insensitive)
      if (lowerMorpheme === lowerKeywordMorpheme) {
        foundMorphemes.push(morpheme);
        // console.log('Exact match found:', morpheme, '===', keywordMorpheme);
      }
      // BMW 케이스 처리 - bmw, BMW 모두 인식
      else if (lowerMorpheme === 'bmw' && lowerKeywordMorpheme === 'bmw') {
        foundMorphemes.push(morpheme);
        // console.log('BMW match found:', morpheme);
      }
      // 코딩 관련 용어들 인식
      else if (lowerKeywordMorpheme === '코딩' && 
               (lowerMorpheme === '코딩' || lowerMorpheme === '튜닝' || lowerMorpheme === '프로그래밍')) {
        foundMorphemes.push(morpheme);
        // console.log('Coding related match found:', morpheme);
      }
      // 부분 매칭 - 긴 단어에 키워드가 포함된 경우
      else if (lowerMorpheme.includes(lowerKeywordMorpheme) && keywordMorpheme.length >= 2) {
        foundMorphemes.push(morpheme);
        // console.log('Partial match found:', morpheme, 'contains', keywordMorpheme);
      }
      // 키워드에 형태소가 포함된 경우 (bmw코딩에서 bmw, 코딩 추출)
      else if (lowerKeywordMorpheme.includes(lowerMorpheme) && morpheme.length >= 2) {
        foundMorphemes.push(morpheme);
        // console.log('Reverse partial match found:', keywordMorpheme, 'contains', morpheme);
      }
    }
  }
  
  // console.log('Total found morphemes:', foundMorphemes.length);
  return foundMorphemes;
}

export function analyzeMorphemes(content: string, keyword: string): MorphemeAnalysis {
  // Extract all morphemes from content
  const allMorphemes = extractKoreanMorphemes(content);
  
  // Find keyword-related morphemes
  const keywordMorphemes = findKeywordMorphemes(allMorphemes, keyword);
  
  // Calculate character count (excluding spaces)
  const characterCount = content.replace(/\s/g, '').length;
  
  // Count ALL morphemes in the content, not just keyword ones
  const allMorphemeCounts = new Map<string, number>();
  for (const morpheme of allMorphemes) {
    const key = morpheme.toLowerCase();
    allMorphemeCounts.set(key, (allMorphemeCounts.get(key) || 0) + 1);
  }
  
  // Count keyword morphemes separately
  const keywordMorphemeCounts = new Map<string, number>();
  for (const morpheme of keywordMorphemes) {
    const key = morpheme.toLowerCase();
    keywordMorphemeCounts.set(key, (keywordMorphemeCounts.get(key) || 0) + 1);
  }
  
  // Check if each keyword morpheme appears 17-20 times
  const keywordMorphemeTypes = extractKoreanMorphemes(keyword.toLowerCase());
  let isKeywordOptimized = true;
  const morphemeIssues: string[] = [];
  
  for (const morphemeType of keywordMorphemeTypes) {
    const count = keywordMorphemeCounts.get(morphemeType.toLowerCase()) || 0;
    if (count < 17 || count > 20) {
      isKeywordOptimized = false;
      morphemeIssues.push(`"${morphemeType}": ${count}회 (목표: 17-20회)`);
    }
  }
  
  // Check if keyword morphemes are the most frequent
  const minKeywordCount = Math.min(...keywordMorphemeTypes.map(type => 
    keywordMorphemeCounts.get(type.toLowerCase()) || 0
  ));
  
  const problematicMorphemes: string[] = [];
  const commonParticles = ['이', '가', '을', '를', '의', '에', '는', '은', '로', '과', '와', '도', '만', '부터', '까지', '에서', '으로', '하는', '하고', '하며', '되는', '것', '수', '때', '등', '또한', '그리고', '하지만', '그런데', '따라서', '그래서', '있는', '있다', '한다', '합니다', '입니다', '때문에', '대해', '대한', '같은', '이런', '그런', '어떤', '많은', '다른', '새로운', '좋은', '나은', '더욱', '매우', '정말', '항상', '모든', '각각', '통해', '위해', '위한', '아니라', '아닌', '아니'];
  
  for (const [morpheme, count] of allMorphemeCounts) {
    // Skip if it's a keyword morpheme
    if (keywordMorphemeTypes.some(type => type.toLowerCase() === morpheme)) continue;
    
    // Skip single characters and common particles
    if (morpheme.length <= 1 || commonParticles.includes(morpheme)) continue;
    
    if (count > minKeywordCount) {
      problematicMorphemes.push(`${morpheme}(${count}회)`);
      isKeywordOptimized = false;
    }
  }
  
  const keywordMorphemeCount = keywordMorphemes.length;
  const isLengthOptimized = characterCount >= 1700 && characterCount <= 2000;
  const isOptimized = isKeywordOptimized && isLengthOptimized;
  
  // Generate issues and suggestions
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  if (!isKeywordOptimized) {
    for (const issue of morphemeIssues) {
      issues.push(`형태소 출현 횟수 불균형: ${issue}`);
    }
    
    if (problematicMorphemes.length > 0) {
      issues.push(`키워드 형태소보다 많이 출현하는 단어들: ${problematicMorphemes.join(', ')}`);
    }
    
    // Generate specific suggestions for each morpheme
    for (const morphemeType of keywordMorphemeTypes) {
      const count = keywordMorphemeCounts.get(morphemeType.toLowerCase()) || 0;
      if (count < 17) {
        suggestions.push(`"${morphemeType}" 형태소를 ${17 - count}회 더 추가하세요`);
      } else if (count > 20) {
        suggestions.push(`"${morphemeType}" 형태소를 ${count - 20}회 줄이세요 (동의어 대체 또는 문장 제거)`);
      }
    }
    
    if (problematicMorphemes.length > 0) {
      suggestions.push('키워드 형태소가 가장 많이 출현하도록 다른 단어들의 빈도를 줄이고 키워드 형태소를 더 추가하세요');
    }
  }
  
  if (!isLengthOptimized) {
    if (characterCount < 1700) {
      issues.push(`글자수가 부족합니다 (${characterCount}/1700-2000자)`);
      suggestions.push('내용을 더 자세히 설명하여 글자수를 늘려주세요');
    } else if (characterCount > 2000) {
      issues.push(`글자수가 과도합니다 (${characterCount}/1700-2000자)`);
      suggestions.push('불필요한 내용을 줄여서 간결하게 만들어주세요');
    }
  }
  
  if (isOptimized) {
    suggestions.push('SEO 최적화가 잘 되어 있습니다!');
  }
  
  return {
    keywordMorphemes,
    totalMorphemeCount: allMorphemes.length,
    keywordMorphemeCount,
    characterCount,
    isOptimized,
    issues,
    suggestions,
    morphemeCounts: Object.fromEntries(allMorphemeCounts)
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
    keywordMorphemes: morphemeAnalysis.keywordMorphemes,
    totalMorphemeCount: morphemeAnalysis.totalMorphemeCount
  };
}