import { OnboardingSessionStatus, QuestionInputType, AnswerStatus } from '../enums/onboarding.enum';

export interface QuestionRenderingMetadataDto {
  width?: string;
  section?: string;
  icon?: string;
  tooltip?: string;
  placeholderExamples?: string[];
  keyboardType?: string;
  autocompleteHint?: string;
  preferredComponent?: string;
  i18nKey?: string;
  ariaLabel?: string;
}

export interface QuestionDto {
  id: string;
  questionCode: string;
  attributeKey: string;
  label: string;
  description?: string | null;
  helpText?: string | null;
  placeholder?: string | null;
  inputType: QuestionInputType;
  options?: { label: string; value: string }[] | null;
  renderingMetadata?: QuestionRenderingMetadataDto | null;
  displayGroup: string;
  displayOrder: number;
  isRequired: boolean;
  isVisible: boolean;
  isDisabled: boolean;
  currentValue?: unknown;
}

export interface StepQuestionsDto {
  stepKey: string;
  stepTitle: string;
  questions: QuestionDto[];
}

export interface OnboardingSessionDto {
  id: string;
  userId: string;
  blueprintCode: string;
  blueprintVersion: number;
  currentStep: string;
  completedSteps: string[];
  skippedSteps: string[];
  completionPercentage: number;
  status: OnboardingSessionStatus;
  version: number;
  lastActivityAt: string;
}

export interface SubmitAnswerInputDto {
  questionKey: string;
  rawInput: unknown;
  status?: AnswerStatus;
}

export interface OnboardingProgressDto {
  sessionId: string;
  blueprintCode: string;
  currentStep: string;
  totalSteps: number;
  completedStepsCount: number;
  completionPercentage: number;
  status: OnboardingSessionStatus;
  categoryProgress: {
    category: string;
    total: number;
    filled: number;
    percentage: number;
  }[];
}
