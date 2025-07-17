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
      console.log(`Fetching content from: ${link.url} for ${link.purpose}`);
      
      // Simple fetch with user agent
      const response = await fetch(link.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000 // 10 second timeout
      });
      
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
      const analysis = analyzeContentByPurpose(textContent, link.purpose);
      analyses.push(analysis);
      
    } catch (error) {
      console.warn(`Error fetching ${link.url}:`, error.message);
      continue;
    }
  }
  
  // Combine analyses
  return combineAnalyses(analyses);
}

function extractTextFromHtml(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Extract main content (try to find article-like content)
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 20);
  
  // Take middle portion to avoid headers/footers
  const startIndex = Math.floor(sentences.length * 0.1);
  const endIndex = Math.floor(sentences.length * 0.9);
  
  return sentences.slice(startIndex, endIndex).join('. ').substring(0, 3000);
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
  
  let scores = { formal: 0, friendly: 0, casual: 0, professional: 0 };
  
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
  combined.keyPhrases = [...new Set(combined.keyPhrases)];
  
  return combined;
}

export function formatReferenceGuidance(analysis: BlogAnalysis): string {
  const sections = [];
  
  if (analysis.tone) {
    sections.push(`어투: ${analysis.tone}`);
  }
  
  if (analysis.hookMethod) {
    sections.push(`서론 후킹: ${analysis.hookMethod}`);
  }
  
  if (analysis.storytellingApproach) {
    sections.push(`스토리텔링: ${analysis.storytellingApproach}`);
  }
  
  if (analysis.ctaStyle) {
    sections.push(`CTA 스타일: ${analysis.ctaStyle}`);
  }
  
  if (analysis.keyPhrases.length > 0) {
    sections.push(`참고 표현: ${analysis.keyPhrases.slice(0, 3).join(', ')}`);
  }
  
  return sections.join('\n');
}