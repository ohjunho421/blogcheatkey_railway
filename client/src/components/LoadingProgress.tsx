import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Sparkles } from "lucide-react";

interface LoadingProgressProps {
  isLoading: boolean;
  stage: 'preparing' | 'analyzing' | 'generating' | 'optimizing' | 'completing' | 'completed';
}

const stages = [
  { key: 'preparing', label: '블로그 생성 준비 중', description: '키워드와 업체정보를 분석하고 있습니다' },
  { key: 'analyzing', label: 'SEO 최적화 분석', description: '검색 최적화를 위한 분석을 진행합니다' },
  { key: 'generating', label: '콘텐츠 생성 중', description: '전문적이고 매력적인 블로그 글을 작성합니다' },
  { key: 'optimizing', label: '품질 최적화', description: '형태소 분석을 통해 SEO를 최적화합니다' },
  { key: 'completing', label: '최종 검토', description: '생성된 콘텐츠의 품질을 확인합니다' },
  { key: 'completed', label: '완료', description: '블로그 생성이 완료되었습니다!' }
];

export function LoadingProgress({ isLoading, stage }: LoadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      if (stage === 'completed') {
        setProgress(100);
        setCurrentStageIndex(5);
      }
      return;
    }

    const stageIndex = stages.findIndex(s => s.key === stage);
    setCurrentStageIndex(stageIndex);

    // 각 단계별 진행률 계산
    const baseProgress = (stageIndex / (stages.length - 1)) * 100;
    setProgress(baseProgress);

    // 현재 단계 내에서의 세부 진행률 애니메이션
    if (stageIndex < stages.length - 1) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const nextStageProgress = ((stageIndex + 1) / (stages.length - 1)) * 100;
          if (prev < nextStageProgress - 5) {
            return prev + 1;
          }
          return prev;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isLoading, stage]);

  if (!isLoading && stage !== 'completed') {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Sparkles className="h-5 w-5 mr-2 text-primary" />
          블로그 생성 진행상황
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 전체 진행률 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>전체 진행률</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* 단계별 상태 */}
        <div className="space-y-3">
          {stages.map((stageItem, index) => {
            const isCompleted = index < currentStageIndex || stage === 'completed';
            const isCurrent = index === currentStageIndex && isLoading;
            const isPending = index > currentStageIndex && stage !== 'completed';

            return (
              <div
                key={stageItem.key}
                className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                  isCompleted 
                    ? 'bg-green-50 border border-green-200' 
                    : isCurrent 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : isCurrent ? (
                    <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    isCompleted ? 'text-green-800' : isCurrent ? 'text-blue-800' : 'text-gray-600'
                  }`}>
                    {stageItem.label}
                  </p>
                  <p className={`text-xs mt-1 ${
                    isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {stageItem.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {stage === 'completed' && (
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-green-800 font-medium">블로그 생성이 완료되었습니다!</p>
            <p className="text-green-600 text-sm mt-1">아래에서 생성된 콘텐츠를 확인하세요.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}