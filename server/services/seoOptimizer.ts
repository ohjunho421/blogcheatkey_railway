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
  // Enhanced mobile formatting with shorter line breaks for better readability
  return content
    .split('\n')
    .map(line => {
      if (line.trim() === '') return '';
      
      // For mobile, break lines at 30 characters for optimal readability
      if (line.length > 30) {
        const segments = [];
        let currentSegment = '';
        
        // Split by common punctuation marks to maintain meaning
        const parts = line.split(/([.!?,:;]\s*)/);
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          
          if ((currentSegment + part).length > 30) {
            if (currentSegment.trim()) {
              segments.push(currentSegment.trim());
              currentSegment = part;
            } else {
              // If single part is too long, break by words while preserving Korean spacing
              const words = part.split(/(\s+)/);
              let wordLine = '';
              
              for (const word of words) {
                if ((wordLine + word).length > 30) {
                  if (wordLine.trim()) {
                    segments.push(wordLine.trim());
                    wordLine = word;
                  } else {
                    // If single word is too long, break at Korean syllable boundaries
                    if (word.length > 30) {
                      for (let j = 0; j < word.length; j += 30) {
                        const chunk = word.substring(j, j + 30);
                        segments.push(chunk);
                      }
                      wordLine = '';
                    } else {
                      segments.push(word);
                      wordLine = '';
                    }
                  }
                } else {
                  wordLine += word;
                }
              }
              if (wordLine.trim()) {
                currentSegment = wordLine;
              }
            }
          } else {
            currentSegment += part;
          }
        }
        
        if (currentSegment.trim()) {
          segments.push(currentSegment.trim());
        }
        
        return segments.join('\n');
      }
      
      return line;
    })
    .join('\n');
}
