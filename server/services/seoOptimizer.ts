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
      
      // For mobile, break lines at 25-30 characters for optimal readability
      if (line.length > 30) {
        const segments = [];
        let currentSegment = '';
        
        // Split by sentences first to maintain meaning
        const sentences = line.split(/([.!?]\s+)/);
        
        for (let i = 0; i < sentences.length; i++) {
          const segment = sentences[i];
          
          if ((currentSegment + segment).length > 30) {
            if (currentSegment.trim()) {
              segments.push(currentSegment.trim());
              currentSegment = segment;
            } else {
              // If single segment is too long, break by words
              const words = segment.split(' ');
              let wordLine = '';
              
              for (const word of words) {
                if ((wordLine + word).length > 30) {
                  if (wordLine.trim()) {
                    segments.push(wordLine.trim());
                    wordLine = word + ' ';
                  } else {
                    // If single word is too long, just add it
                    segments.push(word);
                    wordLine = '';
                  }
                } else {
                  wordLine += word + ' ';
                }
              }
              if (wordLine.trim()) {
                currentSegment = wordLine;
              }
            }
          } else {
            currentSegment += segment;
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
