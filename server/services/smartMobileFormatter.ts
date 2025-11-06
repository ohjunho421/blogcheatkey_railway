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

🚨 **절대적인 규칙 (반드시 지켜야 함):**
- **한 줄은 절대 ${maxWidth}자(한글 기준)를 초과할 수 없습니다**
- 이것은 가장 중요한 제약 조건입니다
- 각 줄의 글자 수를 세면서 작업하세요

📝 **줄바꿈 가이드:**
1. 한 줄은 20-${maxWidth}자 사이로 작성 (${maxWidth}자에 가깝게)
2. 의미 단위로 자연스럽게 끊기
3. 문장이 완결되거나 주제가 전환될 때 줄바꿈
4. 단어는 절대 중간에 끊지 않기
5. 구두점(. ! ?) 뒤에도 문맥이 이어지면 같은 줄 유지 가능
6. 단락 구분(빈 줄)은 유지
7. 제목/소제목은 한 줄로

❌ **절대 하지 말 것:**
- ${maxWidth}자를 넘는 줄 작성
- 단어 중간에 줄바꿈
- 부자연스러운 위치에서 끊기

✅ **예시:**
입력: "차량 연비가 예전 같지 않다고 느끼시는 분들이 많습니다. 특히 출퇴근길에 주유소를 자주 들르게 되면서 왜 이렇게 기름이 빨리 닳지 하는 생각이 드시죠."

출력:
차량 연비가 예전 같지 않다고
느끼시는 분들이 많습니다.
특히 출퇴근길에 주유소를
자주 들르게 되면서
왜 이렇게 기름이 빨리 닳지
하는 생각이 드시죠.

이제 아래 텍스트를 위 규칙에 따라 포맷팅해주세요. **각 줄이 ${maxWidth}자를 절대 넘지 않도록** 주의하세요.

---

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

    return formattedText;
  } catch (error) {
    console.error('AI 포맷팅 실패, 기본 포맷터 사용:', error);
    // AI 실패 시 원본 반환
    return text;
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
    const prompt = `다음 문장이 한 줄에 ${maxWidth}자를 초과합니다. 
이 문장을 의미가 자연스럽게 끊기도록 여러 줄로 나눠주세요.

**중요 규칙:**
- 각 줄은 최대 ${maxWidth}자 (한글 기준)
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
