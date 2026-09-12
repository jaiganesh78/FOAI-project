'use client';

import React from 'react';
import { QuestionDto } from '@gpios/shared';

interface Props {
  question: QuestionDto;
  value: unknown;
  onChange: (val: boolean) => void;
}

export const CheckboxQuestion: React.FC<Props> = ({ question, value, onChange }) => {
  const isChecked = value === true || value === 'true';

  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-3">
        <input
          id={question.questionCode}
          type="checkbox"
          checked={isChecked}
          disabled={question.isDisabled}
          aria-label={question.renderingMetadata?.ariaLabel || question.label}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
        />
        <label htmlFor={question.questionCode} className="text-sm font-semibold text-slate-200">
          {question.label} {question.isRequired && <span className="text-rose-500">*</span>}
        </label>
      </div>
      {question.description && <p className="pl-7 text-xs text-slate-400">{question.description}</p>}
      {question.helpText && <p className="pl-7 text-xs text-slate-500">{question.helpText}</p>}
    </div>
  );
};
