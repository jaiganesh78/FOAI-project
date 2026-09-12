import {
  EligibilitySnapshot,
  EligibilityResult,
  OpportunityAnalysis,
  BenefitAnalysis,
  EligibilityStatus,
  OpportunityGapType,
} from '@prisma/client';

export interface CreateEligibilitySnapshotData {
  userId: string;
  citizenSnapshotId: string;
  policyVersionId: string;
  decisionTraceId: string;
  status: EligibilityStatus;
  resultSummary: Record<string, unknown>;
  results: {
    policyId: string;
    policyVersionId: string;
    status: EligibilityStatus;
    passedRules: string[];
    failedRules: string[];
    skippedRules: string[];
    humanExplanation: string;
    technicalExplanation: string;
  }[];
  benefitAnalysis?: {
    totalMonetaryValue: number;
    recurringMonthlyValue: number;
    oneTimeGrantValue: number;
    urgencyLevel: string;
    applicationDeadline?: Date;
  };
  opportunityAnalysis?: {
    gapType: OpportunityGapType;
    description: string;
    requiredAction: string;
    potentialBenefitAmount?: number;
    gapValue?: Record<string, unknown>;
  };
}

export interface EligibilitySnapshotWithDetails extends EligibilitySnapshot {
  results: EligibilityResult[];
  benefitAnalysis?: BenefitAnalysis | null;
  opportunityAnalysis?: OpportunityAnalysis | null;
}

export interface IEligibilitySnapshotRepository {
  findById(id: string): Promise<EligibilitySnapshotWithDetails | null>;
  findByUserId(userId: string): Promise<EligibilitySnapshotWithDetails[]>;
  findLatestByUserId(userId: string): Promise<EligibilitySnapshotWithDetails | null>;
  createSnapshot(data: CreateEligibilitySnapshotData): Promise<EligibilitySnapshotWithDetails>;
}
