import { google } from 'googleapis';

// Google Cloud authentication
const getGoogleAuth = () => {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error("Google Service Account Key is not configured");
  }
  
  const credentials = JSON.parse(serviceAccountKey);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
};

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || "blogcheatkey";
const LOCATION = "us-central1";

async function getAccessToken(): Promise<string> {
  try {
    const auth = getGoogleAuth();
    const client = await auth.getClient();
    const accessTokenResponse = await client.getAccessToken();
    return accessTokenResponse.token || "";
  } catch (error) {
    console.error("Failed to get access token:", error);
    throw new Error("Google authentication failed");
  }
}

export async function generateImage(prompt: string, style: string = "infographic"): Promise<string> {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const accessToken = await getAccessToken();
      
      // Enhanced prompt generation based on style and content
      let enhancedPrompt = "";
      
      if (style === "photo") {
        enhancedPrompt = `Professional, high-quality photo of ${prompt}. Clear, well-lit, and visually appealing. Modern photography style.`;
      } else if (style === "infographic") {
        enhancedPrompt = `Clean, modern infographic about ${prompt}. Use clear typography, relevant icons, and professional design. Business-appropriate with informative visual elements.`;
      } else {
        enhancedPrompt = `High-quality visual representation of ${prompt}. Professional, clear, and engaging design.`;
      }
      
      console.log(`Enhanced prompt: "${enhancedPrompt}" (attempt ${attempt + 1})`);
      
      const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagen-3.0-generate-002:predict`;
    
    const requestBody = {
      instances: [
        {
          prompt: enhancedPrompt
        }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: "1:1",
        safetyFilterLevel: "block_some",
        personGeneration: "dont_allow",
        addWatermark: false
      }
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
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        
        // Handle 429 quota exceeded errors with retry logic
        if (response.status === 429) {
          attempt++;
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(`Quota exceeded, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          } else {
            throw new Error(`할당량 초과: Google Cloud Console에서 Imagen 3.0 할당량 증가를 요청해주세요. 자세한 방법: https://cloud.google.com/vertex-ai/docs/generative-ai/quotas-genai`);
          }
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
        return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
      }
      throw new Error("No image data in response");
      
    } catch (error) {
      console.error("Image generation error:", error?.message || error);
      
      // Handle 429 errors from fetch-level errors
      if (error instanceof Error && error.message.includes('429')) {
        attempt++;
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`Quota error, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      // For permission errors, provide a helpful message
      if (error instanceof Error && error.message.includes('403')) {
        throw new Error('Google Cloud 권한이 필요합니다. 서비스 계정에 Vertex AI User 역할을 추가해주세요.');
      }
      
      throw new Error(`이미지 생성에 실패했습니다: ${error}`);
    }
  }
  
  throw new Error('최대 재시도 횟수를 초과했습니다.');
}

export async function generateInfographic(subtitle: string, keyword: string): Promise<string> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_CLOUD_PROJECT_ID) {
    throw new Error("Google Cloud credentials are not configured");
  }

  const prompt = `Create a clean, professional infographic about "${subtitle}" related to "${keyword}". 
  The image should be informative, visually appealing, and suitable for a blog post. 
  Use a modern, clean design with clear typography and relevant icons. 
  Style should be business-appropriate and professional.`;

  try {
    const accessToken = await getAccessToken();
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagen-3.0-generate-002:predict`;
    
    const requestBody = {
      instances: [
        {
          prompt: prompt
        }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: "1:1",
        safetyFilterLevel: "block_some",
        personGeneration: "dont_allow",
        addWatermark: false
      }
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
      const errorText = await response.text();
      console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
      return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
    }
    throw new Error("No image data in response");
  } catch (error) {
    console.error("Infographic generation error:", error?.message || error);
    // For permission errors, provide a helpful message
    if (error instanceof Error && error.message.includes('403')) {
      throw new Error('Google Cloud 권한이 필요합니다. 서비스 계정에 Vertex AI User 역할을 추가해주세요.');
    }
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
