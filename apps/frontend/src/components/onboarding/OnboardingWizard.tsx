'use client';

import React, { useState } from 'react';
import { StepQuestionsDto, OnboardingSessionDto } from '@gpios/shared';
import { OnboardingStepper } from './OnboardingStepper';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { QuestionRenderer } from './QuestionRenderer';

interface Props {
  session: OnboardingSessionDto;
  stepQuestions: StepQuestionsDto;
  onSubmitAnswers: (answers: Record<string, unknown>) => Promise<void>;
}

export const OnboardingWizard: React.FC<Props> = ({ session, stepQuestions, onSubmitAnswers }) => {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { stepKey: 'personal_info', title: 'Personal Info' },
    { stepKey: 'financial_info', title: 'Income & Occupation' },
    { stepKey: 'agriculture_info', title: 'Agriculture & Land' },
    { stepKey: 'community_info', title: 'Social Category' },
    { stepKey: 'location_info', title: 'Address' },
  ];

  const handleAnswerChange = (questionKey: string, val: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: val }));
  };

  const handleSaveAndContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmitAnswers(answers);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Adaptive Citizen Discovery</h1>
          <p className="text-sm text-slate-400">Intelligently discovering your profile attributes</p>
        </div>
        <AutoSaveIndicator status="SAVED" />
      </div>

      {/* Stepper */}
      <OnboardingStepper
        steps={steps}
        currentStepKey={session.currentStep}
        completedSteps={session.completedSteps}
      />

      {/* Step Container */}
      <form onSubmit={handleSaveAndContinue} className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-md">
          <h2 className="mb-4 text-lg font-bold text-cyan-400">{stepQuestions.stepTitle}</h2>
          <div className="space-y-5">
            {stepQuestions.questions.map((q) => (
              <QuestionRenderer
                key={q.id}
                question={q}
                value={answers[q.questionCode] ?? q.currentValue ?? ''}
                onChange={(val) => handleAnswerChange(q.questionCode, val)}
              />
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500">Progress: {session.completionPercentage}%</span>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg transition-all hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save & Next →'}
          </button>
        </div>
      </form>
    </div>
  );
};
