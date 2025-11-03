import { GoogleGenAI } from "@google/genai";
import { analyzeMorphemes } from './morphemeAnalyzer';

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_ENV_VAR || "default_key"
});

const MODEL = "gemini-2.5-pro";

interface RequestAnalysis {
  intent: string; // 수정 의도: 'add', 'remove', 'modify', 'restructure', 'tone_change'
  target: string; // 수정 대상: 'intro', 'body', 'conclusion', 'specific_paragraph', 'entire'
  scope: string; // 수정 범위: 'minor', 'moderate', 'major'
  specificRequirements: string[];
  keyElements: string[]; // 핵심 요소들
  emotionalTone: string; // 감정적 톤: 'professional', 'friendly', 'urgent', 'empathetic'
  persuasionStrategy: string; // 설득 전략
}

interface EditVersion {
  content: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  seoCompliance: boolean;
}

// 🎯 Step 1: 심층 요청 분석
export async function analyzeUserRequest(
  userRequest: string,
  currentContent: string,
  keyword: string
): Promise<RequestAnalysis> {
  const prompt = `당신은 사용자의 블로그 수정 요청을 깊이 있게 분석하는 전문가입니다.

현재 콘텐츠 일부:
${currentContent.substring(0, 500)}...

사용자 요청:
"${userRequest}"

키워드: "${keyword}"

다음 항목을 심층 분석하여 JSON으로 반환하세요:

1. **intent** (수정 의도):
   - "add": 새로운 내용 추가 (예: "~를 추가해줘", "~에 대한 내용도 넣어줘")
   - "remove": 불필요한 내용 삭제 (예: "~를 빼줘", "~부분을 삭제해줘")
   - "modify": 기존 내용 변경 (예: "바꿔줘", "수정해줘", "다시 써줘", "고쳐줘")
   - "restructure": 구조 재편성 (예: "순서를 바꿔줘", "구조를 변경해줘")
   - "tone_change": 어조/톤 변경 (예: "매력적으로", "친근하게", "전문적으로", "흥미롭게")
   - "enhance_persuasion": 설득력 강화 (예: "설득력있게", "강력하게", "효과적으로")
   - "improve_readability": 가독성 개선 (예: "읽기 쉽게", "이해하기 쉽게", "더 명확하게")
   - "title_suggestion": 제목 추천 (예: "제목 추천해줘", "제목 지어줘", "어울리는 제목", "타이틀")

2. **target** (수정 대상) - 한국어 표현을 정확히 인식:
   - "intro": 서론 (키워드: "서론", "도입부", "시작", "첫 부분", "처음", "인트로", "앞부분")
   - "body": 본론 (키워드: "본론", "중간", "내용", "몸통", "핵심 내용")
   - "conclusion": 결론 (키워드: "결론", "마무리", "끝", "마지막", "클로징", "끝부분")
   - "specific_paragraph": 특정 단락 (사용자가 특정 문장이나 내용을 직접 언급한 경우)
   - "entire": 전체 (명확한 대상이 없거나 "전체", "전부", "글 전체" 등을 언급)

3. **scope** (수정 범위):
   - "minor": 작은 수정 (단어 몇 개 또는 문장 1-2개)
   - "moderate": 중간 수정 (한 단락 또는 여러 문장)
   - "major": 대규모 수정 (여러 단락 또는 전체 구조)

4. **specificRequirements**: 사용자의 구체적인 요구사항들을 배열로 추출

5. **keyElements**: 반드시 포함하거나 강조해야 할 핵심 요소들

6. **emotionalTone**: 목표하는 감정적 톤
   - "professional": 전문적, 격식있는
   - "friendly": 친근한, 따뜻한
   - "urgent": 긴급한, 시급한
   - "empathetic": 공감적, 이해하는
   - "authoritative": 권위있는, 확신있는
   - "casual": 편안한, 일상적인
   - "enthusiastic": 열정적인, 흥미로운

7. **persuasionStrategy**: 적용할 설득 전략
   - "감정적 어필": 독자의 감정에 호소
   - "논리적 근거": 데이터와 사실로 설득
   - "사회적 증거": 다른 사람들의 경험 활용
   - "권위 활용": 전문가 의견 강조
   - "문제-해결": 문제 제시 후 해결책 제공
   - "스토리텔링": 이야기 형식으로 전달

=== 분석 예시 ===
예1) "서론을 좀더 매력적으로 바꿨으면 좋겠어"
→ {"intent": "tone_change", "target": "intro", "scope": "moderate", "emotionalTone": "enthusiastic", "persuasionStrategy": "감정적 어필"}

예2) "도입부를 더 흥미롭게 만들어줘"
→ {"intent": "tone_change", "target": "intro", "scope": "moderate", "emotionalTone": "enthusiastic", "persuasionStrategy": "스토리텔링"}

예3) "결론 부분을 설득력있게 수정해줘"
→ {"intent": "enhance_persuasion", "target": "conclusion", "scope": "moderate", "persuasionStrategy": "문제-해결"}

예4) "전체적으로 더 읽기 쉽게 바꿔줘"
→ {"intent": "improve_readability", "target": "entire", "scope": "major", "emotionalTone": "friendly"}

예5) "본론에 구체적인 예시를 추가해줘"
→ {"intent": "add", "target": "body", "scope": "moderate", "specificRequirements": ["구체적인 예시 추가"]}

예6) "첫 부분을 다시 써줘"
→ {"intent": "modify", "target": "intro", "scope": "moderate"}

예7) "글 전체를 좀더 전문적으로 고쳐줘"
→ {"intent": "tone_change", "target": "entire", "scope": "major", "emotionalTone": "professional"}

예8) "이 글에 어울리는 제목을 추천해줘"
→ {"intent": "title_suggestion", "target": "entire", "scope": "minor"}

예9) "제목을 좀더 흥미롭게 지어줘"
→ {"intent": "title_suggestion", "target": "entire", "emotionalTone": "enthusiastic"}

**중요**: 사용자의 자연스러운 한국어 표현을 정확히 이해하세요.
- "~했으면 좋겠어", "~해줘", "~해주세요" 모두 동일한 요청입니다.
- "서론", "도입부", "처음", "앞부분" 모두 "intro"를 의미합니다.
- "바꿔줘", "수정해줘", "고쳐줘", "다시 써줘" 모두 "modify"를 의미합니다.

JSON 형식으로 응답:`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      config: {
        systemInstruction: "사용자의 의도를 정확히 파악하는 분석 전문가입니다.",
        responseMimeType: "application/json"
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Request analysis error:", error);
    // Fallback
    return {
      intent: "modify",
      target: "entire",
      scope: "moderate",
      specificRequirements: [userRequest],
      keyElements: [keyword],
      emotionalTone: "professional",
      persuasionStrategy: "논리적 근거 제시"
    };
  }
}

