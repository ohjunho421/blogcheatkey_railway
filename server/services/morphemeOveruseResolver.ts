import Anthropic from '@anthropic-ai/sdk';
import { extractKoreanMorphemes, extractKeywordComponents, findKeywordComponentMatches } from './morphemeAnalyzer';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY_ENV_VAR || "default_key",
});

const MODEL = 'claude-opus-4-20250514';

interface OveruseAnalysis {
  component: string;
  currentCount: number;
  targetCount: number;
  excessCount: number;
  sentences: string[];
}

export async function resolveMorphemeOveruse(
  content: string,
  keyword: string
): Promise<{ content: string; success: boolean; adjustments: string[] }> {
  console.log('🔧 Starting morpheme overuse resolution...');
  
  const keywordComponents = extractKeywordComponents(keyword);
  const contentMorphemes = extractKoreanMorphemes(content);
  
  // 모든 형태소의 출현 빈도 계산
  const morphemeFrequency = new Map<string, number>();
  contentMorphemes.forEach(morpheme => {
    const cleanMorpheme = morpheme.toLowerCase();
    morphemeFrequency.set(cleanMorpheme, (morphemeFrequency.get(cleanMorpheme) || 0) + 1);
  });
  
  const overusedComponents: OveruseAnalysis[] = [];
  
  // 강력한 형태소 빈도 제한 적용
  const maxKeywordMorpheme = 17;  // 키워드 형태소 최대 17회 (15-17회 범위)
  const maxNonKeywordMorpheme = 13; // 일반 형태소 최대 13회 (14회 미만)
  
  console.log(`강력한 빈도 제한: 키워드 형태소 최대 ${maxKeywordMorpheme}회, 일반 형태소 최대 ${maxNonKeywordMorpheme}회`);
  
  // 모든 형태소 검사
  for (const [morpheme, count] of Array.from(morphemeFrequency.entries())) {
    const isKeywordComponent = keywordComponents.some(comp => comp.toLowerCase() === morpheme);
    let targetCount: number;
    let shouldProcess = false;
    
    if (isKeywordComponent) {
      // 키워드 형태소: 17회 초과 절대 금지 (15-17회 범위)
      targetCount = maxKeywordMorpheme;
      shouldProcess = count > maxKeywordMorpheme;
    } else {
      // 일반 형태소: 14회 초과 절대 금지
      targetCount = maxNonKeywordMorpheme;
      shouldProcess = count > maxNonKeywordMorpheme;
    }
    
    if (shouldProcess) {
      const sentences = findSentencesWithComponent(content, morpheme);
      
      overusedComponents.push({
        component: morpheme,
        currentCount: count,
        targetCount,
        excessCount: count - targetCount,
        sentences
      });
      
      console.log(`❌ "${morpheme}" 과다 사용: ${count}회 (${targetCount}회 초과 ${count - targetCount}회) ${isKeywordComponent ? '[키워드 형태소]' : '[일반 형태소]'}`);
    }
  }
  
  if (overusedComponents.length === 0) {
    return { content, success: true, adjustments: [] };
  }
  
  // Claude를 사용하여 자연스럽게 조정
  const adjustedContent = await adjustOverusedMorphemes(content, overusedComponents, keyword);
  
  // 조정 결과 검증
  const newMorphemes = extractKoreanMorphemes(adjustedContent);
  
  // 새로운 형태소 빈도 계산
  const newMorphemeFrequency = new Map<string, number>();
  newMorphemes.forEach(morpheme => {
    const cleanMorpheme = morpheme.toLowerCase();
    newMorphemeFrequency.set(cleanMorpheme, (newMorphemeFrequency.get(cleanMorpheme) || 0) + 1);
  });
  
  // 새로운 키워드 형태소 최소값 계산
  const newKeywordMorphemeCounts = keywordComponents.map(comp => {
    const lowerComp = comp.toLowerCase();
    return newMorphemeFrequency.get(lowerComp) || 0;
  });
  const newMinKeywordCount = Math.min(...newKeywordMorphemeCounts);
  const newMaxAllowedForNonKeyword = Math.max(14, newMinKeywordCount - 1);
  
  const adjustments: string[] = [];
  let allResolved = true;
  
  for (const analysis of overusedComponents) {
    const newCount = newMorphemeFrequency.get(analysis.component.toLowerCase()) || 0;
    const isKeywordComponent = keywordComponents.some(comp => comp.toLowerCase() === analysis.component.toLowerCase());
    const expectedTarget = isKeywordComponent ? 17 : newMaxAllowedForNonKeyword;
    
    if (newCount <= expectedTarget) {
      adjustments.push(`✅ "${analysis.component}": ${analysis.currentCount}회 → ${newCount}회`);
    } else {
      adjustments.push(`❌ "${analysis.component}": ${analysis.currentCount}회 → ${newCount}회 (목표: ${expectedTarget}회 이하)`);
      allResolved = false;
    }
  }
  
  return {
    content: adjustedContent,
    success: allResolved,
    adjustments
  };
}

