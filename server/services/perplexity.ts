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
}> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error("PERPLEXITY_API_KEY is not configured");
  }

  const searchQuery = `${keyword}에 대한 최신 정보, 통계, 연구 자료를 찾아주세요. 특히 다음 주제들과 관련된 자료를 중심으로: ${subtitles.join(", ")}`;

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-large-128k-online",
      messages: [
        {
          role: "system",
          content: "당신은 신뢰할 수 있는 정보 수집 전문가입니다. 정확한 통계, 연구 자료, 공식 문서를 우선적으로 찾아주세요. 각 정보의 출처를 명확히 제시해주세요."
        },
        {
          role: "user",
          content: searchQuery
        }
      ],
      max_tokens: 2000,
      temperature: 0.2,
      top_p: 0.9,
      search_recency_filter: "month",
      return_images: false,
      return_related_questions: false,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
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

  const searchQuery = `"${keyword}" "${subtitle}"에 대한 구체적인 정보, 전문가 의견, 실제 사례를 찾아주세요. 신뢰할 수 있는 출처의 정보만 제공해주세요.`;

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-large-128k-online",
      messages: [
        {
          role: "system",
          content: "정확하고 신뢰할 수 있는 정보를 수집하는 전문가입니다. 공식 기관, 연구 논문, 전문 매체의 정보를 우선적으로 찾아주세요."
        },
        {
          role: "user",
          content: searchQuery
        }
      ],
      max_tokens: 1500,
      temperature: 0.1,
      top_p: 0.8,
      search_recency_filter: "month",
      return_images: false,
      return_related_questions: false,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
  }

  const data: PerplexityResponse = await response.json();
  
  return {
    content: data.choices[0].message.content,
    citations: data.citations || []
  };
}
