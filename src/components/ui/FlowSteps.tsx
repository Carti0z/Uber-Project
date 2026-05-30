import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface FlowStepsProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function FlowSteps({ steps, currentStep, className }: FlowStepsProps) {
  return (
    <div className={cn("w-full overflow-x-auto pb-2", className)}>
      <div className="flex min-w-max items-center gap-0">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isComplete = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5 px-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition",
                    isComplete && "bg-green-500 text-white",
                    isCurrent && "bg-sky-500 text-white ring-4 ring-sky-500/30",
                    !isComplete && !isCurrent && "bg-slate-700 text-slate-400"
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : stepNum}
                </div>
                <span
                  className={cn(
                    "max-w-[72px] text-center text-[10px] leading-tight sm:max-w-none sm:text-xs",
                    isCurrent ? "font-medium text-sky-400" : "text-slate-500"
                  )}
                >
                  {label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mb-5 h-0.5 w-6 sm:w-10",
                    stepNum < currentStep ? "bg-green-500" : "bg-slate-700"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
