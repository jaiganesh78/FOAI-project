import {
  ApplicationJourneyStatus,
  JourneyStepStatus,
  ChecklistStatus,
  DocumentRequirementStatus,
  JourneyUrgency,
  TimelineEventType,
  StepExecutionMode,
  StepOwner,
  StepBlockingBehavior,
} from '../enums/journey.enum';

export interface StepExecutionPolicyDto {
  executionMode: StepExecutionMode;
  owner: StepOwner;
  retryLimit: number;
  retryIntervalMs: number;
  blockingBehavior: StepBlockingBehavior;
  timeoutMs: number;
  requiresVerification: boolean;
}

export interface ApplicationJourneyStepDto {
  id: string;
  stepCode: string;
  title: string;
  description: string;
  status: JourneyStepStatus;
  order: number;
  isOptional: boolean;
  executionPolicy: StepExecutionPolicyDto;
  prerequisiteStepIds: string[];
  blockedByStepIds: string[];
}

export interface ApplicationChecklistItemDto {
  id: string;
  itemKey: string;
  title: string;
  type: 'FACT' | 'DOCUMENT' | 'EVIDENCE' | 'VERIFICATION';
  status: ChecklistStatus;
  isMandatory: boolean;
  notes?: string;
}

export interface ApplicationChecklistDto {
  id: string;
  journeyId: string;
  status: ChecklistStatus;
  items: ApplicationChecklistItemDto[];
}

export interface DocumentRequirementDto {
  id: string;
  documentType: string;
  title: string;
  isMandatory: boolean;
  acceptedFormats: string[];
  maxAgeDays?: number;
  maxSizeBytes: number;
  issuingAuthority: string;
  requiresVerification: boolean;
  status: DocumentRequirementStatus;
}

export interface JourneyReadinessDto {
  score: number; // 0-100
  citizenFactsPercentage: number;
  documentsPercentage: number;
  evidencePercentage: number;
  verificationPercentage: number;
  applicationStatusPercentage: number;
  dependencyPercentage: number;
  missingItemsCount: number;
}

export interface ActionPlanStepDto {
  id: string;
  timeframe: 'TODAY' | 'TOMORROW' | 'NEXT_UP' | 'FINALLY';
  stepTitle: string;
  instruction: string;
  priority: JourneyUrgency;
  isCompleted: boolean;
}

export interface ActionPlanDto {
  id: string;
  journeyId: string;
  steps: ActionPlanStepDto[];
  createdAt: string;
}

export interface JourneyBlueprintDto {
  id: string;
  parentBlueprintId?: string;
  policyId: string;
  policyTitle: string;
  version: number;
  name: string;
  description: string;
  steps: ApplicationJourneyStepDto[];
  documentRequirements: DocumentRequirementDto[];
}

export interface ApplicationJourneyDto {
  id: string;
  userId: string;
  policyId: string;
  policyTitle: string;
  blueprintId: string;
  status: ApplicationJourneyStatus;
  urgency: JourneyUrgency;
  readinessScore: number;
  steps: ApplicationJourneyStepDto[];
  checklist?: ApplicationChecklistDto;
  actionPlan?: ActionPlanDto;
  createdAt: string;
  updatedAt: string;
}

export interface JourneySnapshotDto {
  id: string;
  journeyId: string;
  userId: string;
  citizenSnapshotId: string;
  eligibilitySnapshotId: string;
  recommendationSnapshotId: string;
  journeyVersion: number;
  snapshotData: Record<string, unknown>;
  createdAt: string;
}

export interface JourneyTimelineEventDto {
  id: string;
  journeyId: string;
  eventType: TimelineEventType;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface JourneyDifferenceDto {
  journeyId: string;
  changeType: 'STEP_COMPLETED' | 'STEP_BLOCKED' | 'DEADLINE_MOVED' | 'NEW_DOCUMENT_REQUIRED';
  stepTitle?: string;
  details: string;
}

export interface JourneyAnalyticsDto {
  averageJourneyDurationMs: number;
  averageApprovalDurationMs: number;
  averageStepDurationMs: number;
  averageWaitingTimeMs: number;
  averageVerificationTimeMs: number;
  longestBlockingStepTitle: string;
  deadlineMissRate: number;
  journeyReplayDurationMs: number;
  snapshotCreationDurationMs: number;
  blueprintReusePercent: number;
  mostFailedStepTitle: string;
  mostRepeatedStepTitle: string;
  averageCitizenCompletionPercent: number;
  averageGovernmentProcessingPercent: number;
  dependencyResolutionTimeMs: number;
}

export interface JourneyReplayResultDto {
  journeyId: string;
  snapshotId: string;
  isMatch: boolean;
  replayType: 'SNAPSHOT' | 'EVENT';
  executionTimeMs: number;
  driftDetails: string[];
}
