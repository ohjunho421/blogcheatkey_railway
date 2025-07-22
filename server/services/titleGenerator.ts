import { Anthropic } from '@anthropic-ai/sdk';

interface TitleTypes {
  general: string;
  approval: string;
  secret: string;
  trend: string;
  failure: string;
  comparison: string;
  warning: string;
  blame: string;
  beginner: string;
  benefit: string;
}

interface ExtractedInfo {
  subtopics: string[];
  statistics: string[];
  keywords: string[];
}

interface TitleResponse {
  [key: string]: string[];
}

export class TitleGenerator {
  private client: Anthropic;
  private maxRetries = 3;
  private retryDelay = 2000;

  private titleTypes: TitleTypes = {
    general: '일반 상식 반박형',
    approval: '인정욕구 자극형',
    secret: '숨겨진 비밀형',
    trend: '트렌드 제시형',
    failure: '실패담 공유형',
    comparison: '비교형',
    warning: '경고형',
    blame: '남탓 공감형',
    beginner: '초보자 가이드형',
    benefit: '효과 제시형'
  };

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }

  async generateTitles(keyword: string, content: string): Promise<TitleResponse> {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // 콘텐츠에서 주요 정보 추출
        const extractedInfo = this.extractKeyInfo(content);
        
        // 프롬프트 생성
        const prompt = this.createTitlePrompt(keyword, extractedInfo);
        
        // Claude API 호출
        const response = await this.client.messages.create({
          model: 'claude-opus-4-20250514',
          max_tokens: 2000,
          temperature: 0.7,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        });
        
        const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
        
        // 응답 파싱
        return this.parseTitleResponse(responseText, keyword);
        
      } catch (error) {
        console.error(`제목 생성 오류 (시도 ${attempt + 1}/${this.maxRetries}):`, error);
        
        if (attempt < this.maxRetries - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          console.log(`${delay}ms 후 재시도합니다...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error('최대 재시도 횟수를 초과했습니다. 기본 제목을 생성합니다.');
          return this.getDefaultTitles(keyword);
        }
      }
    }
    
    return this.getDefaultTitles(keyword);
  }

  private extractKeyInfo(content: string): ExtractedInfo {
    // 소제목 추출 (### 또는 ## 형태)
    const subtopicPattern = /###?\s+(.*?)(?:\n|$)/g;
    const subtopics: string[] = [];
    let match;
    while ((match = subtopicPattern.exec(content)) !== null) {
      subtopics.push(match[1].trim());
    }

    // 통계 데이터 추출 (숫자, 퍼센트 등)
    const statsPattern = /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:%|퍼센트|명|개|원|달러|위|배|천|만|억)/g;
    const statistics: string[] = [];
    while ((match = statsPattern.exec(content)) !== null) {
      statistics.push(match[0]);
    }

    // 주요 키워드 추출 (2글자 이상의 단어)
    const words = content.split(/\s+/);
    const keywords = words
      .filter(word => word.length >= 2 && !['그리고', '또한', '그러나', '하지만', '이것', '저것', '그것'].includes(word))
      .slice(0, 10);

    return {
      subtopics: subtopics.slice(0, 4),
      statistics: statistics.slice(0, 5),
      keywords: [...new Set(keywords)].slice(0, 10)
    };
  }

  private createTitlePrompt(keyword: string, extractedInfo: ExtractedInfo): string {
    const { subtopics, statistics, keywords } = extractedInfo;

    return `다음 키워드와 관련 정보를 바탕으로 10가지 유형의 블로그 제목을 각 유형별로 3개씩 생성해주세요.

키워드: ${keyword}

관련 정보:
- 소제목: ${subtopics.length > 0 ? subtopics.join(', ') : '정보 없음'}
- 통계 데이터: ${statistics.length > 0 ? statistics.join(', ') : '정보 없음'}
- 주요 키워드: ${keywords.length > 0 ? keywords.join(', ') : '정보 없음'}

제목 유형별 특징:
1. 일반 상식 반박형 (general) - 기존의 상식이나 고정관념을 반박하는 제목
   예시: "아직도 ${keyword}는 [일반적 상식]라고 생각하시나요?"

2. 인정욕구 자극형 (approval) - 독자의 인정 욕구를 자극하는 제목
   예시: "'이것' 확인할 줄 안다면 ${keyword} 전문가입니다"

3. 숨겨진 비밀형 (secret) - 전문가만 아는 비밀을 알려주는 제목
   예시: "${keyword} 전문가들이 몰래 사용하는 방법 TOP3"

4. 트렌드 제시형 (trend) - 현재 트렌드를 제시하는 제목
   예시: "요즘은 ${keyword}보다 '이것'이 대세입니다"

5. 실패담 공유형 (failure) - 실패 경험을 공유하는 제목
   예시: "${keyword} 잘못 선택해서 후회한 사람들의 공통점"

6. 비교형 (comparison) - 전후 비교나 대안 비교를 제시하는 제목
   예시: "${keyword} 전후 비교! 차이가 이렇게 납니다"

7. 경고형 (warning) - 주의사항이나 경고를 제시하는 제목
   예시: "${keyword} 전에 꼭 알아야 할 5가지 체크리스트"

8. 남탓 공감형 (blame) - 외부 요인을 탓하며 공감을 이끌어내는 제목
   예시: "${keyword} 후에도 효과가 없다면 [외부 요인] 때문입니다"

9. 초보자 가이드형 (beginner) - 초보자를 위한 가이드 제목
   예시: "${keyword} 초보라면 이렇게 시작하세요"

10. 효과 제시형 (benefit) - 기대 효과를 명확히 제시하는 제목
    예시: "${keyword}만 잘해도 [효과] 15% 올라가는 이유"

응답 형식:
{{일반 상식 반박형}}
1. [제목1]
2. [제목2]
3. [제목3]

{{인정욕구 자극형}}
1. [제목1]
2. [제목2]
3. [제목3]

{{숨겨진 비밀형}}
1. [제목1]
2. [제목2]
3. [제목3]

{{트렌드 제시형}}
1. [제목1]
2. [제목2]
3. [제목3]

{{실패담 공유형}}
1. [제목1]
2. [제목2]
3. [제목3]

{{비교형}}
1. [제목1]
2. [제목2]
3. [제목3]

{{경고형}}
1. [제목1]
2. [제목2]
3. [제목3]

{{남탓 공감형}}
1. [제목1]
2. [제목2]
3. [제목3]

{{초보자 가이드형}}
1. [제목1]
2. [제목2]
3. [제목3]

{{효과 제시형}}
1. [제목1]
2. [제목2]
3. [제목3]

다음 조건을 반드시 준수해주세요:
1. 각 유형별로 정확히 3개의 제목을 생성해주세요.
2. 제목은 클릭을 유도하면서도 과장되거나 허위 정보를 담지 않도록 해주세요.
3. 각 제목에 키워드 '${keyword}'를 반드시 포함시켜주세요.
4. 제목 길이는 한글 기준 15-30자 사이로 해주세요.
5. 추출된 통계 데이터나 키워드를 적절히 활용해주세요.`;
  }

  private parseTitleResponse(responseText: string, keyword: string): TitleResponse {
    const titles: TitleResponse = {
      general: [],
      approval: [],
      secret: [],
      trend: [],
      failure: [],
      comparison: [],
      warning: [],
      blame: [],
      beginner: [],
      benefit: []
    };

    // 유형별 섹션 분리
    const sections = responseText.split(/\{\{.*?\}\}/);
    const typeMatches = responseText.match(/\{\{(.*?)\}\}/g);

    if (typeMatches) {
      typeMatches.forEach((typeMatch, index) => {
        const typeName = typeMatch.replace(/[{}]/g, '');
        const sectionContent = sections[index + 1] || '';
        
        // 해당 유형 찾기
        let targetType = '';
        for (const [key, value] of Object.entries(this.titleTypes)) {
          if (typeName.includes(value)) {
            targetType = key;
            break;
          }
        }

        if (targetType) {
          // 번호가 매겨진 제목 추출
          const lines = sectionContent.split('\n');
          for (const line of lines) {
            const match = line.match(/^\d+\.\s*(.+)$/);
            if (match) {
              const title = match[1].trim().replace(/['"]/g, '');
              if (title) {
                titles[targetType].push(title);
              }
            }
          }
        }
      });
    }

    // 각 유형별 결과 개수 확인 및 보완
    for (const titleType of Object.keys(titles)) {
      if (titles[titleType].length === 0) {
        titles[titleType] = this.getDefaultTitlesForType(titleType, keyword);
      }
      // 최대 3개로 제한
      titles[titleType] = titles[titleType].slice(0, 3);
    }

    return titles;
  }

  private getDefaultTitles(keyword: string): TitleResponse {
    const defaultTitles: TitleResponse = {};
    
    for (const titleType of Object.keys(this.titleTypes)) {
      defaultTitles[titleType] = this.getDefaultTitlesForType(titleType, keyword);
    }
    
    return defaultTitles;
  }

  private getDefaultTitlesForType(titleType: string, keyword: string): string[] {
    const defaults: { [key: string]: string[] } = {
      general: [
        `아직도 ${keyword}는 이렇게 하시나요? 올바른 방법`,
        `${keyword}에 대한 일반적인 상식과 다른 진실`,
        `대부분의 사람들이 ${keyword}에 대해 잘못 알고 있는 것`
      ],
      approval: [
        `${keyword} 전문가들만 아는 비밀 기술`,
        `당신이 모르는 ${keyword} 숨겨진 팁`,
        `이것을 알고 있다면 ${keyword} 전문가!`
      ],
      secret: [
        `${keyword} 전문가들이 알려주지 않는 비밀`,
        `${keyword} 숨겨진 팁으로 효과 두 배로!`,
        `아무도 알려주지 않았던 ${keyword} 비밀 노하우`
      ],
      trend: [
        `2024년 ${keyword} 최신 트렌드 총정리`,
        `요즘 ${keyword} 대세는 이것! 놓치지 마세요`,
        `${keyword} 트렌드를 선도하는 최신 방법`
      ],
      failure: [
        `${keyword} 실패한 사람들의 공통된 습관`,
        `${keyword} 이것 때문에 실패했다! 피해야 할 함정`,
        `${keyword} 후회하지 않으려면 이 실수들을 피하세요`
      ],
      comparison: [
        `${keyword} 전과 후, 확실한 차이 비교`,
        `${keyword} 어떤 방법이 더 효과적일까? 비교 분석`,
        `${keyword} A vs B: 어떤 것이 더 좋을까?`
      ],
      warning: [
        `${keyword} 반드시 알아야 할 5가지 주의사항`,
        `${keyword} 이것만은 꼭 피하세요! 위험 신호`,
        `${keyword} 시작하기 전에 꼭 확인해야 할 체크리스트`
      ],
      blame: [
        `${keyword} 효과가 없는 진짜 이유, 당신 탓이 아닙니다`,
        `${keyword} 실패의 원인은 외부에 있었다`,
        `${keyword} 당신의 노력이 헛되게 느껴지는 진짜 이유`
      ],
      beginner: [
        `${keyword} 초보자를 위한 완벽 가이드`,
        `${keyword} 처음 시작하는 분들을 위한 기초 팁`,
        `${keyword} 초보자도 쉽게 따라할 수 있는 방법`
      ],
      benefit: [
        `${keyword} 이것만 바꿔도 효과 30% 상승`,
        `${keyword} 단 7일만에 놀라운 변화를 경험하세요`,
        `${keyword} 손쉽게 얻을 수 있는 5가지 핵심 효과`
      ]
    };

    return defaults[titleType] || defaults['general'];
  }
}