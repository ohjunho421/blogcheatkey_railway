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
          search_domain_filter: [
            "gov", "edu", "org", "reuters.com", "ap.org", "bbc.com", 
            "cnn.com", "bloomberg.com", "wsj.com", "ft.com", "economist.com",
            "nature.com", "sciencedirect.com", "ieee.org", "acm.org"
          ],
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

      return await response.json();
      
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
      content: "You are a research assistant that ONLY uses authoritative sources. You must NEVER cite or reference social media platforms (Instagram, TikTok, Facebook, Twitter, YouTube, Reddit), personal blogs, forums, or non-official websites. ONLY use: government websites (.gov), academic institutions (.edu), professional organizations (.org), established news organizations (Reuters, AP, BBC, Bloomberg, WSJ), scientific journals, and official industry reports."
    },
    {
      role: "user",
      content: `Research "${keyword}" with focus on: ${subtitles.join(", ")}

STRICT REQUIREMENTS - ONLY use these source types:
• Government agencies (.gov domains)
• Universities and academic research (.edu domains)  
• Professional organizations (.org domains)
• Major news outlets (Reuters, AP, BBC, Bloomberg, WSJ, Financial Times)
• Scientific journals and research publications
• Official industry association reports

ABSOLUTELY FORBIDDEN - Do NOT use:
• Instagram, TikTok, Facebook, Twitter, YouTube, Reddit
• Personal blogs or individual websites
• Forums or discussion boards
• Unofficial or non-authoritative sites

Provide official statistics, research data, and verified information only.`
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
      content: "You are a research assistant that ONLY uses authoritative sources. You must NEVER cite or reference social media platforms (Instagram, TikTok, Facebook, Twitter, YouTube, Reddit), personal blogs, forums, or non-official websites. ONLY use: government websites (.gov), academic institutions (.edu), professional organizations (.org), established news organizations (Reuters, AP, BBC, Bloomberg, WSJ), scientific journals, and official industry reports."
    },
    {
      role: "user",
      content: `Research "${keyword}" specifically about "${subtitle}"

STRICT REQUIREMENTS - ONLY use these source types:
• Government agencies (.gov domains)
• Universities and academic research (.edu domains)
• Professional organizations (.org domains)  
• Major news outlets (Reuters, AP, BBC, Bloomberg, WSJ, Financial Times)
• Scientific journals and research publications
• Official industry association reports

ABSOLUTELY FORBIDDEN - Do NOT use:
• Instagram, TikTok, Facebook, Twitter, YouTube, Reddit
• Personal blogs or individual websites
• Forums or discussion boards
• Unofficial or non-authoritative sites

Provide official statistics, research data, and verified information only.`
    }
  ];

  const data = await makePerplexityRequest(messages);
  
  return {
    content: data.choices[0].message.content,
    citations: data.citations || []
  };
}