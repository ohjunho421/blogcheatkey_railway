import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

interface ContentGenerationProgressProps {
  project: any;
}

export function ContentGenerationProgress({ project }: ContentGenerationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: "키워드 분석 검토", duration: 5 },
    { label: "자료 수집 및 정리", duration: 10 },
    { label: "SEO 최적화 구조 설계", duration: 15 },
    { label: "블로그 콘텐츠 작성", duration: 60 },
    { label: "형태소 빈도 검증", duration: 10 }
  ];

  useEffect(() => {
    if (!project || project.status !== 'content_generation') return;

    let totalDuration = 0;
    let currentDuration = 0;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 1;
        
        // 단계 변경 로직
        let stepIndex = 0;
        let accumulated = 0;
        
        for (let i = 0; i < steps.length; i++) {
          accumulated += steps[i].duration;
          if (newProgress <= accumulated) {
            stepIndex = i;
            break;
          }
        }
        
        setCurrentStep(stepIndex);
        
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        
        return newProgress;
      });
    }, 1000); // 1초마다 1% 증가

    return () => clearInterval(interval);
  }, [project?.status]);

  if (!project || project.status !== 'content_generation' || project.generatedContent) {
    return null;
  }

  return (
    <Card className="border-accent">
      <CardContent className="py-8">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="h-8 w-8 text-accent animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-accent">AI가 블로그를 작성하고 있습니다</h3>
            <p className="text-muted-foreground">
              SEO 최적화된 고품질 콘텐츠를 생성 중입니다
            </p>
          </div>

          {/* 진행률 바 */}
          <div className="space-y-3">
            <Progress value={progress} className="h-3" />
            <div className="text-sm text-muted-foreground">
              {progress}% 완료 ({Math.floor(progress * 1.5)}초 경과)
            </div>
          </div>

          {/* 단계별 진행 상황 */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  {index < currentStep ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : index === currentStep ? (
                    <Clock className="h-4 w-4 text-accent animate-pulse" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted" />
                  )}
                  <span className={index <= currentStep ? "text-foreground" : "text-muted-foreground"}>
                    {step.label}
                  </span>
                </div>
                
                {index < currentStep && (
                  <span className="text-green-500 text-xs">완료</span>
                )}
                {index === currentStep && (
                  <span className="text-accent text-xs animate-pulse">진행 중</span>
                )}
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
            💡 <strong>참고:</strong> AI가 키워드 빈도, 글자 수, SEO 최적화 등을 자동으로 확인하며 
            여러 번 검토하여 최고 품질의 콘텐츠를 생성합니다.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}