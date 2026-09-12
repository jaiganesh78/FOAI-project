import { OnboardingSession, OnboardingSessionStatus, Prisma } from '@prisma/client';

export interface CreateSessionData {
  userId: string;
  blueprintId: string;
  blueprintVersion: number;
  currentStep: string;
  completedSteps?: string[];
  skippedSteps?: string[];
  status?: OnboardingSessionStatus;
  updatedBy: string;
}

export interface UpdateSessionData {
  currentStep?: string;
  completedSteps?: string[];
  skippedSteps?: string[];
  draftAnswers?: Record<string, unknown>;
  completionPercentage?: number;
  status?: OnboardingSessionStatus;
  updatedBy: string;
  changeReason?: string;
  previousState?: Prisma.InputJsonValue;
}

export interface IOnboardingSessionRepository {
  findByUserId(userId: string): Promise<OnboardingSession | null>;
  findById(id: string): Promise<OnboardingSession | null>;
  createSession(data: CreateSessionData): Promise<OnboardingSession>;
  updateSession(id: string, data: UpdateSessionData): Promise<OnboardingSession>;
  logTimelineEvent(sessionId: string, eventType: string, stepKey?: string, questionKey?: string, details?: unknown): Promise<void>;
  softDelete(id: string): Promise<boolean>;
}
