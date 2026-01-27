import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, RefreshCw, Sparkles, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import PaymentModal from "@/components/PaymentModal";

const MAX_FREE_GENERATIONS = 3;

interface GenerateBlogButtonProps {
  project: any;
  onRefresh: () => void;
}

export function GenerateBlogButton({ project, onRefresh }: GenerateBlogButtonProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  
  // 사용 가능 여부 체크
  const isAdmin = user?.isAdmin;
  const hasActiveSubscription = user?.subscriptionExpiresAt && 
    new Date(user.subscriptionExpiresAt) > new Date();
  const hadPreviousSubscription = user?.subscriptionExpiresAt !== null && user?.subscriptionExpiresAt !== undefined;
  const freeCount = user?.freeGenerationCount || 0;
  const isFreeLimitReached = freeCount >= MAX_FREE_GENERATIONS;
  
  // 사용 가능 조건: 관리자 OR 활성 구독자 OR (이전 구독 없음 AND 무료 횟수 남음)
  const canGenerate = isAdmin || hasActiveSubscription || (!hadPreviousSubscription && !isFreeLimitReached);

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

  // 비활성화 사유 메시지
  const getDisabledReason = () => {
    if (hadPreviousSubscription && !hasActiveSubscription) {
      return "구독이 만료되었습니다. 갱신 후 이용해주세요.";
    }
    if (isFreeLimitReached) {
      return `무료 체험 ${MAX_FREE_GENERATIONS}회를 모두 사용했습니다. 구독 후 이용해주세요.`;
    }
    return "";
  };

  return (
    <div className="space-y-4">
      {canGenerate ? (
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
      ) : (
        <div className="space-y-3">
          <Button 
            disabled
            size="lg"
            className="bg-gray-400 text-white px-8 py-3 w-full cursor-not-allowed"
          >
            <Lock className="h-5 w-5 mr-2" />
            블로그 생성 (구독 필요)
          </Button>
          <p className="text-sm text-red-500 text-center">{getDisabledReason()}</p>
          <PaymentModal>
            <Button 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 w-full"
            >
              🔓 구독하고 무제한 이용하기
            </Button>
          </PaymentModal>
        </div>
      )}
      
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