import { ReferenceBlogLink } from "@shared/schema";

interface BlogAnalysis {
  tone: string;
  hookMethod: string;
  storytellingApproach: string;
  ctaStyle: string;
  keyPhrases: string[];
}

export async function fetchAndAnalyzeBlogContent(links: ReferenceBlogLink[]): Promise<BlogAnalysis> {
  const analyses: Partial<BlogAnalysis>[] = [];
  
  for (const link of links) {
    try {
      console.log(`🌐 Fetching content from: ${link.url} for purpose: ${link.purpose}`);
      
      // Enhanced fetch with proper headers and error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(link.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        signal: controller.signal,
        redirect: 'follow'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`Failed to fetch ${link.url}: ${response.status}`);
        continue;
      }
      
      const html = await response.text();
      
      // Extract text content using simple regex (basic HTML parsing)
      const textContent = extractTextFromHtml(html);
      
      if (!textContent || textContent.length < 100) {
        console.warn(`Insufficient content from ${link.url}`);
        continue;
      }
      
      // Analyze based on purpose
      console.log(`🔍 Analyzing content for purpose: ${link.purpose}, content length: ${textContent.length}`);
      const analysis = analyzeContentByPurpose(textContent, link.purpose);
      analyses.push(analysis);
      console.log(`✅ Analysis completed for ${link.url}:`, Object.keys(analysis));
      
    } catch (error) {
      console.warn(`Error fetching ${link.url}:`, error instanceof Error ? error.message : String(error));
      
      // Try alternative approach for Korean blog sites
      if (link.url.includes('blog.naver.com') || link.url.includes('tistory.com') || link.url.includes('daum.net')) {
        try {
          console.log(`Attempting alternative fetch for Korean blog: ${link.url}`);
          const simpleResponse = await fetch(link.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
            }
          });
          
          if (simpleResponse.ok) {
            const html = await simpleResponse.text();
            const textContent = extractTextFromHtml(html);
            
            if (textContent && textContent.length > 100) {
              const analysis = analyzeContentByPurpose(textContent, link.purpose);
              analyses.push(analysis);
              console.log(`Successfully analyzed Korean blog: ${link.url}`);
            }
          }
        } catch (altError) {
          console.warn(`Alternative fetch also failed for ${link.url}:`, altError instanceof Error ? altError.message : String(altError));
        }
      }
      continue;
    }
  }
  
  // Combine analyses
  return combineAnalyses(analyses);
}

function extractTextFromHtml(html: string): string {
  console.log(`Extracting text from HTML (${html.length} characters)`);
  
  // Try to find main content containers first
  const contentSelectors = [
    /<article[^>]*>(.*?)<\/article>/gis,
    /<div[^>]*class[^>]*post[^>]*>(.*?)<\/div>/gis,
    /<div[^>]*class[^>]*content[^>]*>(.*?)<\/div>/gis,
    /<div[^>]*id[^>]*content[^>]*>(.*?)<\/div>/gis,
    /<main[^>]*>(.*?)<\/main>/gis
  ];
  
  let extractedContent = '';
  for (const selector of contentSelectors) {
    const matches = html.match(selector);
    if (matches && matches.length > 0) {
      extractedContent = matches.join(' ');
      console.log(`Found content using selector, length: ${extractedContent.length}`);
      break;
    }
  }
  
  // Fallback to full HTML if no specific content found
  if (!extractedContent) {
    extractedContent = html;
    console.log('Using full HTML as no specific content containers found');
  }
  
  // Remove script, style, and other non-content tags
  let text = extractedContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  text = text.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');
  text = text.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '');
  text = text.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
  text = text.replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '');
  
  // Remove HTML tags but preserve spacing
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  const entities = {
    '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', 
    '&quot;': '"', '&#39;': "'", '&apos;': "'", '&ldquo;': '"', 
    '&rdquo;': '"', '&lsquo;': "'", '&rsquo;': "'", '&hellip;': '...'
  };
  
  for (const [entity, replacement] of Object.entries(entities)) {
    text = text.replace(new RegExp(entity, 'g'), replacement);
  }
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  console.log(`Cleaned text length: ${text.length}`);
  
  // Extract meaningful sentences
  const sentences = text.split(/[.!?]/).filter(s => {
    const trimmed = s.trim();
    return trimmed.length > 15 && 
           !trimmed.match(/^(메뉴|로그인|회원가입|검색|더보기|댓글|공유|목록|이전|다음)$/) &&
           trimmed.includes(' '); // Must have at least one space (likely a sentence)
  });
  
  console.log(`Found ${sentences.length} meaningful sentences`);
  
  if (sentences.length === 0) {
    console.warn('No meaningful sentences found in extracted text');
    return '';
  }
  
  // Take middle 80% to avoid headers/footers
  const startIndex = Math.floor(sentences.length * 0.1);
  const endIndex = Math.floor(sentences.length * 0.9);
  const contentSentences = sentences.slice(startIndex, endIndex);
  
  const result = contentSentences.join('. ').substring(0, 4000);
  console.log(`Final extracted content length: ${result.length}`);
  
  return result;
}

function analyzeContentByPurpose(content: string, purpose: string): Partial<BlogAnalysis> {
  const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 10);
  
  switch (purpose) {
    case 'tone':
      return {
        tone: analyzeTone(content),
        keyPhrases: extractKeyPhrases(content, 'tone')
      };
    
    case 'hook':
      // Look for opening sentences
      const openingSentences = sentences.slice(0, 3).join('. ');
      return {
        hookMethod: analyzeHookMethod(openingSentences),
        keyPhrases: extractKeyPhrases(openingSentences, 'hook')
      };
    
    case 'storytelling':
      return {
        storytellingApproach: analyzeStorytelling(content),
        keyPhrases: extractKeyPhrases(content, 'storytelling')
      };
    
    case 'cta':
      // Look for ending sentences
      const endingSentences = sentences.slice(-3).join('. ');
      return {
        ctaStyle: analyzeCtaStyle(endingSentences),
        keyPhrases: extractKeyPhrases(endingSentences, 'cta')
      };
    
    default:
      return {};
  }
}

