import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

interface GenerateBlogButtonProps {
  project: any;
  onRefresh: () => void;
}

export function GenerateBlogButton({ project, onRefresh }: GenerateBlogButtonProps) {
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  const steps = [
    { label: "키워드 분석 검토", duration: 5 },
    { label: "자료 수집 및 정리", duration: 10 },
    { label: "SEO 최적화 구조 설계", duration: 15 },
    { label: "블로그 콘텐츠 작성", duration: 60 },
    { label: "형태소 빈도 검증", duration: 10 }
  ];

  const generateContent = useMutation({
    mutationFn: async (projectId: number) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/generate`);
      return response.json();
    },
    onSuccess: () => {
      onRefresh();
      setProgress(100);
      setCurrentStep("완료");
      toast({
        title: "블로그 생성 완료",
        description: "SEO 최적화된 블로그 포스트가 생성되었습니다.",
      });
    },
    onError: (error: any) => {
      setProgress(0);
      setCurrentStep("");
      toast({
        title: "블로그 생성 실패",
        description: error.message || "블로그 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (generateContent.isPending) {
      setProgress(0);
      setCurrentStep(steps[0].label);
      
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 0.8, 95); // 더 느린 속도로, 최대 95%까지
          
          // 단계 변경 로직
          let stepIndex = 0;
          let accumulated = 0;
          
          for (let i = 0; i < steps.length; i++) {
            accumulated += (steps[i].duration / 100) * 95; // 전체 95%에 맞춰 조정
            if (newProgress <= accumulated) {
              stepIndex = i;
              break;
            }
          }
          
          if (stepIndex < steps.length) {
            setCurrentStep(steps[stepIndex].label);
          }
          
          return newProgress;
        });
      }, 1200); // 1.2초마다 0.8% 증가
    } else {
      // mutation이 완료되면 진행률과 단계 리셋
      setProgress(0);
      setCurrentStep("");
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [generateContent.isPending]);

  const handleGenerate = () => {
    generateContent.mutate(project.id);
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleGenerate}
        disabled={generateContent.isPending}
        size="lg"
        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 w-full"
      >
        {generateContent.isPending ? (
          <>
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            블로그 생성 중...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 mr-2" />
            블로그 생성 시작
          </>
        )}
      </Button>
      
      {generateContent.isPending && (
        <div className="space-y-3 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-blue-700 dark:text-blue-300">{currentStep}</span>
            <span className="text-blue-700 dark:text-blue-300">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            예상 소요 시간: 약 1-2분
          </p>
        </div>
      )}
    </div>
  );
}