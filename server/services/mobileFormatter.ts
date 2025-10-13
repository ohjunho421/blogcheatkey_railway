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
 * @param maxWidth 최대 줄 너비 (한글 기준, 기본값: 28)
 * @returns 포맷팅된 텍스트
 */
export function formatForMobile(text: string, maxWidth: number = 28): string {
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
 * 단일 줄을 한국어 기준으로 포맷팅 (단순하고 안전한 방식)
 */
function formatLineSimple(text: string, maxWidth: number): string {
  if (getKoreanLength(text) <= maxWidth) {
    return text;
  }

  const result: string[] = [];
  let pos = 0;

  while (pos < text.length) {
    // 현재 위치에서 시작해서 maxWidth 이내의 가장 긴 부분 찾기
    let end = pos + 1;
    let bestEnd = pos + 1;
    let safeEnd = -1;

    // maxWidth 내에서 가능한 한 긴 부분 찾기
    while (end <= text.length) {
      const segment = text.slice(pos, end);
      const length = getKoreanLength(segment);

      if (length > maxWidth) {
        break;
      }

      bestEnd = end;

      // 안전한 줄바꿈 위치 찾기
      if (end < text.length) {
        const nextChar = text[end];
        const prevChar = text[end - 1];
        
        // 공백 뒤는 안전
        if (prevChar === ' ' && nextChar !== ' ') {
          safeEnd = end;
        }
        // 쉼표, 마침표 뒤는 안전
        if (/[,，.。]/.test(prevChar) && nextChar === ' ') {
          safeEnd = end;
        }
      }
      
      end++;
    }

    // 안전한 위치가 있으면 그곳에서, 아니면 bestEnd에서 자르기
    const cutPos = safeEnd > pos ? safeEnd : bestEnd;
    let line = text.slice(pos, cutPos);

    // 줄 끝 공백 제거
    line = line.trimEnd();
    
    // 다음 위치로 이동 (공백 건너뛰기 - 하지만 안전하게)
    pos = cutPos;
    
    // 공백만 건너뛰기 (문자는 절대 건너뛰지 않음)
    while (pos < text.length && text[pos] === ' ') {
      pos++;
    }

    // 줄 추가 (비어있지 않으면)
    if (line.length > 0) {
      result.push(line);
    }

    // 무한 루프 방지
    if (pos === cutPos && pos < text.length) {
      // 진전이 없으면 최소 1글자는 포함
      const forcedLine = text[pos];
      if (forcedLine) {
        if (result.length > 0) {
          result[result.length - 1] += forcedLine;
        } else {
          result.push(forcedLine);
        }
      }
      pos++;
    }
  }

  // 구두점 규칙 적용
  return applyPunctuationRulesSimple(result).join('\n');
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
