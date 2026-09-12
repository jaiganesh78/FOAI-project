import { StandardDomainEventEnvelope } from './domain-event.registry';

export interface OnboardingStartedPayload {
  sessionId: string;
  userId: string;
  blueprintCode: string;
  blueprintVersion: number;
}

export interface OnboardingQuestionAnsweredPayload {
  sessionId: string;
  userId: string;
  stepKey: string;
  questionKey: string;
  attributeKey: string;
  rawInput: unknown;
  normalizedValue: unknown;
  answerStatus: string;
}

export interface OnboardingStepCompletedPayload {
  sessionId: string;
  userId: string;
  stepKey: string;
  completedStepsCount: number;
  totalStepsCount: number;
}

export interface OnboardingPausedPayload {
  sessionId: string;
  userId: string;
  currentStep: string;
}

export interface OnboardingResumedPayload {
  sessionId: string;
  userId: string;
  currentStep: string;
}

export interface OnboardingCompletedPayload {
  sessionId: string;
  userId: string;
  completionPercentage: number;
  completedAt: Date;
}

export type OnboardingStartedEvent = StandardDomainEventEnvelope<OnboardingStartedPayload>;
export type OnboardingQuestionAnsweredEvent = StandardDomainEventEnvelope<OnboardingQuestionAnsweredPayload>;
export type OnboardingStepCompletedEvent = StandardDomainEventEnvelope<OnboardingStepCompletedPayload>;
export type OnboardingPausedEvent = StandardDomainEventEnvelope<OnboardingPausedPayload>;
export type OnboardingResumedEvent = StandardDomainEventEnvelope<OnboardingResumedPayload>;
export type OnboardingCompletedEvent = StandardDomainEventEnvelope<OnboardingCompletedPayload>;
