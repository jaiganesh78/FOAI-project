'use client';

import React from 'react';
import { QuestionDto } from '@gpios/shared';

interface Props {
  question: QuestionDto;
  value: unknown;
  onChange: (val: boolean) => void;
}

export const BooleanQuestion: React.FC<Props> = ({ question, value, onChange }) => {
  const boolVal = value === true || value === 'true';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-200">
        {question.label} {question.isRequired && <span className="text-rose-500">*</span>}
      </label>
      {question.description && <p className="text-xs text-slate-400">{question.description}</p>}
      <div className="flex items-center space-x-4 pt-1">
        <button
          type="button"
          disabled={question.isDisabled}
          onClick={() => onChange(true)}
          className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
            boolVal
              ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          disabled={question.isDisabled}
          onClick={() => onChange(false)}
          className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
            value === false || value === 'false'
              ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
          }`}
        >
          No
        </button>
      </div>
      {question.helpText && <p className="text-xs text-slate-500">{question.helpText}</p>}
    </div>
  );
};