// 🎯 Step 2: 여러 버전 생성 (SSR 방식)
export async function generateMultipleVersions(
  originalContent: string,
  analysis: RequestAnalysis,
  keyword: string,
  customMorphemes?: string
): Promise<EditVersion[]> {
  const versions: EditVersion[] = [];
  
  // 3가지 다른 접근 방식으로 버전 생성
  const strategies = [
    {
      name: "conservative",
      description: "최소한의 수정으로 요청 반영 (기존 글 최대한 보존)"
    },
    {
      name: "balanced",
      description: "적절한 수정으로 요청과 글 품질 균형"
    },
    {
      name: "aggressive",
      description: "적극적인 수정으로 요청 완전 반영"
    }
  ];

  for (const strategy of strategies) {
    try {
      const editedContent = await generateVersion(
        originalContent,
        analysis,
        keyword,
        strategy,
        customMorphemes
      );

      // SEO 최적화 검증
      const morphemeAnalysis = await analyzeMorphemes(editedContent, keyword, customMorphemes);
      
      versions.push({
        content: editedContent,
        score: 0, // 나중에 평가
        strengths: [],
        weaknesses: [],
        seoCompliance: morphemeAnalysis.isOptimized
      });
    } catch (error) {
      console.error(`Failed to generate ${strategy.name} version:`, error);
    }
  }

  return versions;
}

