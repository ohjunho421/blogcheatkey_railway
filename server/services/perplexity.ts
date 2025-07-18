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
      content: "You must ONLY use credible sources: academic journals, government websites, official industry reports, established news organizations, and research institutions. EXCLUDE social media platforms (Instagram, TikTok, Facebook, Twitter), personal blogs, and non-authoritative websites. Focus on sources from universities, government agencies, professional organizations, and established media outlets."
    },
    {
      role: "user",
      content: `Find reliable data about "${keyword}" focusing on ${subtitles.join(", ")}. 

      REQUIRED sources:
      - Government agencies and official statistics
      - Academic research and university studies  
      - Industry associations and professional organizations
      - Established news organizations (Reuters, AP, major newspapers)
      - Research institutions and think tanks

      EXCLUDED sources:
      - Social media (Instagram, TikTok, Facebook, Twitter)
      - Personal blogs or opinion sites
      - Non-authoritative websites

      Provide specific numbers, percentages, and data points with official sources.`
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
      content: "You must ONLY use credible sources: academic journals, government websites, official industry reports, established news organizations, and research institutions. EXCLUDE social media platforms (Instagram, TikTok, Facebook, Twitter), personal blogs, and non-authoritative websites. Focus on sources from universities, government agencies, professional organizations, and established media outlets."
    },
    {
      role: "user",
      content: `Find reliable data about "${keyword}" specifically related to "${subtitle}". 

      REQUIRED sources:
      - Government agencies and official statistics
      - Academic research and university studies
      - Industry associations and professional organizations  
      - Established news organizations (Reuters, AP, major newspapers)
      - Research institutions and think tanks

      EXCLUDED sources:
      - Social media (Instagram, TikTok, Facebook, Twitter)
      - Personal blogs or opinion sites
      - Non-authoritative websites

      Provide specific numbers, percentages, and data points with official sources.`
    }
  ];

  const data = await makePerplexityRequest(messages);
  
  return {
    content: data.choices[0].message.content,
    citations: data.citations || []
  };
}