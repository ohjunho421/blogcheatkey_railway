import { analyzeMorphemes } from './morphemeAnalyzer';

interface MorphemeOptimizationResult {
  optimizedContent: string;
  changes: string[];
  finalAnalysis: any;
}

// 키워드 형태소를 포함한 문장을 추출
function extractKeywordSentences(content: string, keywordMorphemes: string[]): {
  sentence: string;
  morphemeCount: Record<string, number>;
  index: number;
}[] {
  const sentences = content.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
  const keywordSentences: { sentence: string; morphemeCount: Record<string, number>; index: number }[] = [];

  sentences.forEach((sentence, index) => {
    const morphemeCount: Record<string, number> = {};
    let hasKeyword = false;

    keywordMorphemes.forEach(morpheme => {
      const count = (sentence.match(new RegExp(morpheme, 'g')) || []).length;
      if (count > 0) {
        morphemeCount[morpheme] = count;
        hasKeyword = true;
      }
    });

    if (hasKeyword) {
      keywordSentences.push({ sentence, morphemeCount, index });
    }
  });

  return keywordSentences;
}

// 동의어 매핑
const synonymMap: Record<string, string[]> = {
  'BMW': ['비엠더블유', '독일 프리미엄 브랜드', '바바리안 모터 웍스', '럭셔리 브랜드'],
  '코딩': ['프로그래밍', '설정', '세팅', '구성', '커스터마이징', '튜닝', '설정 변경', '소프트웨어 조정']
};

// 문장에서 키워드 형태소를 동의어로 대체
function replaceMorphemeWithSynonym(sentence: string, morpheme: string): string {
  const synonyms = synonymMap[morpheme] || [];
  if (synonyms.length === 0) return sentence;

  // 랜덤하게 동의어 선택
  const synonym = synonyms[Math.floor(Math.random() * synonyms.length)];
  
  // 첫 번째 출현만 대체
  return sentence.replace(new RegExp(morpheme), synonym);
}

// 문장이 제거되어도 자연스러운지 확인
function isRemovalNatural(content: string, sentenceToRemove: string): boolean {
  const withoutSentence = content.replace(sentenceToRemove, '').trim();
  
  // 간단한 휴리스틱: 문장 제거 후에도 최소 길이 유지 및 의미 연결성 확인
  if (withoutSentence.length < content.length * 0.8) return false;
  
  // 문장 제거 후 연결사나 지시어가 고립되는지 확인
  const isolatedConnectors = /^(그런데|하지만|그러나|따라서|그래서|이처럼)/.test(withoutSentence);
  if (isolatedConnectors) return false;
  
  return true;
}

// 형태소 최적화 메인 함수
export async function optimizeMorphemeUsage(
  content: string, 
  keyword: string,
  targetCounts: Record<string, number> = {}
): Promise<MorphemeOptimizationResult> {
  const keywordMorphemes = keyword.split(/\s+/).filter(m => m.length > 0);
  const changes: string[] = [];
  let optimizedContent = content;

  // 현재 형태소 분석
  const initialAnalysis = analyzeMorphemes(content, keyword);
  
  for (const morpheme of keywordMorphemes) {
    const currentCount = initialAnalysis.morphemeCounts[morpheme] || 0;
    const targetCount = targetCounts[morpheme] || 20; // 기본 최대값 20

    if (currentCount > targetCount) {
      const overCount = currentCount - targetCount;
      changes.push(`${morpheme}: ${currentCount}회 → ${targetCount}회로 조정 필요`);

      // 키워드 문장들 추출
      const keywordSentences = extractKeywordSentences(optimizedContent, [morpheme]);
      
      // 과다 사용된 수만큼 처리
      let reductionsMade = 0;
      
      for (const sentenceInfo of keywordSentences) {
        if (reductionsMade >= overCount) break;

        const { sentence, morphemeCount } = sentenceInfo;
        const morphemeInSentence = morphemeCount[morpheme] || 0;

        // 문장 제거가 자연스러운지 확인
        if (isRemovalNatural(optimizedContent, sentence)) {
          optimizedContent = optimizedContent.replace(sentence, '');
          reductionsMade += morphemeInSentence;
          changes.push(`문장 제거: "${sentence.substring(0, 30)}..."`);
        } else {
          // 동의어로 대체
          let modifiedSentence = sentence;
          let replacements = 0;
          
          while (replacements < morphemeInSentence && reductionsMade < overCount) {
            const newSentence = replaceMorphemeWithSynonym(modifiedSentence, morpheme);
            if (newSentence !== modifiedSentence) {
              modifiedSentence = newSentence;
              replacements++;
              reductionsMade++;
            } else {
              break; // 더 이상 대체할 수 없음
            }
          }
          
          if (replacements > 0) {
            optimizedContent = optimizedContent.replace(sentence, modifiedSentence);
            changes.push(`동의어 대체: ${morpheme} → ${replacements}회 대체`);
          }
        }
      }
    }
  }

  // 최종 분석
  const finalAnalysis = analyzeMorphemes(optimizedContent, keyword);

  return {
    optimizedContent,
    changes,
    finalAnalysis
  };
}

// 콘텐츠 구조 복원 (서론-본론-결론)
export function restoreContentStructure(content: string, subtitles: string[]): string {
  // 기본 구조 템플릿
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  
  // 제목과 소제목을 제외한 본문 추출
  const bodyLines = lines.filter(line => {
    const isTitle = subtitles.some(subtitle => line.includes(subtitle));
    return !isTitle && line.length > 10; // 10자 이상인 실제 본문만
  });

  if (bodyLines.length === 0) return content;

  // 서론-본론-결론 구조로 재구성
  const totalLines = bodyLines.length;
  const introLines = bodyLines.slice(0, Math.ceil(totalLines * 0.15)); // 15%
  const conclusionLines = bodyLines.slice(-Math.ceil(totalLines * 0.15)); // 15%
  const bodyMainLines = bodyLines.slice(Math.ceil(totalLines * 0.15), -Math.ceil(totalLines * 0.15)); // 70%

  const sectionsPerSubtitle = Math.ceil(bodyMainLines.length / subtitles.length);

  let structuredContent = '';

  // 서론
  structuredContent += introLines.join('\n') + '\n\n';

  // 본론 (소제목별 분배)
  subtitles.forEach((subtitle, index) => {
    structuredContent += subtitle + '\n\n';
    
    const startIdx = index * sectionsPerSubtitle;
    const endIdx = Math.min((index + 1) * sectionsPerSubtitle, bodyMainLines.length);
    const sectionLines = bodyMainLines.slice(startIdx, endIdx);
    
    structuredContent += sectionLines.join('\n') + '\n\n';
  });

  // 결론
  structuredContent += conclusionLines.join('\n');

  return structuredContent;
}