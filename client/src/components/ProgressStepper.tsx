import { Check } from "lucide-react";

interface ProgressStepperProps {
  currentStep: number;
}

const steps = [
  "키워드 분석",
  "자료 수집", 
  "업체 정보",
  "글 작성"
];

export function ProgressStepper({ currentStep }: ProgressStepperProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className="flex items-center space-x-2">
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
            <span className={`text-sm font-medium ${
              index <= currentStep ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`h-px w-16 mx-4 ${
              index < currentStep ? 'bg-primary' : 'bg-border'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