function findSentencesWithComponent(content: string, component: string): string[] {
  const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 10);
  const matchingSentences: string[] = [];
  
  for (const sentence of sentences) {
    // 형태소가 포함된 문장 찾기 (조사, 어미 변화 고려)
    const morphemes = extractKoreanMorphemes(sentence.trim());
    if (morphemes.some(morpheme => morpheme.includes(component) || component.includes(morpheme))) {
      matchingSentences.push(sentence.trim());
    }
  }
  
  return matchingSentences;
}

async function adjustOverusedMorphemes(
  content: string,
  overusedComponents: OveruseAnalysis[],
  keyword: string
): Promise<string> {
  const systemPrompt = `당신은 SEO 블로그 편집 전문가입니다. 키워드 형태소가 과다 사용된 글을 자연스럽게 조정해야 합니다.

🚨 엄격한 형태소 조정 원칙 🚨:
1. 키워드를 이루는 형태소가 출현한 문장들을 모두 찾는다
2. 해당 문장을 삭제하거나 형태소를 삭제해도 문맥상 어색하지 않다면 삭제해서 횟수를 조절한다
3. 문장을 삭제하면 글이 어색해지거나 글자수가 모자르다면 동의어나 대명사로 대체하거나 형태소만 삭제한다
4. 중요한 것은 삭제해도 문맥상 자연스러워야 한다는 점
5. 전체적인 글의 흐름과 의미는 절대 변경하지 않음
6. 서론 비중(35-40%)과 설득력 있는 글쓰기 구조는 반드시 유지

절대 금지사항:
- 글의 핵심 의미 변경
- 부자연스러운 문장 구조
- SEO 최적화 범위(1500-1700자) 벗어남
- 완전한 키워드 "${keyword}" 5회 조건 위반`;

  const overuseInfo = overusedComponents.map(comp => 
    `"${comp.component}": 현재 ${comp.currentCount}회 → 목표 ${comp.targetCount}회 (${comp.excessCount}회 줄이기 필요)`
  ).join('\n');

  const userPrompt = `다음 블로그 글에서 과다 사용된 키워드 형태소를 자연스럽게 조정해주세요.

키워드: "${keyword}"

과다 사용된 형태소:
${overuseInfo}

원본 글:
${content}

조정 방법:
1. 과다 사용된 형태소가 포함된 문장들을 식별
2. 삭제해도 문맥상 자연스러운 문장이나 단어는 제거
3. 중요한 문장은 동의어, 대명사, 다른 표현으로 대체
4. 글의 자연스러움과 가독성 최우선

조건:
- 완전한 키워드 "${keyword}" 5회 유지
- 개별 형태소는 15-17회 범위로 조정
- 공백 제외 1500-1700자 범위 유지
- 서론-본론-결론 구조 유지
- 자연스러운 문체와 흐름 유지

조정된 전체 글을 반환해주세요.`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
      temperature: 0.3, // 낮은 temperature로 일관성 있는 편집
    });

    const messageContent = response.content[0];
    if (messageContent.type !== 'text') {
      throw new Error("Unexpected response format from Claude");
    }

    return messageContent.text;
  } catch (error) {
    console.error('Morpheme adjustment error:', error);
    // 실패 시 원본 반환
    return content;
  }
}