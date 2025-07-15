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
  const keywordMorphemes = extractKoreanMorphemes(keyword);
  const foundMorphemes: string[] = [];
  
  for (const morpheme of morphemes) {
    for (const keywordMorpheme of keywordMorphemes) {
      // Exact match
      if (morpheme === keywordMorpheme) {
        foundMorphemes.push(morpheme);
      }
      // Partial match for compound words
      else if (morpheme.includes(keywordMorpheme) || keywordMorpheme.includes(morpheme)) {
        if (morpheme.length >= 2 && keywordMorpheme.length >= 2) {
          foundMorphemes.push(morpheme);
        }
      }
    }
  }
  
  return foundMorphemes;
}

export function analyzeMorphemes(content: string, keyword: string): MorphemeAnalysis {
  // Extract all morphemes from content
  const allMorphemes = extractKoreanMorphemes(content);
  
  // Find keyword-related morphemes
  const keywordMorphemes = findKeywordMorphemes(allMorphemes, keyword);
  
  // Calculate character count (excluding spaces)
  const characterCount = content.replace(/\s/g, '').length;
  
  // SEO optimization criteria
  const keywordMorphemeCount = keywordMorphemes.length;
  const isKeywordOptimized = keywordMorphemeCount >= 17 && keywordMorphemeCount <= 20;
  const isLengthOptimized = characterCount >= 1700 && characterCount <= 2000;
  const isOptimized = isKeywordOptimized && isLengthOptimized;
  
  // Generate issues and suggestions
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  if (!isKeywordOptimized) {
    if (keywordMorphemeCount < 17) {
      issues.push(`키워드 형태소 출현 횟수가 부족합니다 (${keywordMorphemeCount}/17-20)`);
      suggestions.push('키워드 관련 표현을 더 추가하여 17-20회 범위로 맞춰주세요');
    } else if (keywordMorphemeCount > 20) {
      issues.push(`키워드 형태소 출현 횟수가 과도합니다 (${keywordMorphemeCount}/17-20)`);
      suggestions.push('키워드 사용을 줄여서 자연스러운 글로 만들어주세요');
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
    suggestions
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