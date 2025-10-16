// Perplexity API service using sonar-pro as explicitly requested by user

interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  citations: string[];
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Extract title from HTML
async function fetchTitleFromUrl(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // Try different title patterns
    const patterns = [
      /<title[^>]*>(.*?)<\/title>/i,
      /<meta\s+property="og:title"\s+content="([^"]*)"/i,
      /<meta\s+name="title"\s+content="([^"]*)"/i,
      /<h1[^>]*>(.*?)<\/h1>/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        let title = match[1].trim();
        // Clean up title
        title = title.replace(/<[^>]+>/g, ''); // Remove HTML tags
        title = title.replace(/&nbsp;/g, ' ');
        title = title.replace(/&quot;/g, '"');
        title = title.replace(/&amp;/g, '&');
        title = title.replace(/&#39;/g, "'");
        title = title.replace(/&lt;/g, '<');
        title = title.replace(/&gt;/g, '>');
        
        // Truncate if too long
        if (title.length > 100) {
          title = title.substring(0, 100) + '...';
        }
        
        return title || getDefaultTitle(url);
      }
    }
    
    return getDefaultTitle(url);
  } catch (error) {
    console.warn(`Failed to fetch title from ${url}:`, error instanceof Error ? error.message : String(error));
    return getDefaultTitle(url);
  }
}

// Get default title from domain
function getDefaultTitle(url: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    const domainName = domain.split('.')[0];
    return domainName.charAt(0).toUpperCase() + domainName.slice(1) + ' 자료';
  } catch {
    return '참고 자료';
  }
}

async function makePerplexityRequest(messages: any[], maxRetries = 3): Promise<PerplexityResponse> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error("PERPLEXITY_API_KEY is not configured");
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout
      
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages,
          max_tokens: 1500,
          temperature: 0.2,
          top_p: 0.9,
          stream: false
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Perplexity API error (attempt ${attempt + 1}):`, errorText);
        
        if (attempt === maxRetries - 1) {
          throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.min(2000 * Math.pow(2, attempt), 10000)));
        continue;
      }

      const data = await response.json();
      
      // Filter out social media and non-authoritative sources from citations
      if (data.citations) {
        const filteredCitations = data.citations.filter((citation: string) => {
          const url = citation.toLowerCase();
          // Remove social media and non-authoritative sources (excluding YouTube, but including Kakao domains)
          const blockedDomains = [
            'instagram.com', 'tiktok.com', 'facebook.com', 'twitter.com', 'x.com',
            'reddit.com', 'quora.com', 'yahoo.com', 'pinterest.com',
            'linkedin.com', 'medium.com', 'wordpress.com', 'blogspot.com', 'tumblr.com',
            'kakao.com', 'daum.net', 'cafe.daum.net', 'blog.kakao.com'
          ];
          
          return !blockedDomains.some(domain => url.includes(domain));
        });
        data.citations = filteredCitations;
      }
      
      return data;
      
    } catch (error: any) {
      console.error(`Perplexity request failed (attempt ${attempt + 1}):`, error?.message || error);
      
      if (attempt === maxRetries - 1) {
        // 마지막 시도 실패시 더 구체적인 에러 메시지
        if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
          throw new Error("요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.");
        }
        throw new Error(`연구 자료 수집 중 오류가 발생했습니다: ${error?.message || '알 수 없는 오류'}`);
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.min(3000 * Math.pow(2, attempt), 15000)));
    }
  }
  
  throw new Error("All Perplexity API attempts failed");
}

export async function searchResearch(keyword: string, subtitles: string[]): Promise<{
  content: string;
  citations: string[];
  citationsWithTitles?: Array<{url: string, title: string}>;
}> {
  // subtitles가 배열인지 확인하고 안전하게 처리
  const subtitlesList = Array.isArray(subtitles) ? subtitles : [];
  const searchQuery = `"${keyword}" ${subtitlesList.join(" ")} academic research paper journal study statistics government report news article`;

  const messages = [
    {
      role: "system",
      content: "You are a research specialist focused on finding academic papers, news articles, and statistical data. Prioritize scholarly publications, government statistics, industry reports, and established news sources. Exclude social media, personal blogs, and unofficial content. Include YouTube only for educational or official channels."
    },
    {
      role: "user",
      content: `Research "${keyword}" with focus on: ${subtitlesList.join(", ")}

Priority sources:
1. Academic papers and scholarly journals (.edu, research institutions)
2. Government statistics and official reports (.gov, ministry websites)
3. News articles from established media organizations
4. Industry research reports and white papers
5. Statistical databases and official surveys
6. YouTube educational content from official channels only

Find specific data points, statistics, research findings, and expert analysis with credible citations.`
    }
  ];

  const data = await makePerplexityRequest(messages);
  const citations = data.citations || [];
  
  // Fetch titles for citations in parallel (max 10 to avoid overwhelming)
  console.log(`📚 Fetching titles for ${citations.length} citations...`);
  const citationsWithTitles = await Promise.all(
    citations.slice(0, 10).map(async (url) => {
      const title = await fetchTitleFromUrl(url);
      console.log(`✓ ${url} → ${title}`);
      return { url, title };
    })
  );
  
  console.log(`✅ Fetched ${citationsWithTitles.length} titles`);
  
  return {
    content: data.choices[0].message.content,
    citations,
    citationsWithTitles
  };
}

export async function getDetailedResearch(keyword: string, subtitle: string): Promise<{
  content: string;
  citations: string[];
}> {
  const searchQuery = `"${keyword}" "${subtitle}" academic paper journal research statistics government report news article data study`;

  const messages = [
    {
      role: "system",
      content: "You are a research specialist focused on finding academic papers, news articles, and statistical data. Prioritize scholarly publications, government statistics, industry reports, and established news sources. Exclude social media, personal blogs, and unofficial content. Include YouTube only for educational or official channels."
    },
    {
      role: "user",
      content: `Research "${keyword}" specifically for "${subtitle}"

Priority sources:
1. Academic papers and scholarly journals (.edu, research institutions)
2. Government statistics and official reports (.gov, ministry websites)  
3. News articles from established media organizations
4. Industry research reports and white papers
5. Statistical databases and official surveys
6. YouTube educational content from official channels only

Find specific data points, statistics, research findings, and expert analysis with credible citations.`
    }
  ];

  const data = await makePerplexityRequest(messages);
  
  return {
    content: data.choices[0].message.content,
    citations: data.citations || []
  };
}