'use client';

import React from 'react';
import { QuestionDto } from '@gpios/shared';

interface Props {
  question: QuestionDto;
  value: string;
  onChange: (val: string) => void;
}

export const SelectQuestion: React.FC<Props> = ({ question, value, onChange }) => {
  const options = question.options || [];

  return (
    <div className="space-y-2">
      <label htmlFor={question.questionCode} className="block text-sm font-semibold text-slate-200">
        {question.label} {question.isRequired && <span className="text-rose-500">*</span>}
      </label>
      {question.description && <p className="text-xs text-slate-400">{question.description}</p>}
      <select
        id={question.questionCode}
        value={value || ''}
        disabled={question.isDisabled}
        aria-label={question.renderingMetadata?.ariaLabel || question.label}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
      >
        <option value="" disabled>
          Select an option...
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
            {opt.label}
          </option>
        ))}
      </select>
      {question.helpText && <p className="text-xs text-slate-500">{question.helpText}</p>}
    </div>
  );
};
