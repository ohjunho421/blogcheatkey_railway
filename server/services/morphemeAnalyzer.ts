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
  customMorphemesUsed: string[];
  customMorphemesMissing: string[];
}

// Enhanced Korean morpheme extraction with improved accuracy
function extractKoreanMorphemes(text: string): string[] {
  const morphemes: string[] = [];
  
  // Split by punctuation and whitespace, but preserve meaningful word boundaries
  const segments = text.split(/[\s\n\r\t,.!?;:()[\]{}"'`~]+/).filter(s => s.length > 0);
  
  for (const segment of segments) {
    if (segment.trim().length === 0) continue;
    
    // Enhanced pattern to separate English/numbers from Korean
    // This handles cases like "BMW코딩" -> ["BMW", "코딩"]
    const parts = segment.match(/([A-Za-z]+\d*|\d+[A-Za-z]*|[\uAC00-\uD7AF]+|[^\s\uAC00-\uD7AFA-Za-z\d]+)/g) || [segment];
    
    for (const part of parts) {
      if (part.length > 0 && /[A-Za-z가-힣\d]/.test(part)) {
        morphemes.push(part);
      }
    }
  }
  
  console.log(`Extracted morphemes:`, morphemes.slice(0, 20)); // First 20 for debugging
  return morphemes;
}

// Enhanced keyword morpheme matching with precise recognition
function findKeywordMorphemes(morphemes: string[], keyword: string): string[] {
  const keywordMorphemes = extractKoreanMorphemes(keyword.toLowerCase());
  const foundMorphemes: string[] = [];
  
  console.log(`Looking for keyword morphemes:`, keywordMorphemes);
  console.log(`Sample content morphemes:`, morphemes.slice(0, 30));
  
  for (const morpheme of morphemes) {
    const lowerMorpheme = morpheme.toLowerCase();
    
    for (const keywordMorpheme of keywordMorphemes) {
      const lowerKeywordMorpheme = keywordMorpheme.toLowerCase();
      
      // Exact match (case insensitive)
      if (lowerMorpheme === lowerKeywordMorpheme) {
        foundMorphemes.push(morpheme);
        console.log(`✓ Exact match: "${morpheme}" === "${keywordMorpheme}"`);
      }
      // BMW specific handling - various cases
      else if (lowerKeywordMorpheme === 'bmw' && 
               (lowerMorpheme === 'bmw' || lowerMorpheme === 'BMW' || lowerMorpheme === 'Bmw')) {
        foundMorphemes.push(morpheme);
        console.log(`✓ BMW match: "${morpheme}"`);
      }
      // 코딩 specific handling - include related terms
      else if (lowerKeywordMorpheme === '코딩' && 
               (lowerMorpheme === '코딩' || lowerMorpheme === '튜닝' || lowerMorpheme === '프로그래밍' || lowerMorpheme === '설정')) {
        foundMorphemes.push(morpheme);
        console.log(`✓ Coding match: "${morpheme}"`);
      }
    }
  }
  
  console.log(`Total keyword morphemes found: ${foundMorphemes.length}`);
  return foundMorphemes;
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
  
  // Extract keyword morphemes first to understand what we're looking for
  const keywordMorphemeTypes = extractKoreanMorphemes(keyword.toLowerCase());
  console.log(`Target keyword morphemes:`, keywordMorphemeTypes);
  
  // Extract all morphemes from content
  const allMorphemes = extractKoreanMorphemes(content);
  console.log(`Total morphemes extracted: ${allMorphemes.length}`);
  
  // Find keyword-related morphemes
  const keywordMorphemes = findKeywordMorphemes(allMorphemes, keyword);
  console.log(`Found keyword morphemes: ${keywordMorphemes.length}`);
  
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
  let isKeywordOptimized = true;
  const morphemeIssues: string[] = [];
  
  console.log(`Keyword morpheme counts:`, Object.fromEntries(keywordMorphemeCounts));
  
  for (const morphemeType of keywordMorphemeTypes) {
    const count = keywordMorphemeCounts.get(morphemeType.toLowerCase()) || 0;
    console.log(`"${morphemeType}" appears ${count} times`);
    if (count < 15 || count > 17) {
      isKeywordOptimized = false;
      morphemeIssues.push(`"${morphemeType}": ${count}회 (목표: 15-17회)`);
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
  const isLengthOptimized = characterCount >= 1700 && characterCount <= 1800;
  
  // Check custom morphemes
  const customMorphemeCheck = checkCustomMorphemes(content, customMorphemes);
  const isCustomMorphemesOptimized = customMorphemeCheck.missing.length === 0;
  
  const isOptimized = isKeywordOptimized && isLengthOptimized && isCustomMorphemesOptimized;
  
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
      issues.push(`글자수가 부족합니다 (${characterCount}/1700-1800자)`);
      suggestions.push('내용을 더 자세히 설명하여 글자수를 늘려주세요');
    } else if (characterCount > 1800) {
      issues.push(`글자수가 과도합니다 (${characterCount}/1700-1800자)`);
      suggestions.push('불필요한 내용을 줄여서 간결하게 만들어주세요');
    }
  }
  
  // Check custom morphemes
  if (!isCustomMorphemesOptimized && customMorphemeCheck.missing.length > 0) {
    issues.push(`추가 형태소 누락: ${customMorphemeCheck.missing.join(', ')}`);
    suggestions.push(`다음 추가 형태소들을 글에 포함하세요: ${customMorphemeCheck.missing.join(', ')}`);
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
    morphemeCounts: Object.fromEntries(allMorphemeCounts),
    customMorphemesUsed: customMorphemeCheck.used,
    customMorphemesMissing: customMorphemeCheck.missing
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