// 개별 버전 생성
async function generateVersion(
  originalContent: string,
  analysis: RequestAnalysis,
  keyword: string,
  strategy: { name: string; description: string },
  customMorphemes?: string
): Promise<string> {
  const customMorphemesArray = customMorphemes ? customMorphemes.split(' ').filter(m => m.trim().length > 0) : [];

  // 📌 컨텐츠를 서론-본론-결론으로 분리 (단락 기준)
  const paragraphs = originalContent.split('\n\n').filter(p => p.trim().length > 0);
  const totalParagraphs = paragraphs.length;
  
  // 대략적인 섹션 구분 (첫 1-2단락: 서론, 마지막 1-2단락: 결론, 나머지: 본론)
  let introEnd = Math.min(2, Math.floor(totalParagraphs * 0.2));
  let conclusionStart = Math.max(totalParagraphs - 2, Math.floor(totalParagraphs * 0.8));
  if (introEnd >= conclusionStart) {
    introEnd = 1;
    conclusionStart = totalParagraphs - 1;
  }
  
  const introParagraphs = paragraphs.slice(0, introEnd);
  const bodyParagraphs = paragraphs.slice(introEnd, conclusionStart);
  const conclusionParagraphs = paragraphs.slice(conclusionStart);
  
  // 타겟 섹션 정보 생성
  let targetSectionInfo = '';
  if (analysis.target === 'intro') {
    targetSectionInfo = `\n**🎯 집중 수정 영역: 서론 (첫 ${introEnd}개 단락)**\n- 현재 서론:\n${introParagraphs.join('\n\n')}\n\n→ 이 부분을 중점적으로 수정하세요.`;
  } else if (analysis.target === 'body') {
    targetSectionInfo = `\n**🎯 집중 수정 영역: 본론 (중간 ${bodyParagraphs.length}개 단락)**\n- 현재 본론 시작 부분:\n${bodyParagraphs.slice(0, 2).join('\n\n')}\n\n→ 본론 전체를 중점적으로 수정하세요.`;
  } else if (analysis.target === 'conclusion') {
    targetSectionInfo = `\n**🎯 집중 수정 영역: 결론 (마지막 ${conclusionParagraphs.length}개 단락)**\n- 현재 결론:\n${conclusionParagraphs.join('\n\n')}\n\n→ 이 부분을 중점적으로 수정하세요.`;
  }

  const prompt = `당신은 SEO 최적화 블로그 수정 전문가입니다.

=== 전략: ${strategy.name} ===
${strategy.description}

=== 원본 글 ===
${originalContent}
${targetSectionInfo}

=== 분석된 사용자 요청 ===
- 수정 의도: ${analysis.intent}
- 수정 대상: ${analysis.target} ${analysis.target === 'intro' ? '(서론/도입부)' : analysis.target === 'body' ? '(본론)' : analysis.target === 'conclusion' ? '(결론/마무리)' : '(전체)'}
- 수정 범위: ${analysis.scope}
- 구체적 요구사항: ${analysis.specificRequirements.join(', ')}
- 핵심 요소: ${analysis.keyElements.join(', ')}
- 감정적 톤: ${analysis.emotionalTone}
- 설득 전략: ${analysis.persuasionStrategy}

=== 키워드 정보 ===
키워드: "${keyword}"
${customMorphemesArray.length > 0 ? `추가 형태소: ${customMorphemesArray.join(', ')}` : ''}

=== 🔥 절대 준수 조건 🔥 ===
1. 완전한 키워드 "${keyword}" 5-7회 포함
2. 키워드 구성 형태소 각각 15-17회 포함
3. 공백 제외 1700-2000자 범위
4. 서론-본론-결론 구조 유지
5. 분석된 감정적 톤(${analysis.emotionalTone}) 적용
6. 분석된 설득 전략(${analysis.persuasionStrategy}) 활용
${customMorphemesArray.length > 0 ? `7. 추가 형태소들 자연스럽게 포함: ${customMorphemesArray.join(', ')}` : ''}

=== 수정 가이드 (${strategy.name} 전략) ===
${strategy.name === 'conservative' ? 
  '- 기존 글의 90% 이상 유지\n- 사용자가 요청한 부분만 최소한으로 수정\n- 기존 문장 구조와 어조 완전 보존' :
  strategy.name === 'balanced' ?
  '- 기존 글의 70-80% 유지\n- 요청사항을 충실히 반영하되 글 전체의 일관성 유지\n- 필요한 경우 주변 문장도 자연스럽게 조정' :
  '- 요청사항을 완전히 반영\n- 글 전체의 품질 향상을 위해 필요한 부분 적극 수정\n- 설득력과 가독성을 최대한 강화'}

${analysis.target !== 'entire' ? `\n**⚠️ 중요**: ${analysis.target === 'intro' ? '서론' : analysis.target === 'body' ? '본론' : '결론'} 부분을 집중적으로 수정하되, 다른 부분도 자연스럽게 연결되도록 조정하세요.` : ''}

완성된 수정본을 반환하세요 (설명 없이 본문만):`;

  const response = await ai.models.generateContent({
    model: MODEL,
    config: {
      systemInstruction: "SEO와 설득력을 모두 갖춘 블로그 수정 전문가입니다."
    },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  return response.text || "";
}

// 🎯 Step 3: 버전 평가 및 순위 결정 (SSR 방식)
export async function evaluateVersions(
  versions: EditVersion[],
  analysis: RequestAnalysis,
  keyword: string
): Promise<EditVersion[]> {
  for (let i = 0; i < versions.length; i++) {
    try {
      const evaluation = await evaluateSingleVersion(versions[i].content, analysis, keyword);
      versions[i].score = evaluation.score;
      versions[i].strengths = evaluation.strengths;
      versions[i].weaknesses = evaluation.weaknesses;
    } catch (error) {
      console.error(`Failed to evaluate version ${i}:`, error);
      versions[i].score = versions[i].seoCompliance ? 6.0 : 4.0; // 기본 점수
    }
  }

  // 점수 순으로 정렬
  return versions.sort((a, b) => b.score - a.score);
}

async function evaluateSingleVersion(
  content: string,
  analysis: RequestAnalysis,
  keyword: string
): Promise<{ score: number; strengths: string[]; weaknesses: string[] }> {
  const prompt = `당신은 블로그 품질 평가 전문가입니다.

다음 블로그 글을 10점 만점으로 평가해주세요:

${content}

평가 기준:
1. 사용자 요청 반영도 (의도: ${analysis.intent}, 대상: ${analysis.target})
2. SEO 최적화 (키워드 "${keyword}" 활용도)
3. 가독성 및 흐름
4. 설득력 (전략: ${analysis.persuasionStrategy})
5. 감정적 톤 일치도 (목표: ${analysis.emotionalTone})

JSON으로 응답:
{
  "score": 0-10 사이 점수 (소수점 1자리),
  "strengths": ["강점1", "강점2", ...],
  "weaknesses": ["약점1", "약점2", ...]
}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    config: {
      systemInstruction: "객관적이고 정확한 블로그 품질 평가 전문가입니다.",
      responseMimeType: "application/json"
    },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  return JSON.parse(response.text || '{"score": 5.0, "strengths": [], "weaknesses": []}');
}

// 🎯 SSR 기반 제목 생성 함수
export async function generateContentBasedTitle(
  content: string,
  keyword: string,
  analysis: RequestAnalysis
): Promise<Array<{ title: string; score: number }>> {
  try {
    const { generateTop5Titles } = await import('./ssrTitleGenerator.js');
    
    console.log('🎯 SSR 기반 제목 생성 시작...');
    console.log(`  키워드: ${keyword}`);
    console.log(`  감정 톤: ${analysis.emotionalTone || 'enthusiastic'}`);
    
    // SSR 평가를 통한 Top 5 제목 생성
    const top5 = await generateTop5Titles(keyword, content);
    
    return top5;
  } catch (error) {
    console.error('SSR 제목 생성 오류:', error);
    
    // Fallback: 기본 제목 반환
    return [
      { title: `${keyword}에 대해 알아야 할 모든 것`, score: 3.5 },
      { title: `${keyword} 완벽 가이드`, score: 3.5 },
      { title: `${keyword}, 이것만 알면 됩니다`, score: 3.5 },
      { title: `${keyword} 제대로 이해하기`, score: 3.5 },
      { title: `${keyword} 핵심 정리`, score: 3.5 }
    ];
  }
}

// 🎯 통합 함수: 전체 프로세스 실행
export async function enhancedEditContent(
  originalContent: string,
  userRequest: string,
  keyword: string,
  customMorphemes?: string
): Promise<{
  bestVersion: string;
  allVersions: EditVersion[];
  analysis: RequestAnalysis;
}> {
  console.log('🤖 Enhanced chatbot: Starting content editing...');
  
  // Step 1: 요청 분석
  console.log('📊 Step 1: Analyzing user request...');
  const analysis = await analyzeUserRequest(userRequest, originalContent, keyword);
  console.log('✓ Request analysis complete:', analysis);

  // Step 2: 여러 버전 생성
  console.log('🎨 Step 2: Generating multiple versions...');
  const versions = await generateMultipleVersions(originalContent, analysis, keyword, customMorphemes);
  console.log(`✓ Generated ${versions.length} versions`);

  // Step 3: 평가 및 순위 결정
  console.log('🏆 Step 3: Evaluating versions...');
  const rankedVersions = await evaluateVersions(versions, analysis, keyword);
  console.log('✓ Evaluation complete');

  return {
    bestVersion: rankedVersions[0]?.content || originalContent,
    allVersions: rankedVersions,
    analysis
  };
}
