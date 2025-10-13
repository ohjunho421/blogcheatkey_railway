import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, ArrowDown } from "lucide-react";

interface RequiredFieldsCheckerProps {
  project?: any;
  onScrollTo?: (sectionId: string) => void;
}

export function RequiredFieldsChecker({ project, onScrollTo }: RequiredFieldsCheckerProps) {
  if (!project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <AlertCircle className="h-5 w-5 text-muted-foreground mr-2" />
            필수 항목 확인
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm">
              먼저 키워드를 입력하여 프로젝트를 시작하세요
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const requirements = [
    {
      id: 'keyword',
      label: '키워드 입력',
      completed: !!project.keyword,
      sectionId: '#keyword-section',
      description: '블로그 주제 키워드'
    },
    {
      id: 'analysis',
      label: '키워드 분석',
      completed: !!project.keywordAnalysis,
      sectionId: '#keyword-section',
      description: '검색 의도 및 소제목 분석'
    },
    {
      id: 'research',
      label: '자료 수집',
      completed: !!project.researchData,
      sectionId: '#keyword-section', 
      description: 'Perplexity를 통한 관련 정보 수집'
    },
    {
      id: 'business',
      label: '업체 정보',
      completed: !!project.businessInfo,
      sectionId: '#business-section',
      description: '업체명, 업종, 전문성, 차별점'
    }
  ];

  const completedCount = requirements.filter(req => req.completed).length;
  const totalCount = requirements.length;
  const isAllCompleted = completedCount === totalCount;
  const canGenerateBlog = project.status === 'business_info' && isAllCompleted;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center">
            {isAllCompleted ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
            )}
            필수 항목 확인
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requirements.map((req) => (
          <div
            key={req.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              req.completed 
                ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                : 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800'
            }`}
          >
            <div className="flex items-center space-x-3">
              {req.completed ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-500" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  req.completed ? 'text-green-800 dark:text-green-200' : 'text-orange-800 dark:text-orange-200'
                }`}>
                  {req.label}
                </p>
                <p className={`text-xs ${
                  req.completed ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {req.description}
                </p>
              </div>
            </div>
            {!req.completed && onScrollTo && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onScrollTo(req.sectionId)}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {isAllCompleted && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  모든 필수 항목이 완료되었습니다!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {canGenerateBlog 
                    ? '아래 블로그 생성 버튼을 클릭하여 콘텐츠를 생성하세요.' 
                    : '블로그 생성 준비가 완료되었습니다.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {!isAllCompleted && (
          <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  {totalCount - completedCount}개 항목이 미완료되었습니다
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  위의 미완료 항목을 클릭하여 해당 섹션으로 이동하세요
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}