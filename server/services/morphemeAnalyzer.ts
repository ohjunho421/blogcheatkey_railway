import { MorphemeAnalysis } from '../../shared/types';

// Simple Korean morpheme extraction function
function extractKoreanMorphemes(text: string): string[] {
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

// Extract individual keyword components for SEO optimization
function extractKeywordComponents(keyword: string): string[] {
  const components = [];
  
  // Manual extraction for compound Korean keywords
  if (keyword === "벤츠엔진경고등") {
    components.push("벤츠", "엔진", "경고");
  } else if (keyword.toLowerCase().includes("bmw") && keyword.includes("코딩")) {
    components.push("BMW", "코딩");
  } else {
    // Fallback: try to extract individual meaningful components
    const koreanPattern = /[가-힣]+/g;
    const englishPattern = /[a-zA-Z]+/g;
    
    const koreanMatches = keyword.match(koreanPattern) || [];
    const englishMatches = keyword.match(englishPattern) || [];
    
    // Add individual Korean components
    for (const match of koreanMatches) {
      if (match.length >= 2) {
        components.push(match);
      }
    }
    
    // Add individual English components  
    for (const match of englishMatches) {
      if (match.length >= 2) {
        components.push(match);
      }
    }
  }
  
  console.log(`Keyword components extracted from "${keyword}":`, components);
  return components;
}

// Find complete keyword matches (for minimum 5 occurrences)
function findCompleteKeywordMatches(morphemes: string[], keyword: string): string[] {
  const foundMatches: string[] = [];
  const lowerKeyword = keyword.toLowerCase();
  
  console.log(`Looking for complete keyword: "${keyword}"`);
  
  for (const morpheme of morphemes) {
    const lowerMorpheme = morpheme.toLowerCase();
    
    // Exact match or with suffix (벤츠엔진경고등이, 벤츠엔진경고등을 etc.)
    if (lowerMorpheme === lowerKeyword || lowerMorpheme.startsWith(lowerKeyword)) {
      foundMatches.push(morpheme);
      console.log(`✓ Complete keyword match: "${morpheme}"`);
    }
  }
  
  console.log(`Total complete keyword matches found: ${foundMatches.length}`);
  return foundMatches;
}

// Find individual keyword component matches (for 15-17 occurrences each)
function findKeywordComponentMatches(morphemes: string[], keyword: string): Map<string, string[]> {
  const keywordComponents = extractKeywordComponents(keyword);
  const componentMatches = new Map<string, string[]>();
  
  console.log(`Target keyword components:`, keywordComponents);
  console.log(`Sample content morphemes:`, morphemes.slice(0, 30));
  
  for (const component of keywordComponents) {
    const matches: string[] = [];
    const lowerComponent = component.toLowerCase();
    
    for (const morpheme of morphemes) {
      const lowerMorpheme = morpheme.toLowerCase();
      
      // Exact component match or with suffix
      if (lowerMorpheme === lowerComponent || 
          lowerMorpheme.includes(lowerComponent) ||
          (lowerComponent === 'bmw' && (lowerMorpheme === 'bmw' || lowerMorpheme === 'BMW' || lowerMorpheme === 'Bmw')) ||
          (lowerComponent === '코딩' && (lowerMorpheme === '코딩' || lowerMorpheme === '튜닝' || lowerMorpheme === '프로그래밍' || lowerMorpheme === '설정'))) {
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
  
  // Check complete keyword condition (minimum 5 times)
  const isCompleteKeywordOptimized = completeKeywordCount >= 5;
  
  // Check individual component conditions (15-17 times each)
  let areComponentsOptimized = true;
  const componentIssues: string[] = [];
  
  console.log(`Complete keyword "${keyword}" appears: ${completeKeywordCount} times (minimum 5 required)`);
  
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
    issues.push(`완전한 키워드 "${keyword}" 출현 횟수 부족: ${completeKeywordCount}회 (최소 5회 필요)`);
    suggestions.push(`키워드 "${keyword}"를 최소 5회는 사용해주세요`);
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