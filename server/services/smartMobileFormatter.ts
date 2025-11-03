/**
 * AI 기반 스마트 모바일 포맷터
 * 한국어 문맥과 의미를 이해하고 가독성 높은 줄바꿈 처리
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * AI를 활용한 스마트 모바일 줄바꿈 포맷팅
 * @param text 원본 텍스트
 * @param maxWidth 최대 줄 너비 (한글 기준, 기본값: 27)
 * @returns 포맷팅된 텍스트
 */
export async function formatForMobileSmart(text: string, maxWidth: number = 27): Promise<string> {
  if (!text || text.trim() === '') return text;

  try {
    const prompt = `당신은 모바일 가독성 전문가입니다. 주어진 한국어 텍스트를 모바일 화면에 최적화된 형태로 줄바꿈해주세요.

**중요 규칙:**
1. 한 줄은 한글 기준 20-${maxWidth}자 범위로 작성하되, 가능하면 ${maxWidth}자에 가깝게 최대한 채워주세요
2. 너무 자주 줄바꿈하지 말고, 한 줄을 최대한 활용하세요
3. 의미가 자연스럽게 이어지면 같은 줄에 계속 작성하세요
4. 문장이 완결되거나 주제가 크게 전환될 때만 줄바꿈하세요
5. 단어는 절대 중간에 끊지 마세요
6. 구두점(마침표, 느낌표, 물음표) 뒤에도 문맥이 이어지면 계속 한 줄에 작성하세요
7. 단락 구분(빈 줄 2개)은 유지하세요
8. 제목/소제목은 한 줄로 유지하세요
9. **절대로 한 줄이 ${maxWidth}자를 넘지 않도록 하세요**

**예시:**
입력: "차량 연비가 예전 같지 않다고 느끼시는 분들이 많습니다. 특히 출퇴근길에 주유소를 자주 들르게 되면서 '왜 이렇게 기름이 빨리 닳지?' 하는 생각이 드시죠."

출력:
차량 연비가 예전 같지 않다고 느끼시는 분들이 많습니다.
특히 출퇴근길에 주유소를 자주 들르게 되면서
'왜 이렇게 기름이 빨리 닳지?' 하는 생각이 드시죠.

이제 아래 텍스트를 위 규칙에 따라 포맷팅해주세요. 포맷팅된 텍스트만 출력하고, 다른 설명은 추가하지 마세요.

---

${text}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
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

    // 🔥 POST-PROCESSING: Validate and fix lines that exceed max width
    const validated = validateAndFixLineWidths(formattedText, maxWidth);
    return validated;
  } catch (error) {
    console.error('AI 포맷팅 실패, 기본 포맷터 사용:', error);
    // AI 실패 시 원본 반환
    return text;
  }
}

/**
 * Validate line widths and fix any lines exceeding max width
 */
function validateAndFixLineWidths(text: string, maxWidth: number): string {
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
      // Line is too long - emergency break it
      console.warn(`⚠️ Line too long (${lineLength} chars), breaking: "${line.substring(0, 30)}..."`);
      const brokenLines = emergencyLineBreak(line, maxWidth);
      fixedLines.push(...brokenLines);
    }
  }
  
  return fixedLines.join('\n');
}

/**
 * Calculate Korean-aware line length
 */
function calculateKoreanLength(line: string): number {
  let length = 0;
  for (const char of line) {
    // Korean, Chinese, Japanese, and fullwidth chars count as 1
    if (/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uac00-\ud7a3]/.test(char)) {
      length += 1;
    } else {
      // ASCII and other chars count as 0.5
      length += 0.5;
    }
  }
  return Math.ceil(length);
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
export async function formatForMobileSmartBatch(text: string, maxWidth: number = 27): Promise<string> {
  if (!text || text.trim() === '') return text;

  // 단락별로 분리 (빈 줄 2개 이상)
  const paragraphs = text.split(/\n\n+/);
  
  const formattedParagraphs = await Promise.all(
    paragraphs.map(async (paragraph) => {
      if (paragraph.trim() === '') return paragraph;
      
      // 각 단락을 AI로 포맷팅
      return await formatForMobileSmart(paragraph.trim(), maxWidth);
    })
  );

  return formattedParagraphs.join('\n\n');
}
