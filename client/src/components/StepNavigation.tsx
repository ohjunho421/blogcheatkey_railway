import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronRight, Edit3, RotateCcw } from "lucide-react";

interface StepNavigationProps {
  project: any;
  onStepClick: (step: string) => void;
  onResetProject: () => void;
}

export function StepNavigation({ project, onStepClick, onResetProject }: StepNavigationProps) {
  const steps = [
    {
      id: 'keyword_analysis',
      label: '키워드 분석',
      description: '메인 키워드 입력 및 분석',
      completed: project?.keyword && project?.keywordAnalysis,
      active: !project || project?.status === 'keyword_analysis'
    },
    {
      id: 'data_collection',
      label: '자료 수집',
      description: '관련 자료 및 연구 데이터 수집',
      completed: project?.researchData,
      active: project?.status === 'data_collection'
    },
    {
      id: 'business_info',
      label: '업체 정보',
      description: '업체 정보 및 참고 링크 입력',
      completed: project?.businessInfo,
      active: project?.status === 'business_info'
    },
    {
      id: 'content_generation',
      label: '글 작성',
      description: 'AI 블로그 콘텐츠 생성',
      completed: project?.generatedContent,
      active: project?.status === 'content_generation' || project?.status === 'completed'
    }
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">프로젝트 단계</h3>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onResetProject}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              새 프로젝트
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-3">
              <Button
                variant={step.active ? "default" : step.completed ? "secondary" : "outline"}
                size="sm"
                onClick={() => onStepClick(step.id)}
                disabled={project?.status === 'content_generation' && !project?.generatedContent}
                className="flex items-center justify-start w-full h-auto p-3"
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 flex-shrink-0">
                    {step.completed ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{step.label}</span>
                      <div className="flex items-center space-x-1">
                        {step.completed && !step.active && (
                          <Edit3 className="h-3 w-3 opacity-60" />
                        )}
                        {step.completed && (
                          <Badge variant="secondary" className="text-xs">완료</Badge>
                        )}
                        {step.active && !step.completed && (
                          <Badge variant="default" className="text-xs">진행중</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </div>
                  </div>
                </div>
              </Button>

              {index < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {project && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span>현재 키워드:</span>
              <Badge variant="outline">{project.keyword}</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}