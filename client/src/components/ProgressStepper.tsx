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
      className="flex items-start justify-between gap-1 overflow-x-auto pb-1"
    >
      {STEPS.map((step, index) => (
        <div key={step.label} className="flex items-center">
          <div className="flex flex-col items-center min-w-[60px] text-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index <= currentStep
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}>
              {index < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className={`text-sm font-medium mt-1 ${
              index <= currentStep ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {step.label}
            </span>
            <span className="text-[10px] text-muted-foreground">{step.desc}</span>
          </div>
          {index < STEPS.length - 1 && (
            <div className={`h-0.5 w-16 mx-4 mt-[-16px] ${
              index < currentStep ? 'bg-primary' : 'bg-border'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
