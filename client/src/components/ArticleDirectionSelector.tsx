import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, SkipForward, Loader2 } from "lucide-react";

const EXAMPLE_CHIPS = [
  "내 사업장을 홍보하려는 분들에게 도움이 되는 글",
  "이 분야를 처음 접하는 초보자를 위한 입문 가이드",
  "비용 절약 방법을 찾는 소비자를 위한 실용 정보",
  "전문 종사자가 업무에 활용할 수 있는 심층 정보",
];

interface ArticleDirectionSelectorProps {
  keyword: string;
  onConfirm: (direction: string | null) => void;
  isLoading: boolean;
}

export function ArticleDirectionSelector({
  keyword,
  onConfirm,
  isLoading,
}: ArticleDirectionSelectorProps) {
  const [direction, setDirection] = useState("");

  const handleChip = (chip: string) => {
    setDirection(chip);
  };

  const handleConfirm = () => {
    const trimmed = direction.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  const handleSkip = () => {
    onConfirm(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        이 글을 <strong>어떤 목적으로, 누구를 위해</strong> 쓰는지 알려주세요.
        AI가 소제목과 자료를 그 방향에 맞게 바꿔드립니다.
      </p>

      {/* 예시 칩 */}
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLE_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => handleChip(chip)}
            disabled={isLoading}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all duration-150 cursor-pointer
              hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
              ${direction === chip
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border bg-card text-muted-foreground"
              }`}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* 자유 입력 */}
      <Textarea
        value={direction}
        onChange={(e) => setDirection(e.target.value)}
        placeholder={`예: "${keyword}을/를 이용해 수익을 내려는 사업자를 위한 실전 가이드"`}
        className="text-sm resize-none h-16 placeholder:text-muted-foreground/60"
        disabled={isLoading}
      />

      {/* 액션 버튼 */}
      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={!direction.trim() || isLoading}
          className="w-full gap-1.5 cursor-pointer min-h-[40px]"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          {isLoading ? "처리 중..." : "이 방향으로 소제목 재생성 + 자료 수집"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSkip}
          disabled={isLoading}
          className="w-full gap-1.5 text-muted-foreground cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <SkipForward className="h-3.5 w-3.5" />
          )}
          {isLoading ? "처리 중..." : "방향 없이 자료 수집"}
        </Button>
      </div>
    </div>
  );
}
