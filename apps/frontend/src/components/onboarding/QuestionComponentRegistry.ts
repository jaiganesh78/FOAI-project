import React from 'react';
import { QuestionInputType, QuestionDto } from '@gpios/shared';
import { TextQuestion } from './questions/TextQuestion';
import { NumberQuestion } from './questions/NumberQuestion';
import { DateQuestion } from './questions/DateQuestion';
import { BooleanQuestion } from './questions/BooleanQuestion';
import { SelectQuestion } from './questions/SelectQuestion';
import { RadioQuestion } from './questions/RadioQuestion';
import { CheckboxQuestion } from './questions/CheckboxQuestion';

export type QuestionComponentProps = {
  question: QuestionDto;
  value: unknown;
  onChange: (val: unknown) => void;
};

export const QuestionComponentRegistry: Record<string, React.FC<QuestionComponentProps>> = {
  [QuestionInputType.TEXT]: TextQuestion as unknown as React.FC<QuestionComponentProps>,
  [QuestionInputType.NUMBER]: NumberQuestion as unknown as React.FC<QuestionComponentProps>,
  [QuestionInputType.DATE]: DateQuestion as unknown as React.FC<QuestionComponentProps>,
  [QuestionInputType.BOOLEAN]: BooleanQuestion as unknown as React.FC<QuestionComponentProps>,
  [QuestionInputType.SELECT]: SelectQuestion as unknown as React.FC<QuestionComponentProps>,
  [QuestionInputType.RADIO]: RadioQuestion as unknown as React.FC<QuestionComponentProps>,
  [QuestionInputType.CHECKBOX]: CheckboxQuestion as unknown as React.FC<QuestionComponentProps>,
  [QuestionInputType.TEXTAREA]: TextQuestion as unknown as React.FC<QuestionComponentProps>,
};
