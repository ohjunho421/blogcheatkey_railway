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

async function makePerplexityRequest(messages: any[], maxRetries = 2): Promise<PerplexityResponse> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error("PERPLEXITY_API_KEY is not configured");
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
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
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
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
      
    } catch (error) {
      console.error(`Perplexity request failed (attempt ${attempt + 1}):`, error.message);
      
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
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
  
  return {
    content: data.choices[0].message.content,
    citations: data.citations || []
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