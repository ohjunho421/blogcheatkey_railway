import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Compass,
  ChevronRight,
  SkipForward,
  PenLine,
  Check,
  Loader2,
  BookOpen,
  Scale,
  Wrench,
  Target,
  Sparkles,
  X,
} from "lucide-react";

interface DirectionOption {
  id: string;
  label: string;
  description: string;
  angle: string;
}

interface ArticleDirectionSelectorProps {
  project: any;
  onDirectionSet: (direction: string | null) => void;
}

const DIRECTION_ICONS: Record<string, React.ReactNode> = {
  guide: <BookOpen className="h-4 w-4 shrink-0" />,
  comparison: <Scale className="h-4 w-4 shrink-0" />,
  problem_solution: <Wrench className="h-4 w-4 shrink-0" />,
  expert_review: <Target className="h-4 w-4 shrink-0" />,
};

export function ArticleDirectionSelector({ project, onDirectionSet }: ArticleDirectionSelectorProps) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [customDirection, setCustomDirection] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const keywordAnalysis = project?.keywordAnalysis as any;
  const directionSuggestions: DirectionOption[] = keywordAnalysis?.directionSuggestions || [];
  const alreadySet = keywordAnalysis?.articleDirection;

  const saveDirection = useMutation({
    mutationFn: async (data: { articleDirection: string | null; articleDirectionLabel: string | null }) => {
      const res = await apiRequest("POST", `/api/projects/${project.id}/direction`, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.articleDirection ? "글 방향 설정 완료" : "기본 방향으로 진행",
        description: variables.articleDirection
          ? `'${variables.articleDirectionLabel}' 방향이 자료 수집에 반영됩니다.`
          : "AI가 키워드 의도에 맞게 글을 구성합니다.",
      });
      onDirectionSet(variables.articleDirection);
    },
    onError: () => {
      toast({ title: "오류", description: "방향 저장에 실패했습니다.", variant: "destructive" });
    },
  });

  const handleSelect = (option: DirectionOption) => {
    setSelected(option.id);
    setShowCustomInput(false);
    setCustomDirection("");
  };

  const handleConfirm = () => {
    if (showCustomInput) {
      if (!customDirection.trim()) {
        toast({ title: "방향을 입력해주세요", variant: "destructive" });
        return;
      }
      saveDirection.mutate({ articleDirection: customDirection.trim(), articleDirectionLabel: "직접 입력" });
      return;
    }
    if (selected) {
      const option = directionSuggestions.find((d) => d.id === selected);
      saveDirection.mutate({
        articleDirection: option ? `${option.label}: ${option.angle}` : selected,
        articleDirectionLabel: option?.label || selected,
      });
    }
  };

  const handleSkip = () => {
    saveDirection.mutate({ articleDirection: null, articleDirectionLabel: null });
  };

  if (directionSuggestions.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Compass className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">글 방향 설정</span>
        <Badge variant="outline" className="text-xs text-muted-foreground">선택사항</Badge>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        어떤 관점으로 글을 쓸지 선택하면 자료 수집부터 반영됩니다.
        선택하지 않으면 AI가 키워드 의도에 맞게 자동 구성합니다.
      </p>

      {/* 이미 설정된 경우 표시 */}
      {alreadySet && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary min-h-[44px]">
          <Check className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">
            현재 방향: <strong>{keywordAnalysis.articleDirectionLabel || alreadySet}</strong>
          </span>
          <button
            onClick={() => saveDirection.mutate({ articleDirection: null, articleDirectionLabel: null })}
            className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive rounded px-1"
            aria-label="방향 해제"
          >
            <X className="h-3.5 w-3.5" />
            해제
          </button>
        </div>
      )}

      {/* 방향 카드 그리드 */}
      <div className="grid grid-cols-2 gap-2">
        {directionSuggestions.map((option) => {
          const isSelected = selected === option.id;
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option)}
              className={`text-left p-3 rounded-xl border transition-all duration-150 cursor-pointer min-h-[72px]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                hover:border-primary/50 hover:bg-primary/5
                ${isSelected
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card"
                }`}
            >
              <div className="flex items-start gap-2">
                <span className={`mt-0.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                  {DIRECTION_ICONS[option.id] ?? <Sparkles className="h-4 w-4 shrink-0" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{option.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                    {option.description}
                  </p>
                </div>
                {isSelected && (
                  <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                )}
              </div>
            </button>
          );
        })}

        {/* 직접 입력 카드 */}
        <button
          onClick={() => {
            setShowCustomInput(true);
            setSelected(null);
          }}
          className={`text-left p-3 rounded-xl border transition-all duration-150 cursor-pointer min-h-[72px]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
            hover:border-primary/50 hover:bg-primary/5
            ${showCustomInput
              ? "border-primary bg-primary/10 shadow-sm"
              : "border-dashed border-border bg-card"
            }`}
        >
          <div className="flex items-start gap-2">
            <PenLine className={`h-4 w-4 mt-0.5 shrink-0 ${showCustomInput ? "text-primary" : "text-muted-foreground"}`} />
            <div>
              <p className="text-xs font-semibold text-foreground">직접 입력</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                원하는 방향을 직접 입력
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* 직접 입력 텍스트 영역 */}
      {showCustomInput && (
        <Textarea
          value={customDirection}
          onChange={(e) => setCustomDirection(e.target.value)}
          placeholder="예: 초보자도 쉽게 따라할 수 있는 실습 중심의 단계별 가이드"
          className="text-sm resize-none h-20"
          autoFocus
        />
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        {(selected || showCustomInput) && (
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={saveDirection.isPending}
            className="flex-1 gap-1.5 cursor-pointer min-h-[36px]"
          >
            {saveDirection.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            이 방향으로 자료 수집
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSkip}
          disabled={saveDirection.isPending}
          className="gap-1.5 text-muted-foreground cursor-pointer min-h-[36px]"
        >
          <SkipForward className="h-3.5 w-3.5" />
          {selected || showCustomInput ? "건너뛰기" : "방향 없이 시작"}
        </Button>
      </div>
    </div>
  );
}
