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

// 한국어 조사들 (앞 단어와 분리되면 안됨)
const KOREAN_PARTICLES = new Set([
  '은', '는', '이', '가', '을', '를', '에', '에서', '로', '으로', '와', '과', '의', '도', '만', '까지', '부터', '처럼', '같이', '보다', '마다', '조차', '라도', '나마', '이나', '라면'
]);

// 한국어 연결사들 (자연스러운 줄바꿈 포인트)
const KOREAN_CONJUNCTIONS = ['그리고', '또한', '하지만', '그러나', '따라서', '그래서'];

// 문장 끝 구두점들
const SENTENCE_ENDINGS = /([.!?…？！。]+["'"')\]\s]*)/g;

/**
 * 한글 문자 길이 계산 (한글 1, 영어/숫자 0.6, 기타 0.5)
 */
function getKoreanLength(text: string): number {
  let length = 0;
  for (const char of text) {
    if (/[가-힣]/.test(char)) {
      length += 1; // 한글
    } else if (/[a-zA-Z0-9]/.test(char)) {
      length += 0.6; // 영어, 숫자
    } else {
      length += 0.5; // 기타 문자
    }
  }
  return length;
}

/**
 * 자연스러운 줄바꿈 위치인지 체크 (단순화된 규칙)
 */
function isSafeBreakPoint(text: string, position: number): boolean {
  if (position >= text.length) return true;
  if (position === 0) return true;
  
  const remainingText = text.slice(position);
  const nextChar = remainingText[0];
  
  // 구두점으로 시작하면 줄바꿈 안함
  if (LEADING_PUNCTUATION.has(nextChar)) return false;
  
  // 다음 단어가 조사로 시작하면 줄바꿈 안함
  const nextWord = remainingText.split(/\s+/)[0];
  for (const particle of Array.from(KOREAN_PARTICLES)) {
    if (nextWord.startsWith(particle)) return false;
  }
  
  return true;
}

/**
 * 자연스러운 줄바꿈 위치 찾기
 */
function findSafeBreakPoints(text: string): number[] {
  const safePoints: number[] = [0]; // 시작점
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    // 공백 다음
    if (char === ' ' && nextChar && nextChar !== ' ') {
      if (isSafeBreakPoint(text, i + 1)) {
        safePoints.push(i + 1);
      }
    }
    
    // 쉼표나 마침표 다음
    if ((char === ',' || char === '.' || char === '，' || char === '。') && nextChar === ' ') {
      if (isSafeBreakPoint(text, i + 2)) {
        safePoints.push(i + 2);
      }
    }
    
    // 연결사 다음
    for (const conjunction of KOREAN_CONJUNCTIONS) {
      if (text.slice(i).startsWith(conjunction + ' ')) {
        const afterPos = i + conjunction.length + 1;
        if (isSafeBreakPoint(text, afterPos)) {
          safePoints.push(afterPos);
        }
      }
    }
  }
  
  return safePoints;
}

/**
 * 한국어 기준 자연스러운 모바일 줄바꿈 포맷팅
 * @param text 원본 텍스트
 * @param maxWidth 최대 줄 너비 (한글 기준, 기본값: 22)
 * @returns 포맷팅된 텍스트
 */
export function formatForMobile(text: string, maxWidth: number = 22): string {
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
 * 단일 줄을 한국어 기준으로 포맷팅
 * @param line 원본 줄
 * @param maxWidth 최대 줄 너비
 * @returns 포맷팅된 줄들
 */
function formatLine(line: string, maxWidth: number): string {
  if (getKoreanLength(line) <= maxWidth) return line;

  // 1. 문장 단위로 분리 시도
  const sentences = splitBySentences(line);
  const formattedLines: string[] = [];
  let currentLine = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    // 현재 줄에 문장을 추가할 수 있는지 한글 길이로 확인
    const potentialLine = currentLine ? `${currentLine} ${trimmedSentence}` : trimmedSentence;
    
    if (getKoreanLength(potentialLine) <= maxWidth) {
      currentLine = potentialLine;
    } else {
      // 현재 줄이 있으면 추가
      if (currentLine) {
        formattedLines.push(currentLine);
      }
      
      // 문장이 여전히 너무 길면 한국어 규칙으로 분리
      if (getKoreanLength(trimmedSentence) > maxWidth) {
        const subLines = formatLongSentenceKorean(trimmedSentence, maxWidth);
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
 * 긴 문장을 한국어 규칙에 맞게 분리
 */
function formatLongSentenceKorean(sentence: string, maxWidth: number): string[] {
  // 쉼표, 연결사 등으로 분리 시도
  const parts = sentence.split(/([,，、]\s*|\s+(?:그리고|또한|하지만|그러나|따라서|그래서)\s+)/);
  const lines: string[] = [];
  let currentLine = '';

  for (const part of parts) {
    if (!part.trim()) continue;
    
    const potentialLine = currentLine ? currentLine + part : part;
    
    if (getKoreanLength(potentialLine) <= maxWidth) {
      currentLine = potentialLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      
      // 부분이 여전히 너무 길면 한국어 규칙으로 강제 분리
      if (getKoreanLength(part) > maxWidth) {
        const forcedLines = forceBreakLineKorean(part, maxWidth);
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
 * 자연스러운 한국어 줄바꿈 (lastSafePos 방식)
 */
function forceBreakLineKorean(text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const safeBreakPoints = findSafeBreakPoints(text);
  
  let currentStart = 0;
  
  while (currentStart < text.length) {
    let bestEnd = currentStart;
    let lastSafeEnd = currentStart;
    
    // 현재 위치에서 maxWidth 내에서 가장 긴 부분 찾기
    for (let i = currentStart; i < text.length; i++) {
      const segment = text.slice(currentStart, i + 1);
      const segmentLength = getKoreanLength(segment);
      
      if (segmentLength <= maxWidth) {
        bestEnd = i + 1;
        
        // 안전한 줄바꿈 포인트인지 확인
        if (safeBreakPoints.includes(i + 1) || i === text.length - 1) {
          lastSafeEnd = i + 1;
        }
      } else {
        break;
      }
    }
    
    // 안전한 줄바꿈 위치가 있으면 그곳에서, 없으면 최대한 긴 곳에서 자르기
    const endPos = lastSafeEnd > currentStart ? lastSafeEnd : bestEnd;
    const line = text.slice(currentStart, endPos);
    
    // trim()으로 단어가 지워지지 않도록 주의깊게 처리
    const trimmedLine = line.replace(/^\s+/, '').replace(/\s+$/, '');
    
    if (trimmedLine && trimmedLine.length > 0) {
      lines.push(trimmedLine);
    }
    
    currentStart = endPos;
    
    // 무한루프 방지 - 진전이 없으면 한 글자씩 전진
    if (currentStart === endPos && endPos < text.length) {
      // 공백이 아닌 문자까지 건너뛰기
      while (currentStart < text.length && /\s/.test(text[currentStart])) {
        currentStart++;
      }
      // 여전히 같은 위치면 한 글자 전진
      if (currentStart === endPos) {
        currentStart++;
      }
    }
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
      if (result.length > 0 && trimmedLine) {
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
    
    result.push(trimmedLine || currentLine);
  }
  
  return result;
}