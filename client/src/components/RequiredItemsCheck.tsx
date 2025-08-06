import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RequiredItemsCheckProps {
  project: any;
}

export function RequiredItemsCheck({ project }: RequiredItemsCheckProps) {
  if (!project) return null;

  const checks = [
    {
      id: "keyword",
      label: "키워드 분석",
      required: true,
      completed: project.keyword && project.keywordAnalysis,
      description: "메인 키워드가 분석되었습니다"
    },
    {
      id: "research",
      label: "자료 수집",
      required: true,
      completed: project.researchData,
      description: "관련 자료가 수집되었습니다"
    },
    {
      id: "business",
      label: "업체 정보",
      required: true,
      completed: project.businessInfo,
      description: "업체 정보가 입력되었습니다"
    },
    {
      id: "references",
      label: "참고 링크",
      required: false,
      completed: project.referenceBlogLinks && project.referenceBlogLinks.length > 0,
      description: "참고할 블로그 링크가 추가되었습니다"
    },
    {
      id: "morphemes",
      label: "추가 형태소",
      required: false,
      completed: project.customMorphemes && project.customMorphemes.trim().length > 0,
      description: "사용자 정의 형태소가 추가되었습니다"
    }
  ];

  const requiredItems = checks.filter(check => check.required);
  const optionalItems = checks.filter(check => !check.required);
  const completedRequired = requiredItems.filter(check => check.completed).length;
  const allRequiredCompleted = completedRequired === requiredItems.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <CheckCircle className="h-5 w-5 text-primary mr-2" />
          필수 항목 체크
          <Badge 
            variant={allRequiredCompleted ? "default" : "secondary"} 
            className="ml-2"
          >
            {completedRequired}/{requiredItems.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 필수 항목 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">필수 항목</h4>
          {requiredItems.map((check) => (
            <div key={check.id} className="flex items-center justify-between p-2 rounded-lg border">
              <div className="flex items-center space-x-2">
                {check.completed ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">{check.label}</span>
              </div>
              <Badge variant={check.completed ? "default" : "destructive"} className="text-xs">
                {check.completed ? "완료" : "미완료"}
              </Badge>
            </div>
          ))}
        </div>

        {/* 선택 항목 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">선택 항목</h4>
          {optionalItems.map((check) => (
            <div key={check.id} className="flex items-center justify-between p-2 rounded-lg border border-dashed">
              <div className="flex items-center space-x-2">
                {check.completed ? (
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">{check.label}</span>
              </div>
              <Badge variant={check.completed ? "secondary" : "outline"} className="text-xs">
                {check.completed ? "추가됨" : "선택사항"}
              </Badge>
            </div>
          ))}
        </div>

        {/* 상태 메시지 */}
        <div className={`p-3 rounded-lg ${allRequiredCompleted ? 'bg-green-50 dark:bg-green-950' : 'bg-yellow-50 dark:bg-yellow-950'}`}>
          <div className="flex items-center space-x-2">
            {allRequiredCompleted ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
            <span className="text-sm font-medium">
              {allRequiredCompleted 
                ? "모든 필수 항목이 완료되었습니다! 블로그를 생성할 수 있습니다." 
                : `${requiredItems.length - completedRequired}개의 필수 항목이 남아있습니다.`
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}