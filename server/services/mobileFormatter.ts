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
 * 한국어 기준 자연스러운 모바일 줄바꿈 포맷팅
 * @param text 원본 텍스트
 * @param maxWidth 최대 줄 너비 (한글 기준, 기본값: 27)
 * @returns 포맷팅된 텍스트
 */
export function formatForMobile(text: string, maxWidth: number = 27): string {
  if (!text || text.trim() === '') return text;

  // 1. 텍스트 정규화
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[\u200B\uFEFF\u2060]/g, '');

  // 2. 단락별로 처리
  const paragraphs = normalized.split('\n\n');
  const formattedParagraphs = paragraphs.map(paragraph => {
    if (paragraph.trim() === '') return paragraph;
    
    const lines = paragraph.split('\n');
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      return formatLineSimple(trimmed, maxWidth);
    }).filter(l => l);
    
    return formattedLines.join('\n');
  });

  return formattedParagraphs.join('\n\n');
}

/**
 * 단일 줄을 한국어 기준으로 포맷팅 (단어 단위 보존 - 절대 단어 중간 끊김 없음)
 */
function formatLineSimple(text: string, maxWidth: number): string {
  if (getKoreanLength(text) <= maxWidth) {
    return text;
  }

  // 텍스트를 의미 단위로 분리 (공백, 구두점 기준)
  const tokens = tokenizeText(text);
  
  const result: string[] = [];
  let currentLine = '';

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const testLine = currentLine + token;
    const testLength = getKoreanLength(testLine);

    // 문장 종결 부호 뒤 공백은 강제 줄바꿈 위치로 우선 고려
    const endsWithSentence = /[.!?。！？]\s*$/.test(currentLine.trim());
    const nextTokenStartsNew = token.trim().length > 0 && token !== ' ';
    
    // 현재 줄이 문장 종결로 끝나고, 다음 토큰이 새 내용이면 줄바꿈 우선
    if (endsWithSentence && nextTokenStartsNew && currentLine.trim().length > 0) {
      result.push(currentLine.trim());
      currentLine = token.trim();
      continue;
    }

    // 현재 줄에 추가해도 maxWidth를 넘지 않으면 추가
    if (testLength <= maxWidth) {
      currentLine = testLine;
    } else {
      // maxWidth를 초과하는 경우
      if (currentLine.length > 0) {
        // 현재 줄 저장하고 새 줄 시작
        result.push(currentLine.trim());
        currentLine = token.trim();
      } else {
        // 현재 줄이 비어있는데 토큰 하나가 maxWidth를 초과하는 경우
        // 토큰이 너무 길면 강제로 포함 (단어는 절대 안 자름)
        currentLine = token;
      }
    }
  }

  // 마지막 줄 추가
  if (currentLine.trim().length > 0) {
    result.push(currentLine.trim());
  }

  // 구두점 규칙 적용
  return applyPunctuationRulesSimple(result).join('\n');
}

/**
 * 텍스트를 의미 단위 토큰으로 분리
 * 공백과 구두점을 기준으로 하되, 단어는 절대 분리하지 않음
 */
function tokenizeText(text: string): string[] {
  const tokens: string[] = [];
  let currentToken = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // 공백인 경우
    if (char === ' ') {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
      tokens.push(' '); // 공백도 토큰으로 추가
    }
    // 구두점인 경우 (문장 끝, 절 구분)
    else if (/[.!?,;:。！？，；：]/.test(char)) {
      if (currentToken) {
        tokens.push(currentToken + char); // 구두점은 앞 단어에 붙임
        currentToken = '';
      } else {
        tokens.push(char);
      }
    }
    // 일반 문자
    else {
      currentToken += char;
    }
  }

  // 마지막 토큰 추가
  if (currentToken) {
    tokens.push(currentToken);
  }

  return tokens;
}

/**
 * 구두점 규칙 적용 (단순화 버전)
 */
function applyPunctuationRulesSimple(lines: string[]): string[] {
  if (lines.length <= 1) return lines;

  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!line || !line.trim()) continue;

    // 구두점으로만 이루어진 줄은 이전 줄에 병합
    if (/^[,，。！？：；…)）\]］}>》」』〕%"'"'\s]+$/.test(line)) {
      if (result.length > 0) {
        result[result.length - 1] += line;
      }
      continue;
    }

    // 구두점으로 시작하는 줄은 이전 줄에 병합
    const firstChar = line.trim()[0];
    if (firstChar && LEADING_PUNCTUATION.has(firstChar)) {
      if (result.length > 0) {
        result[result.length - 1] += line.trimStart();
        continue;
      }
    }

    // 조사로 시작하는 줄은 이전 줄에 병합
    const firstWord = line.trim().split(/\s+/)[0];
    if (firstWord && KOREAN_PARTICLES.has(firstWord)) {
      if (result.length > 0) {
        result[result.length - 1] += ' ' + line.trimStart();
        continue;
      }
    }

    result.push(line);
  }

  return result;
}
