import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function generateInfographic(subtitle: string, keyword: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY_ENV_VAR) {
    throw new Error("OpenAI API key is not configured");
  }

  const prompt = `Create a clean, professional infographic about "${subtitle}" related to "${keyword}". 
  The image should be informative, visually appealing, and suitable for a blog post. 
  Use a modern, clean design with clear typography and relevant icons. 
  Style should be business-appropriate and professional.`;

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return response.data[0].url || "";
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
