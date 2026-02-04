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
  const systemPrompt = `당신은 SEO 최적화 전문가입니다. 형태소 과다 사용을 반드시 해결해야 합니다.

🔥 절대적 형태소 제한 규칙 🔥:
1. **키워드 형태소**: 정확히 15-17회만 허용 (18회 이상 절대 금지)
2. **일반 형태소**: 14회 미만으로 제한 (14회 이상 절대 금지)
3. **과다 사용 형태소 식별**: 제한을 초과한 모든 형태소를 찾아 반드시 조정
4. **우선 순위 조정 방법**:
   a) 형태소가 포함된 불필요한 문장 완전 삭제
   b) 문장 삭제가 어렵다면 형태소만 동의어로 대체
   c) 동의어가 없다면 대명사("이것", "그것", "해당" 등)로 대체
   d) 최후 수단으로 형태소를 포함한 구절 삭제

🎯 조정 목표:
- 과다 사용된 형태소의 출현 횟수를 목표치까지 정확히 줄이기
- 글의 자연스러움 유지하되, 형태소 제한이 최우선
- 키워드 "${keyword}" 완전형은 5-7회 유지

❌ 절대 금지:
- 형태소 제한 미준수 (가장 중요)
- 글자수 1700자 미만 또는 2000자 초과
- 키워드 완전형 5회 미만
- 깨진 단어 사용 (예: "크오일", "브레이제", "브레이기", "주기수", "교체수")
- 존재하지 않는 한국어 단어 조합

⚠️ 자연스러운 한국어 규칙:
- 형태소를 조정할 때 단어를 쪼개거나 잘라서 깨진 단어를 만들지 마세요
- 반드시 완전한 단어 단위로만 수정하세요
- 수정 후 글 전체를 읽어보고 의미가 통하지 않는 단어가 없는지 확인하세요`;

  const overuseInfo = overusedComponents.map(comp => 
    `"${comp.component}": 현재 ${comp.currentCount}회 → 목표 ${comp.targetCount}회 (${comp.excessCount}회 줄이기 필요)`
  ).join('\n');

  const userPrompt = `🚨 중요: 다음 글에서 과다 사용된 형태소를 반드시 목표 횟수로 줄여주세요.

키워드: "${keyword}"

⚠️ 과다 사용 형태소 (반드시 조정 필요):
${overuseInfo}

원본 글:
${content}

📝 조정 절차 (순서대로 적용):
1. **과다 형태소 문장 식별**: 각 과다 형태소가 포함된 모든 문장 찾기
2. **불필요한 문장 삭제**: 삭제해도 글의 흐름이 유지되는 문장 완전 제거
3. **형태소 교체**: 동의어, 유의어, 대명사로 과다 형태소 대체
4. **구절 수정**: 형태소를 포함한 구절을 다른 표현으로 변경
5. **최종 검증**: 각 형태소가 목표 횟수에 도달했는지 확인

🎯 반드시 달성해야 할 목표:
✓ 각 과다 형태소를 정확히 목표 횟수로 줄이기
✓ 키워드 "${keyword}" 완전형 5-7회 유지
✓ 공백 제외 1700-2000자 유지
✓ 글의 자연스러움 유지 (단, 형태소 제한이 최우선)

❗ 주의사항:
- 형태소 횟수 조정이 가장 중요합니다
- 단순히 단어만 바꾸지 말고, 필요하면 문장을 삭제하세요
- 목표 횟수를 정확히 맞추세요 (1-2회 차이도 허용 안 됨)

조정된 전체 글만 반환하세요 (설명 불필요).`;

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