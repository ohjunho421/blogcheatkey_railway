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

  const searchQuery = `${keyword} (${subtitles.join(", ")}): 핵심 정보 요약`;

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
          role: "user",
          content: searchQuery
        }
      ],
      max_tokens: 1000, // Further reduced for speed
      temperature: 0.5, // Increased for faster generation
      top_p: 0.6, // More focused responses
      return_images: false,
      return_related_questions: false,
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

  const searchQuery = `${keyword} ${subtitle}: 핵심 요약`;

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
          role: "user",
          content: searchQuery
        }
      ],
      max_tokens: 800, // Further reduced for speed
      temperature: 0.5, // Increased for faster generation
      top_p: 0.6, // More focused responses
      return_images: false,
      return_related_questions: false,
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