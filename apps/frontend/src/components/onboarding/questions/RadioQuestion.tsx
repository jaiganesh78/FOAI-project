'use client';

import React from 'react';
import { QuestionDto } from '@gpios/shared';

interface Props {
  question: QuestionDto;
  value: string;
  onChange: (val: string) => void;
}

export const RadioQuestion: React.FC<Props> = ({ question, value, onChange }) => {
  const options = question.options || [];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-200">
        {question.label} {question.isRequired && <span className="text-rose-500">*</span>}
      </label>
      {question.description && <p className="text-xs text-slate-400">{question.description}</p>}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={question.isDisabled}
              onClick={() => onChange(opt.value)}
              className={`rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                  : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {question.helpText && <p className="text-xs text-slate-500">{question.helpText}</p>}
    </div>
  );
};
