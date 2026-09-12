'use client';

import React from 'react';
import { QuestionDto } from '@gpios/shared';
import { QuestionComponentRegistry } from './QuestionComponentRegistry';

interface Props {
  question: QuestionDto;
  value: unknown;
  onChange: (val: unknown) => void;
}

export const QuestionRenderer: React.FC<Props> = ({ question, value, onChange }) => {
  const Component = QuestionComponentRegistry[question.inputType] || QuestionComponentRegistry['TEXT'];
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700">
      <Component question={question} value={value} onChange={onChange} />
    </div>
  );
};
