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

export async function searchResearch(keyword: string, subtitles: string[]): Promise<{
  content: string;
  citations: string[];
  citationsWithTitles?: Array<{url: string, title: string}>;
}> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error("PERPLEXITY_API_KEY is not configured");
  }

  const searchQuery = `${keyword} ${subtitles.join(" OR ")} 2024 2023 statistics research data`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content: "You must prioritize academic sources, official statistics, research papers, government data, and credible news articles. Focus on finding data from: .edu, .gov, .org domains, research institutions, academic journals, official statistics bureaus, and established news organizations. Provide specific numbers, percentages, and data points when available."
        },
        {
          role: "user",
          content: `Find reliable academic research, official statistics, and credible data about: ${searchQuery}. 
          
          Please include:
          - Official statistics and data
          - Research findings from academic sources
          - Government or industry reports
          - Credible news articles with data
          - Specific numbers and percentages
          
          Prioritize sources from universities, research institutions, government agencies, and established organizations.`
        }
      ],
      max_tokens: 1500, // 더 많은 정보를 위해 증가
      temperature: 0.2, // 더 정확하고 사실적인 정보를 위해 낮춤
      top_p: 0.9,
      return_images: false,
      return_related_questions: false,
      search_recency_filter: "year", // 최근 1년 내 자료로 확장
      search_domain_filter: ["edu", "gov", "org"], // 공식 도메인 우선
      stream: false
    }),
    signal: controller.signal
  });
  
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Perplexity API error details:", errorText);
    throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data: PerplexityResponse = await response.json();
  
  return {
    content: data.choices[0].message.content,
    citations: data.citations || []
  };
}

export async function getDetailedResearch(keyword: string, subtitle: string): Promise<{
  content: string;
  citations: string[];
}> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error("PERPLEXITY_API_KEY is not configured");
  }

  const searchQuery = `${keyword} ${subtitle} statistics research data 2024 2023`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content: "You must prioritize academic sources, official statistics, research papers, government data, and credible news articles. Focus on finding data from: .edu, .gov, .org domains, research institutions, academic journals, official statistics bureaus, and established news organizations. Provide specific numbers, percentages, and data points when available."
        },
        {
          role: "user",
          content: `Find reliable academic research, official statistics, and credible data about: ${searchQuery}. 
          
          Please include:
          - Official statistics and data
          - Research findings from academic sources
          - Government or industry reports
          - Credible news articles with data
          - Specific numbers and percentages
          
          Prioritize sources from universities, research institutions, government agencies, and established organizations.`
        }
      ],
      max_tokens: 1500, // 더 많은 정보를 위해 증가
      temperature: 0.2, // 더 정확하고 사실적인 정보를 위해 낮춤
      top_p: 0.9,
      return_images: false,
      return_related_questions: false,
      search_recency_filter: "year", // 최근 1년 내 자료로 확장
      search_domain_filter: ["edu", "gov", "org"], // 공식 도메인 우선
      stream: false
    }),
    signal: controller.signal
  });
  
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Perplexity API error details:", errorText);
    throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data: PerplexityResponse = await response.json();
  
  return {
    content: data.choices[0].message.content,
    citations: data.citations || []
  };
}