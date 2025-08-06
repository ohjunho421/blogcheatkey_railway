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
    if (!generateContent.isPending) {
      return;
    }

    setProgress(0);
    setCurrentStep(steps[0].label);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + 1, 98); // 최대 98%까지만
        
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
        
        setCurrentStep(steps[stepIndex].label);
        
        return newProgress;
      });
    }, 1000); // 1초마다 1% 증가

    return () => clearInterval(interval);
  }, [generateContent.isPending, steps]);

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
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">{currentStep}</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            예상 소요 시간: 약 1-2분
          </p>
        </div>
      )}
    </div>
  );
}