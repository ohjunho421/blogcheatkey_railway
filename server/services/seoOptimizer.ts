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
  // Enhanced mobile formatting with cleaner line breaks for better readability
  return content
    .split('\n')
    .map(line => {
      if (line.trim() === '') return '';
      
      // For mobile, break lines at 25-30 characters for optimal readability
      if (line.length > 28) {
        const segments = [];
        let currentSegment = '';
        
        // First, try to break at natural Korean phrase boundaries
        const koreanPhrases = line.split(/([,.\s]+)/);
        
        for (const phrase of koreanPhrases) {
          if ((currentSegment + phrase).length > 28) {
            if (currentSegment.trim()) {
              segments.push(currentSegment.trim());
              currentSegment = phrase;
            } else {
              // If phrase is still too long, break at word boundaries
              const words = phrase.split(/(\s+)/);
              let wordSegment = '';
              
              for (const word of words) {
                if ((wordSegment + word).length > 28) {
                  if (wordSegment.trim()) {
                    segments.push(wordSegment.trim());
                    wordSegment = word;
                  } else {
                    // For very long words, break at appropriate Korean syllable boundaries
                    if (word.length > 28) {
                      const syllables = word.match(/./g) || [];
                      let syllableGroup = '';
                      
                      for (const syllable of syllables) {
                        if ((syllableGroup + syllable).length > 25) {
                          if (syllableGroup.trim()) {
                            segments.push(syllableGroup.trim());
                            syllableGroup = syllable;
                          }
                        } else {
                          syllableGroup += syllable;
                        }
                      }
                      
                      if (syllableGroup.trim()) {
                        wordSegment = syllableGroup;
                      }
                    } else {
                      wordSegment = word;
                    }
                  }
                } else {
                  wordSegment += word;
                }
              }
              
              if (wordSegment.trim()) {
                currentSegment = wordSegment;
              }
            }
          } else {
            currentSegment += phrase;
          }
        }
        
        if (currentSegment.trim()) {
          segments.push(currentSegment.trim());
        }
        
        // Join segments with line breaks, ensuring clean spacing
        return segments.filter(seg => seg.trim()).join('\n');
      }
      
      return line;
    })
    .filter(line => line !== null)
    .join('\n')
    // Clean up multiple consecutive line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Ensure proper spacing around punctuation for mobile readability
    .replace(/([.!?])\s*([가-힣A-Za-z])/g, '$1\n$2')
    // Optimize spacing for Korean text readability
    .replace(/([가-힣]{15,})/g, (match) => {
      // Break long Korean text chunks into readable segments
      const segments = [];
      for (let i = 0; i < match.length; i += 20) {
        segments.push(match.substring(i, i + 20));
      }
      return segments.join('\n');
    });
}
