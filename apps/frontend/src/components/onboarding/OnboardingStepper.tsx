'use client';

import React from 'react';

export interface StepItem {
  stepKey: string;
  title: string;
}

interface Props {
  steps: StepItem[];
  currentStepKey: string;
  completedSteps: string[];
  onSelectStep?: (stepKey: string) => void;
}

export const OnboardingStepper: React.FC<Props> = ({ steps, currentStepKey, completedSteps, onSelectStep }) => {
  return (
    <div className="w-full">
      <ol className="flex items-center justify-between space-x-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        {steps.map((step, idx) => {
          const isCurrent = step.stepKey === currentStepKey;
          const isCompleted = completedSteps.includes(step.stepKey);

          return (
            <li
              key={step.stepKey}
              onClick={() => isCompleted && onSelectStep && onSelectStep(step.stepKey)}
              className={`flex flex-1 items-center space-x-3 rounded-lg p-2 text-xs font-medium transition-all ${
                isCurrent
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : isCompleted
                  ? 'cursor-pointer text-emerald-400 hover:bg-slate-800/60'
                  : 'text-slate-500'
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isCurrent
                    ? 'bg-cyan-500 text-slate-950'
                    : isCompleted
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isCompleted ? '✓' : idx + 1}
              </span>
              <span className="hidden truncate sm:inline">{step.title}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
