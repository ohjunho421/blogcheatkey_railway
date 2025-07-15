import { GoogleGenAI } from "@google/genai";
import { enhancedSEOAnalysis } from "./morphemeAnalyzer.js";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_ENV_VAR || "default_key"
});

export interface SEOAnalysis {
  keywordFrequency: number;
  characterCount: number;
  morphemeCount: number;
  isOptimized: boolean;
  issues: string[];
  suggestions: string[];
}

export async function analyzeSEOOptimization(content: string, keyword: string): Promise<SEOAnalysis> {
  // Use enhanced morpheme analysis instead of relying on Gemini
  console.log("Using enhanced morpheme analysis for SEO optimization");
  
  try {
    const analysis = enhancedSEOAnalysis(content, keyword);
    
    return {
      keywordFrequency: analysis.keywordFrequency,
      characterCount: analysis.characterCount,
      morphemeCount: analysis.morphemeCount,
      isOptimized: analysis.isOptimized,
      issues: analysis.issues,
      suggestions: analysis.suggestions
    };
  } catch (error) {
    console.error("Enhanced SEO analysis error:", error);
    
    // Fallback to basic analysis
    const characterCount = content.replace(/\s/g, '').length;
    const keywordCount = (content.match(new RegExp(keyword, 'gi')) || []).length;
    
    return {
      keywordFrequency: keywordCount,
      characterCount: characterCount,
      morphemeCount: keywordCount,
      isOptimized: keywordCount >= 17 && keywordCount <= 20 && characterCount >= 1700 && characterCount <= 2000,
      issues: ["기본 분석 모드 사용"],
      suggestions: ["형태소 분석 시스템을 확인해주세요"]
    };
  }
}

export function formatForMobile(content: string): string {
  // Split content into lines with max 22 characters per line
  const words = content.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length <= 22) {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join('\n');
}
