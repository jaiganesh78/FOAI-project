export interface JourneyCreatedEventPayload {
  journeyId: string;
  userId: string;
  policyId: string;
  blueprintId: string;
  status: string;
}

export interface JourneyStepCompletedEventPayload {
  journeyId: string;
  stepId: string;
  stepName: string;
  userId: string;
  completedAt: Date;
}

export interface JourneyStepBlockedEventPayload {
  journeyId: string;
  stepId: string;
  stepName: string;
  reason: string;
}

export interface JourneySnapshotCreatedEventPayload {
  journeyId: string;
  snapshotId: string;
  userId: string;
  readinessScore: number;
}
