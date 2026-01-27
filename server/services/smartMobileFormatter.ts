/**
 * AI 기반 스마트 모바일 포맷터
 * 한국어 문맥과 의미를 이해하고 가독성 높은 줄바꿈 처리
 */

import Anthropic from '@anthropic-ai/sdk';
import { formatForMobile } from './mobileFormatter';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * AI를 활용한 스마트 모바일 줄바꿈 포맷팅
 * @param text 원본 텍스트
 * @param maxBytes 최대 줄 바이트 수 (한글 3바이트, 영문 1바이트, 기본값: 70바이트 = 한글 약 23자)
 * @returns 포맷팅된 텍스트
 */
export async function formatForMobileSmart(text: string, maxBytes: number = 70): Promise<string> {
  if (!text || text.trim() === '') return text;

  // 바이트 기준 한글 글자 수 계산 (한글 3바이트 = 1자)
  const maxKoreanChars = Math.floor(maxBytes / 3);

  try {
    const prompt = `당신은 모바일 가독성 전문가입니다. 주어진 한국어 텍스트를 모바일 화면에 최적화된 형태로 줄바꿈해주세요.

🚨 **핵심 규칙:**
1. **한 줄은 한글 기준 18-23자 이내** (공백 포함, 23자 목표)
2. **30자 이하 문장은 무조건 한 줄로 유지** (끊지 말 것!)
3. **31-33자 문장 (1-3자만 초과):**
   - 줄바꿈하지 말고 표현을 약간 줄여서 30자 이내로 만들기
   - 예: "제대로 모르시기" → "잘 모르기", "~하시는데" → "~하는데"
4. **34자 이상 문장만 의미 단위로 분리** (접속사, 쉼표 기준)
5. **단어/조사는 절대 분리 금지**
6. **빈 줄(단락 구분)은 원본 그대로 유지**

📝 **작업 단계:**
1. 마침표(.)로 문장 구분
2. 각 문장의 길이 확인:
   - 30자 이하 → 그대로 한 줄로 출력
   - 31-33자 → 약간 줄여서 30자 이내 한 줄로 만들기
   - 34자 이상 → 접속사/쉼표 위치에서 2-3줄로 자연스럽게 분리

✅ **올바른 예시 1 (31-33자 → 줄이기):**
입력: "대부분 냉각수와 부동액의 차이를 제대로 모르시기 때문이에요." (32자)

출력:
대부분 냉각수와 부동액 차이를 잘 모르기 때문이에요.

(설명: 32자로 2글자만 초과 → "의", "제대로~시" 줄여서 28자로 한 줄 유지)

✅ **올바른 예시 2 (34자 이상 → 분리):**
입력: "즉시 안정한 곳에 차를 세우고 엔진을 끄세요. 하지만 자칫 잘못된 정보나 생각없이 저렴한 제품만 쫓다가 생각지도 못한 문제가 생길 수 있어요."

출력:
즉시 안정한 곳에 차를 세우고 엔진을 끄세요.
하지만 자칫 잘못된 정보나 생각없이
저렴한 제품만 쫓다가 생각지도 못한
문제가 생길 수 있어요.

❌ **잘못된 예시 1 (짧은 문장을 끊음):**
즉시 안정한 곳에
차를 세우고
엔진을 끄세요.
(← 30자 이하인데 끊음, 잘못!)

❌ **잘못된 예시 2 (단어 분리):**
하지만 자칫 잘못된
정보나 생각없이 저렴한
제품만 쫓다가 생각지도
못한 문제가 생길 수
있어요.
(← 단어/조사 분리, 잘못!)

**🚨 중요: 출력 형식 🚨**
- 분석 과정이나 설명은 절대 출력하지 마세요
- "문장별 길이 분석", "최적화된 결과", "적용된 규칙" 같은 메타 정보 금지
- 오직 포맷팅된 최종 텍스트만 출력하세요
- 예시처럼 줄바꿈된 텍스트만 그대로 출력

**이제 아래 텍스트를 위 규칙에 따라 포맷팅하고, 최종 결과만 출력하세요:**

${text}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const formattedText = response.content[0].type === 'text' 
      ? response.content[0].text.trim() 
      : text;

    // AI 응답 검증: 줄바꿈이 전혀 없거나 원본과 동일하면 규칙 기반 포맷터 사용
    const hasLineBreaks = formattedText.includes('\n');
    const isUnchanged = formattedText.replace(/\s+/g, '') === text.replace(/\s+/g, '');
    
    if (!hasLineBreaks && text.length > 50) {
      console.warn('AI 응답에 줄바꿈 없음, 규칙 기반 포맷터로 fallback');
      return formatForMobile(text);
    }
    
    if (isUnchanged && text.length > 100) {
      console.warn('AI 응답이 원본과 동일, 규칙 기반 포맷터로 fallback');
      return formatForMobile(text);
    }

    return formattedText;
  } catch (error) {
    console.error('AI 포맷팅 실패, 규칙 기반 포맷터 사용:', error);
    // AI 실패 시 규칙 기반 포맷터로 fallback
    return formatForMobile(text);
  }
}

/**
 * Validate line widths and fix any lines exceeding max width
 * Uses Claude to naturally break long lines
 */
async function validateAndFixLineWidths(text: string, maxWidth: number): Promise<string> {
  const lines = text.split('\n');
  const fixedLines: string[] = [];
  
  for (const line of lines) {
    // Empty lines pass through
    if (line.trim() === '') {
      fixedLines.push(line);
      continue;
    }
    
    // Calculate line length (Korean chars count as 1, others as 0.5)
    const lineLength = calculateKoreanLength(line);
    
    if (lineLength <= maxWidth) {
      // Line is within acceptable range
      fixedLines.push(line);
    } else {
      // Line is too long - ask Claude to break it naturally
      console.warn(`⚠️ Line too long (${lineLength} chars), asking Claude to fix: "${line.substring(0, 30)}..."`);
      const brokenLines = await fixLongLineWithClaude(line, maxWidth);
      fixedLines.push(...brokenLines);
    }
  }
  
  return fixedLines.join('\n');
}

/**
 * Ask Claude to naturally break a long line
 */
async function fixLongLineWithClaude(line: string, maxWidth: number): Promise<string[]> {
  try {
    const maxKoreanChars = Math.floor(maxWidth / 3);
    const prompt = `다음 문장이 한 줄에 ${maxWidth}바이트(한글 약 ${maxKoreanChars}자)를 초과합니다. 
이 문장을 의미가 자연스럽게 끊기도록 여러 줄로 나눠주세요.

**중요 규칙:**
- 각 줄은 최대 ${maxWidth}바이트 (한글 ${maxKoreanChars}자 기준)
- 한글 1자 = 3바이트, 영문/숫자 1자 = 1바이트
- 의미 단위로 자연스럽게 끊기
- 단어 중간에 끊지 않기
- 문맥이 자연스럽게 이어지도록

**원본 문장:**
${line}

**출력 형식:** 줄바꿈된 문장만 출력 (다른 설명 없이)`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const result = response.content[0].type === 'text' 
      ? response.content[0].text.trim() 
      : line;
    
    return result.split('\n').filter(l => l.trim());
  } catch (error) {
    console.error('Claude line fix failed, using emergency break:', error);
    return emergencyLineBreak(line, maxWidth);
  }
}

/**
 * Calculate byte length (Korean-aware)
 * 한글 = 3바이트, 영문/숫자 = 1바이트
 */
function calculateKoreanLength(line: string): number {
  let bytes = 0;
  for (const char of line) {
    // Korean, Chinese, Japanese, and fullwidth chars = 3 bytes
    if (/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uac00-\ud7a3]/.test(char)) {
      bytes += 3;
    } else {
      // ASCII and other chars = 1 byte
      bytes += 1;
    }
  }
  return bytes;
}

/**
 * Emergency line breaking for lines that are too long
 */
function emergencyLineBreak(line: string, maxWidth: number): string[] {
  const words = line.split(' ');
  const result: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testLength = calculateKoreanLength(testLine);
    
    if (testLength <= maxWidth) {
      currentLine = testLine;
    } else {
      // Current line is full, start new line
      if (currentLine) {
        result.push(currentLine);
      }
      
      // Check if single word is too long
      if (calculateKoreanLength(word) > maxWidth) {
        // Break the word at natural boundaries
        const brokenWord = breakLongWord(word, maxWidth);
        result.push(...brokenWord.slice(0, -1));
        currentLine = brokenWord[brokenWord.length - 1];
      } else {
        currentLine = word;
      }
    }
  }
  
  if (currentLine) {
    result.push(currentLine);
  }
  
  return result.length > 0 ? result : [line];
}

/**
 * Break a long word at natural boundaries (punctuation, Korean syllables)
 */
function breakLongWord(word: string, maxWidth: number): string[] {
  const result: string[] = [];
  let current = '';
  
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const testStr = current + char;
    
    if (calculateKoreanLength(testStr) > maxWidth) {
      if (current) {
        result.push(current);
      }
      current = char;
    } else {
      current = testStr;
    }
  }
  
  if (current) {
    result.push(current);
  }
  
  return result.length > 0 ? result : [word];
}

/**
 * 단락별로 AI 포맷팅 (대용량 텍스트 처리)
 */
export async function formatForMobileSmartBatch(text: string, maxBytes: number = 70): Promise<string> {
  if (!text || text.trim() === '') return text;

  // 단락별로 분리 (빈 줄 2개 이상)
  const paragraphs = text.split(/\n\n+/);
  
  const formattedParagraphs = await Promise.all(
    paragraphs.map(async (paragraph) => {
      if (paragraph.trim() === '') return paragraph;
      
      // 각 단락을 AI로 포맷팅
      return await formatForMobileSmart(paragraph.trim(), maxBytes);
    })
  );

  return formattedParagraphs.join('\n\n');
}
