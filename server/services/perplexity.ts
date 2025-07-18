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
          max_tokens: 1200,
          temperature: 0.3,
          top_p: 0.9,
          return_images: false,
          return_related_questions: false,
          search_recency_filter: "year",

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
          // Remove social media and non-authoritative sources
          const blockedDomains = [
            'instagram.com', 'tiktok.com', 'facebook.com', 'twitter.com', 'x.com',
            'youtube.com', 'reddit.com', 'quora.com', 'yahoo.com', 'pinterest.com',
            'linkedin.com', 'medium.com', 'wordpress.com', 'blogspot.com', 'tumblr.com'
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
  const searchQuery = `"${keyword}" ${subtitles.join(" ")} official statistics research academic study government data industry report`;

  const messages = [
    {
      role: "system",
      content: "You are a professional research analyst. Find authoritative, credible information from official sources. Do not use social media, personal blogs, or unofficial websites. Focus on government data, academic research, industry reports, and established news organizations."
    },
    {
      role: "user",
      content: `Find authoritative research and official data about "${keyword}" related to: ${subtitles.join(", ")}

Focus on:
- Government statistics and official data
- Academic research from universities
- Industry association reports
- Major news organizations with verified data
- Scientific journals and publications

Provide specific statistics, data points, and factual information with credible sources.`
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
  const searchQuery = `"${keyword}" "${subtitle}" official statistics research academic study government data industry report`;

  const messages = [
    {
      role: "system",
      content: "You are a professional research analyst. Find authoritative, credible information from official sources. Do not use social media, personal blogs, or unofficial websites. Focus on government data, academic research, industry reports, and established news organizations."
    },
    {
      role: "user",
      content: `Find authoritative research and official data about "${keyword}" specifically related to "${subtitle}"

Focus on:
- Government statistics and official data
- Academic research from universities
- Industry association reports  
- Major news organizations with verified data
- Scientific journals and publications

Provide specific statistics, data points, and factual information with credible sources.`
    }
  ];

  const data = await makePerplexityRequest(messages);
  
  return {
    content: data.choices[0].message.content,
    citations: data.citations || []
  };
}