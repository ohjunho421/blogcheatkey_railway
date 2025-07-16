// Note: Google Imagen 3.0 is typically accessed through Vertex AI API
// This implementation uses a REST API approach for Imagen-3.0-002

const VERTEX_AI_ENDPOINT = "https://us-central1-aiplatform.googleapis.com/v1";
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || "your-project-id";
const LOCATION = "us-central1";

async function getAccessToken(): Promise<string> {
  // In production, you would use Google Cloud SDK or service account authentication
  // For now, we'll use the API key approach or return the GOOGLE_API_KEY
  return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";
}

export async function generateImage(prompt: string, style: string = "infographic"): Promise<string> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error("Google API key is not configured");
    }

    const enhancedPrompt = `${style === "photo" ? "Professional photo of" : "Clean infographic about"} ${prompt}`;
    
    const endpoint = `${VERTEX_AI_ENDPOINT}/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagen-3.0-002:predict`;
    
    const requestBody = {
      instances: [
        {
          prompt: enhancedPrompt,
          parameters: {
            sampleCount: 1,
            aspectRatio: "1:1",
            safetyFilterLevel: "block_some",
            personGeneration: "dont_allow"
          }
        }
      ]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract image URL from response
    if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
      // Convert base64 to data URL
      return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
    }
    
    throw new Error("No image data in response");
  } catch (error) {
    console.error("Image generation error:", error);
    throw new Error(`이미지 생성에 실패했습니다: ${error}`);
  }
}

export async function generateInfographic(subtitle: string, keyword: string): Promise<string> {
  if (!process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY) {
    throw new Error("Google API key is not configured");
  }

  const prompt = `Create a clean, professional infographic about "${subtitle}" related to "${keyword}". 
  The image should be informative, visually appealing, and suitable for a blog post. 
  Use a modern, clean design with clear typography and relevant icons. 
  Style should be business-appropriate and professional.`;

  try {
    const accessToken = await getAccessToken();
    const endpoint = `${VERTEX_AI_ENDPOINT}/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagen-3.0-002:predict`;
    
    const requestBody = {
      instances: [
        {
          prompt: prompt,
          parameters: {
            sampleCount: 1,
            aspectRatio: "1:1",
            safetyFilterLevel: "block_some",
            personGeneration: "dont_allow"
          }
        }
      ]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
      return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
    }
    
    throw new Error("No image data in response");
  } catch (error) {
    console.error("Image generation error:", error);
    throw new Error("Failed to generate infographic");
  }
}

export async function generateMultipleImages(subtitles: string[], keyword: string): Promise<string[]> {
  const images: string[] = [];
  
  for (const subtitle of subtitles) {
    try {
      const imageUrl = await generateInfographic(subtitle, keyword);
      images.push(imageUrl);
    } catch (error) {
      console.error(`Failed to generate image for subtitle: ${subtitle}`, error);
      images.push(""); // Add empty string for failed generations
    }
  }
  
  return images;
}
