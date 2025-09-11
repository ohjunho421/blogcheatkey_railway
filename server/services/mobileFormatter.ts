/**
 * 모바일용 텍스트 포맷터
 * 구두점이 단독으로 줄에 나타나는 것을 방지하고, 한국어에 최적화된 줄바꿈 처리
 */

// 줄 시작에 올 수 없는 구두점들 (한국어/영어)
const LEADING_PUNCTUATION = new Set([
  ',', '.', ';', ':', '!', '?', '…', ')', '%', '"', "'", '"',
  '、', '，', '。', '！', '？', '：', '；', '…', 
  '〉', '》', '」', '』', '〕', '）', '］'
]);

// 문장 끝 구두점들
const SENTENCE_ENDINGS = /([.!?…？！。]+["'"')\]\s]*)/g;

/**
 * 텍스트를 모바일에 최적화된 형태로 포맷팅
 * @param text 원본 텍스트
 * @param maxWidth 최대 줄 너비 (기본값: 30)
 * @returns 포맷팅된 텍스트
 */
export function formatForMobile(text: string, maxWidth: number = 30): string {
  if (!text || text.trim() === '') return text;

  // 1. 텍스트 정규화
  const normalized = text
    // CR/LF 정규화
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // 3개 이상의 연속 줄바꿈을 2개로 축소
    .replace(/\n{3,}/g, '\n\n')
    // 줄 끝 공백 제거
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    // 구두점 주변의 zero-width 문자 제거
    .replace(/[\u200B\uFEFF\u2060]/g, '');

  // 2. 단락별로 처리
  const paragraphs = normalized.split('\n\n');
  const formattedParagraphs = paragraphs.map(paragraph => {
    if (paragraph.trim() === '') return paragraph;
    
    // 단락 내 줄바꿈이 있는 경우 보존
    const lines = paragraph.split('\n');
    const formattedLines = lines.map(line => {
      if (line.trim() === '') return line;
      return formatLine(line.trim(), maxWidth);
    });
    
    return formattedLines.join('\n');
  });

  return formattedParagraphs.join('\n\n');
}

/**
 * 단일 줄을 포맷팅
 * @param line 원본 줄
 * @param maxWidth 최대 줄 너비
 * @returns 포맷팅된 줄들
 */
function formatLine(line: string, maxWidth: number): string {
  if (line.length <= maxWidth) return line;

  // 1. 문장 단위로 분리 시도
  const sentences = splitBySentences(line);
  const formattedLines: string[] = [];
  let currentLine = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    // 현재 줄에 문장을 추가할 수 있는지 확인
    const potentialLine = currentLine ? `${currentLine} ${trimmedSentence}` : trimmedSentence;
    
    if (potentialLine.length <= maxWidth) {
      currentLine = potentialLine;
    } else {
      // 현재 줄이 있으면 추가
      if (currentLine) {
        formattedLines.push(currentLine);
      }
      
      // 문장이 여전히 너무 길면 쉼표/절 단위로 분리
      if (trimmedSentence.length > maxWidth) {
        const subLines = formatLongSentence(trimmedSentence, maxWidth);
        formattedLines.push(...subLines.slice(0, -1));
        currentLine = subLines[subLines.length - 1] || '';
      } else {
        currentLine = trimmedSentence;
      }
    }
  }

  if (currentLine) {
    formattedLines.push(currentLine);
  }

  // 2. 구두점 규칙 적용
  return applyPunctuationRules(formattedLines).join('\n');
}

/**
 * 문장 단위로 분리
 */
function splitBySentences(text: string): string[] {
  // Intl.Segmenter를 사용할 수 있으면 사용
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter('ko', { granularity: 'sentence' });
      const segments = Array.from(segmenter.segment(text));
      return segments.map(segment => segment.segment);
    } catch (e) {
      // fallback to regex
    }
  }

  // fallback: 정규식 사용
  const sentences = text.split(SENTENCE_ENDINGS).filter(s => s.trim());
  const result: string[] = [];
  
  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i];
    const ending = sentences[i + 1] || '';
    result.push((sentence + ending).trim());
  }
  
  return result.length > 0 ? result : [text];
}

/**
 * 긴 문장을 쉼표/절 단위로 분리
 */
function formatLongSentence(sentence: string, maxWidth: number): string[] {
  // 쉼표, 연결사 등으로 분리 시도
  const parts = sentence.split(/([,，、]\s*|\s+(?:그리고|또한|하지만|그러나|따라서|그래서)\s+)/);
  const lines: string[] = [];
  let currentLine = '';

  for (const part of parts) {
    if (!part.trim()) continue;
    
    const potentialLine = currentLine ? currentLine + part : part;
    
    if (potentialLine.length <= maxWidth) {
      currentLine = potentialLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      
      // 부분이 여전히 너무 길면 강제로 분리
      if (part.length > maxWidth) {
        const forcedLines = forceBreakLine(part, maxWidth);
        lines.push(...forcedLines.slice(0, -1));
        currentLine = forcedLines[forcedLines.length - 1] || '';
      } else {
        currentLine = part;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [sentence];
}

/**
 * 강제로 줄을 분리 (마지막 수단)
 */
function forceBreakLine(text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let currentLine = '';
  
  // 그래피컬 문자 단위로 분리 시도
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' });
      const segments = Array.from(segmenter.segment(text));
      
      for (const segment of segments) {
        if (currentLine.length + segment.segment.length <= maxWidth) {
          currentLine += segment.segment;
        } else {
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = segment.segment;
        }
      }
    } catch (e) {
      // fallback
    }
  }
  
  // fallback: 문자 단위 분리
  if (lines.length === 0) {
    for (const char of text) {
      if (currentLine.length + char.length <= maxWidth) {
        currentLine += char;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = char;
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [text];
}

/**
 * 구두점 규칙 적용 - 줄 시작에 구두점이 오지 않도록 조정
 */
function applyPunctuationRules(lines: string[]): string[] {
  if (lines.length <= 1) return lines;

  const result: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const trimmedLine = currentLine.trim();
    
    // 빈 줄이거나 구두점으로만 이루어진 줄은 이전 줄에 병합
    if (!trimmedLine || /^[,，。！？：；…)）\]］}>》」』〕%"'"']+$/.test(trimmedLine)) {
      if (result.length > 0) {
        result[result.length - 1] += (' ' + trimmedLine);
      }
      continue;
    }
    
    // 줄이 구두점으로 시작하는 경우
    if (trimmedLine.length > 0 && LEADING_PUNCTUATION.has(trimmedLine[0])) {
      if (result.length > 0) {
        // 이전 줄에 추가 (2글자까지 오버플로우 허용)
        result[result.length - 1] += trimmedLine;
        continue;
      }
    }
    
    result.push(currentLine);
  }
  
  return result;
}