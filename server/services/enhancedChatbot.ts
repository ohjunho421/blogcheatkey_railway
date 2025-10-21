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

현재 콘텐츠:
${currentContent.substring(0, 500)}...

사용자 요청:
"${userRequest}"

키워드: "${keyword}"

다음 항목을 심층 분석하여 JSON으로 반환하세요:

1. **intent** (수정 의도):
   - "add": 새로운 내용 추가
   - "remove": 불필요한 내용 삭제
   - "modify": 기존 내용 변경 (사용자가 "바꿔줘", "수정해줘" 등을 사용)
   - "restructure": 구조 재편성
   - "tone_change": 어조/톤 변경 (사용자가 "매력적으로", "더 친근하게", "전문적으로" 등을 사용)
   - "enhance_persuasion": 설득력 강화 (사용자가 "설득력있게", "강력하게" 등을 사용)

2. **target** (수정 대상):
   - "intro": 서론 (사용자가 "서론", "도입부", "시작 부분", "첫 단락" 등을 언급하면 이것 선택)
   - "body": 본론 (사용자가 "본론", "중간 부분", "내용" 등을 언급하면 이것 선택)
   - "conclusion": 결론 (사용자가 "결론", "마무리", "끝 부분" 등을 언급하면 이것 선택)
   - "specific_paragraph": 특정 단락 (사용자가 특정 위치나 내용을 명시한 경우)
   - "entire": 전체 (수정 대상이 명확하지 않거나 전체를 언급한 경우)

3. **scope** (수정 범위):
   - "minor": 작은 수정 (단어/문장 수정)
   - "moderate": 중간 수정 (단락 수정)
   - "major": 대규모 수정 (여러 단락 또는 구조 변경)

4. **specificRequirements**: 사용자의 구체적인 요구사항들을 배열로

5. **keyElements**: 반드시 포함해야 할 핵심 요소들

6. **emotionalTone**: 목표하는 감정적 톤
   - "professional": 전문적
   - "friendly": 친근한
   - "urgent": 긴급한
   - "empathetic": 공감적
   - "authoritative": 권위있는

7. **persuasionStrategy**: 적용할 설득 전략
   - 예: "감정적 어필", "논리적 근거 제시", "사회적 증거", "권위 활용"

=== 분석 예시 ===
예1) 사용자 요청: "서론을 좀더 매력적으로 바꿔줘"
→ intent: "tone_change", target: "intro", scope: "moderate", emotionalTone: "friendly"

예2) 사용자 요청: "도입부를 더 흥미롭게 만들어줘"
→ intent: "tone_change", target: "intro", scope: "moderate", emotionalTone: "friendly"

예3) 사용자 요청: "결론 부분을 설득력있게 수정해줘"
→ intent: "enhance_persuasion", target: "conclusion", scope: "moderate"

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
      const morphemeAnalysis = analyzeMorphemes(editedContent, keyword, customMorphemes);
      
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

  const prompt = `당신은 SEO 최적화 블로그 수정 전문가입니다.

=== 전략: ${strategy.name} ===
${strategy.description}

=== 원본 글 ===
${originalContent}

=== 분석된 사용자 요청 ===
- 수정 의도: ${analysis.intent}
- 수정 대상: ${analysis.target}
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
