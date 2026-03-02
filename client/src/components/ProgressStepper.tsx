import { Check } from "lucide-react";

interface ProgressStepperProps {
  currentStep: number;
}

const STEPS = [
  { label: "키워드 분석", desc: "검색 의도 파악" },
  { label: "자료 수집", desc: "관련 정보 수집" },
  { label: "업체 정보", desc: "비즈니스 정보" },
  { label: "글 작성", desc: "콘텐츠 생성" },
];

export function ProgressStepper({ currentStep }: ProgressStepperProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={0}
      aria-valuemax={STEPS.length - 1}
      aria-label="프로젝트 진행 단계"
    >
      {/* 원 + 연결선 행 */}
      <div className="flex items-center mb-3">
        {STEPS.map((step, index) => (
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                index <= currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 ${
                  index < currentStep ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* 라벨 행 */}
      <div className="flex justify-between">
        {STEPS.map((step, index) => (
          <div
            key={step.label}
            className="flex flex-col items-center text-center w-[60px]"
          >
            <span
              className={`text-xs font-medium ${
                index <= currentStep ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
            <span className="text-[10px] text-muted-foreground">{step.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
