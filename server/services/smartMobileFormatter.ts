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
1. 한 줄의 최대 길이는 한글 기준 약 ${maxWidth}자입니다
2. 의미 단위로 끊어서 읽기 좋게 줄바꿈하세요
3. 문장 중간에 임의로 끊지 말고, 자연스러운 호흡 단위로 줄바꿈하세요
4. 같은 주제/맥락이면 한 줄에 유지하되, 주제가 전환되면 줄바꿈하세요
5. 단어는 절대 중간에 끊지 마세요
6. 구두점(마침표, 느낌표, 물음표)으로만 끊지 말고, 의미 전환을 우선 고려하세요
7. 단락 구분(빈 줄 2개)은 유지하세요
8. 제목/소제목은 한 줄로 유지하세요

**예시:**
입력: "차량 연비가 예전 같지 않다고 느끼시는 분들이 많습니다. 특히 출퇴근길에 주유소를 자주 들르게 되면서 '왜 이렇게 기름이 빨리 닳지?' 하는 생각이 드시죠."

출력:
차량 연비가 예전 같지 않다고
느끼시는 분들이 많습니다.
특히 출퇴근길에 주유소를
자주 들르게 되면서
'왜 이렇게 기름이 빨리 닳지?'
하는 생각이 드시죠.

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

    return formattedText;
  } catch (error) {
    console.error('AI 포맷팅 실패, 기본 포맷터 사용:', error);
    // AI 실패 시 원본 반환
    return text;
  }
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
