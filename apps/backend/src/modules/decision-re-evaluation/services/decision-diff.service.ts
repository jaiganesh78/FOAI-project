import { Injectable } from '@nestjs/common';
import { DecisionChangeType, ReEvaluationTarget } from '@gpios/shared';
import { createHash } from 'crypto';

@Injectable()
export class DecisionDiffService {
  private readonly materialityRuleVersion = 1;
  private readonly materialityConfig = {
    eligibilityStatusChangeIsMaterial: true,
    recommendationRankChangeIsMaterial: true,
    journeyReadinessChangeIsMaterial: true,
    scoreThresholdDelta: 0.1,
  };

  getMaterialityChecksum(): string {
    return createHash('sha256').update(JSON.stringify(this.materialityConfig)).digest('hex');
  }

  computeDiff(params: {
    reEvaluationId: string;
    userId: string;
    targetType: ReEvaluationTarget;
    targetEntityId: string;
    previousState: Record<string, unknown> | null;
    newState: Record<string, unknown>;
    dependencyFingerprintSha256: string;
  }): {
    changeType: DecisionChangeType;
    changedFields: Record<string, unknown>;
    isMaterial: boolean;
    materialityReason: string;
    materialityRuleVersion: number;
    materialityConfigurationChecksumSha256: string;
    checksumSha256: string;
  } {
    const prev = params.previousState || {};
    const curr = params.newState || {};

    const changedFields: Record<string, unknown> = {};
    let changeType = DecisionChangeType.NO_CHANGE;
    let isMaterial = false;
    let materialityReason = 'No material changes detected in decision state.';

    if (params.targetType === ReEvaluationTarget.ELIGIBILITY) {
      const prevStatus = prev['status'] || 'UNKNOWN';
      const currStatus = curr['status'] || 'UNKNOWN';
      if (prevStatus !== currStatus) {
        changeType = DecisionChangeType.ELIGIBILITY_CHANGED;
        changedFields['status'] = { from: prevStatus, to: currStatus };
        isMaterial = true;
        materialityReason = `Eligibility status changed from '${prevStatus}' to '${currStatus}'.`;
      }
    } else if (params.targetType === ReEvaluationTarget.RECOMMENDATION) {
      const prevRecs = (prev['items'] as Array<{ id: string; rank: number }>) || [];
      const currRecs = (curr['items'] as Array<{ id: string; rank: number }>) || [];
      if (prevRecs.length !== currRecs.length || JSON.stringify(prevRecs) !== JSON.stringify(currRecs)) {
        changeType = DecisionChangeType.RECOMMENDATION_CHANGED;
        changedFields['recommendationPortfolio'] = { fromCount: prevRecs.length, toCount: currRecs.length };
        isMaterial = true;
        materialityReason = 'Recommendation portfolio items or rankings changed.';
      }
    } else if (params.targetType === ReEvaluationTarget.JOURNEY) {
      const prevReadiness = prev['readinessScore'] || 0;
      const currReadiness = curr['readinessScore'] || 0;
      if (prevReadiness !== currReadiness) {
        changeType = DecisionChangeType.READINESS_CHANGED;
        changedFields['readinessScore'] = { from: prevReadiness, to: currReadiness };
        isMaterial = true;
        materialityReason = `Journey application readiness changed from ${prevReadiness} to ${currReadiness}.`;
      }
    }

    const diffPayload = {
      targetType: params.targetType,
      changeType,
      changedFields,
      isMaterial,
      materialityRuleVersion: this.materialityRuleVersion,
    };
    const checksumSha256 = createHash('sha256').update(JSON.stringify(diffPayload)).digest('hex');

    return {
      changeType,
      changedFields,
      isMaterial,
      materialityReason,
      materialityRuleVersion: this.materialityRuleVersion,
      materialityConfigurationChecksumSha256: this.getMaterialityChecksum(),
      checksumSha256,
    };
  }
}
