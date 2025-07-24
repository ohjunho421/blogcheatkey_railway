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
  // 모바일용 포맷팅: 15-21자 한글 기준, 문맥상 자연스러운 줄바꿈
  return content
    .split('\n')
    .map(line => {
      if (line.trim() === '') return '';
      
      // 한글 문자 개수 기준으로 계산 (영어, 숫자, 특수문자는 0.5로 계산)
      function getKoreanLength(text: string): number {
        let length = 0;
        for (const char of text) {
          if (/[가-힣]/.test(char)) {
            length += 1; // 한글은 1
          } else {
            length += 0.5; // 영어, 숫자, 특수문자는 0.5
          }
        }
        return length;
      }
      
      // 21자를 넘으면 줄바꿈 처리
      if (getKoreanLength(line) > 21) {
        const segments = [];
        let currentSegment = '';
        
        // 문장 부호나 쉼표 기준으로 먼저 나누기
        const phrases = line.split(/([,.!?])/);
        
        for (let i = 0; i < phrases.length; i++) {
          const phrase = phrases[i];
          const testSegment = currentSegment + phrase;
          
          if (getKoreanLength(testSegment) > 21) {
            if (currentSegment.trim()) {
              segments.push(currentSegment.trim());
              currentSegment = phrase;
            } else {
              // 구문 자체가 너무 길 경우 단어 단위로 분할
              const words = phrase.split(/(\s+)/);
              let wordSegment = '';
              
              for (const word of words) {
                const testWord = wordSegment + word;
                
                if (getKoreanLength(testWord) > 21) {
                  if (wordSegment.trim()) {
                    segments.push(wordSegment.trim());
                    wordSegment = word;
                  } else {
                    // 단어 자체가 너무 길 경우 자연스러운 지점에서 분할
                    if (getKoreanLength(word) > 21) {
                      let charSegment = '';
                      
                      for (const char of word) {
                        if (getKoreanLength(charSegment + char) > 18) { // 15-21 범위 중간값
                          if (charSegment.trim()) {
                            segments.push(charSegment.trim());
                            charSegment = char;
                          }
                        } else {
                          charSegment += char;
                        }
                      }
                      
                      if (charSegment.trim()) {
                        wordSegment = charSegment;
                      }
                    } else {
                      wordSegment = word;
                    }
                  }
                } else {
                  wordSegment += word;
                }
              }
              
              currentSegment = wordSegment;
            }
          } else {
            currentSegment += phrase;
          }
        }
        
        if (currentSegment.trim()) {
          segments.push(currentSegment.trim());
        }
        
        return segments.join('\n');
      }
      
      return line;
    })
    .join('\n')
    .replace(/\n\s*\n/g, '\n\n'); // 불필요한 빈 줄 정리
}
