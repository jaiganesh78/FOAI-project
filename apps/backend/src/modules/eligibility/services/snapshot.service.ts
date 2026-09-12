import { Inject, Injectable } from '@nestjs/common';
import { ELIGIBILITY_SNAPSHOT_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IEligibilitySnapshotRepository, EligibilitySnapshotWithDetails } from '../repositories/eligibility-snapshot.repository.interface';
import { EligibilityStatus, OpportunityGapType } from '@gpios/shared';

@Injectable()
export class SnapshotService {
  constructor(@Inject(ELIGIBILITY_SNAPSHOT_REPOSITORY) private readonly snapshotRepository: IEligibilitySnapshotRepository) {}

  async createEligibilitySnapshot(params: {
    userId: string;
    citizenSnapshotId: string;
    policyVersionId: string;
    decisionTraceId: string;
    status: EligibilityStatus;
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
  }): Promise<EligibilitySnapshotWithDetails> {
    return this.snapshotRepository.createSnapshot({
      userId: params.userId,
      citizenSnapshotId: params.citizenSnapshotId,
      policyVersionId: params.policyVersionId,
      decisionTraceId: params.decisionTraceId,
      status: params.status,
      resultSummary: { eligibleCount: params.results.filter((r) => r.status === EligibilityStatus.ELIGIBLE).length },
      results: params.results,
      benefitAnalysis: params.benefitAnalysis,
      opportunityAnalysis: params.opportunityAnalysis,
    });
  }

  async getSnapshotById(id: string): Promise<EligibilitySnapshotWithDetails | null> {
    return this.snapshotRepository.findById(id);
  }

  async getSnapshotsByUserId(userId: string): Promise<EligibilitySnapshotWithDetails[]> {
    return this.snapshotRepository.findByUserId(userId);
  }
}