function analyzeTone(content: string): string {
  const indicators = {
    formal: ['입니다', '습니다', '드립니다', '있습니다'],
    friendly: ['해요', '해드려요', '~죠', '~네요'],
    casual: ['해', '야', '지', '거야'],
    professional: ['제공', '서비스', '전문', '솔루션']
  };
  
  let scores: Record<string, number> = { formal: 0, friendly: 0, casual: 0, professional: 0 };
  
  for (const [tone, words] of Object.entries(indicators)) {
    scores[tone] = words.reduce((sum, word) => 
      sum + (content.match(new RegExp(word, 'g')) || []).length, 0
    );
  }
  
  const dominantTone = Object.entries(scores).reduce((a, b) => 
    scores[a[0]] > scores[b[0]] ? a : b
  )[0];
  
  return `${dominantTone} 톤 (${scores[dominantTone]}회 사용)`;
}

function analyzeHookMethod(opening: string): string {
  const methods = {
    question: /[?]/g,
    statistic: /\d+%|\d+명|\d+개/g,
    problem: /문제|어려움|고민|걱정/g,
    curiosity: /궁금|놀라운|신기한|혹시/g
  };
  
  for (const [method, pattern] of Object.entries(methods)) {
    if (pattern.test(opening)) {
      return `${method} 방식의 후킹`;
    }
  }
  
  return '직접적 접근 방식';
}

function analyzeStorytelling(content: string): string {
  const approaches = {
    personal: /저는|제가|저의|제 경험/g,
    case_study: /사례|경우|예를 들어|실제로/g,
    step_by_step: /단계|방법|순서|과정/g,
    comparison: /비교|차이|반면|하지만/g
  };
  
  let maxCount = 0;
  let dominantApproach = 'informational';
  
  for (const [approach, pattern] of Object.entries(approaches)) {
    const count = (content.match(pattern) || []).length;
    if (count > maxCount) {
      maxCount = count;
      dominantApproach = approach;
    }
  }
  
  return `${dominantApproach} 스토리텔링 (${maxCount}회 사용)`;
}

function analyzeCtaStyle(ending: string): string {
  const styles = {
    direct: /문의|연락|상담|예약/g,
    soft: /도움|지원|함께|같이/g,
    urgent: /지금|바로|즉시|오늘/g,
    benefit: /혜택|할인|특가|무료/g
  };
  
  for (const [style, pattern] of Object.entries(styles)) {
    if (pattern.test(ending)) {
      return `${style} CTA 스타일`;
    }
  }
  
  return 'informational 마무리';
}

function extractKeyPhrases(content: string, purpose: string): string[] {
  // Extract meaningful phrases based on purpose
  const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 10);
  
  // Get 2-3 representative phrases
  return sentences
    .slice(0, 3)
    .map(s => s.trim().substring(0, 50))
    .filter(s => s.length > 10);
}

function combineAnalyses(analyses: Partial<BlogAnalysis>[]): BlogAnalysis {
  const combined: BlogAnalysis = {
    tone: '',
    hookMethod: '',
    storytellingApproach: '',
    ctaStyle: '',
    keyPhrases: []
  };
  
  // Combine non-empty values
  for (const analysis of analyses) {
    if (analysis.tone) combined.tone = analysis.tone;
    if (analysis.hookMethod) combined.hookMethod = analysis.hookMethod;
    if (analysis.storytellingApproach) combined.storytellingApproach = analysis.storytellingApproach;
    if (analysis.ctaStyle) combined.ctaStyle = analysis.ctaStyle;
    if (analysis.keyPhrases) combined.keyPhrases.push(...analysis.keyPhrases);
  }
  
  // Remove duplicates from key phrases
  combined.keyPhrases = Array.from(new Set(combined.keyPhrases));
  
  return combined;
}

export function formatReferenceGuidance(analysis: BlogAnalysis): string {
  const sections = [];
  
  if (analysis.tone) {
    sections.push(`✅ 좋은 어투 패턴: ${analysis.tone} - 이런 톤을 사용하면 독자에게 더 잘 전달됩니다`);
  }
  
  if (analysis.hookMethod) {
    sections.push(`✅ 효과적인 서론 전략: ${analysis.hookMethod} - 이 방식으로 독자의 관심을 끌면 좋습니다`);
  }
  
  if (analysis.storytellingApproach) {
    sections.push(`✅ 성공적인 스토리텔링: ${analysis.storytellingApproach} - 이런 구성이 독자에게 인기가 많습니다`);
  }
  
  if (analysis.ctaStyle) {
    sections.push(`✅ 효과적인 마무리: ${analysis.ctaStyle} - 이런 결론이 실제 행동으로 이어집니다`);
  }
  
  if (analysis.keyPhrases.length > 0) {
    sections.push(`✅ 매력적인 표현법: ${analysis.keyPhrases.slice(0, 3).join(', ')} - 이런 표현들이 독자에게 호응도가 높습니다`);
  }
  
  if (sections.length > 0) {
    sections.unshift('🎯 참고 블로그에서 분석한 성공 패턴들:');
    sections.push('\n위 패턴들을 참고하여 비슷한 수준의 매력적인 글을 작성해주세요.');
  }
  
  return sections.join('\n');
}