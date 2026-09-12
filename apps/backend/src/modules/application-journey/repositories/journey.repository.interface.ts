import { ApplicationJourney, ApplicationJourneyStep, ApplicationChecklist, ActionPlan, JourneyHistory } from '@prisma/client';
import { ApplicationJourneyStatus, JourneyStepStatus } from '@gpios/shared';

export type ApplicationJourneyWithDetails = ApplicationJourney & {
  steps: ApplicationJourneyStep[];
  checklist: ApplicationChecklist | null;
  actionPlan: ActionPlan | null;
};

export interface CreateJourneyData {
  userId: string;
  policyId: string;
  policyTitle: string;
  blueprintId: string;
  urgency: string;
  readinessScore: number;
}

export interface IApplicationJourneyRepository {
  findById(id: string): Promise<ApplicationJourneyWithDetails | null>;
  findLatestByUserId(userId: string): Promise<ApplicationJourneyWithDetails | null>;
  findByUserId(userId: string): Promise<ApplicationJourneyWithDetails[]>;
  createJourney(data: CreateJourneyData): Promise<ApplicationJourneyWithDetails>;
  updateStatus(id: string, status: ApplicationJourneyStatus): Promise<ApplicationJourneyWithDetails>;
  updateStepStatus(stepId: string, status: JourneyStepStatus): Promise<ApplicationJourneyStep>;
  addHistory(journeyId: string, action: string, details: Record<string, unknown>): Promise<JourneyHistory>;
}
