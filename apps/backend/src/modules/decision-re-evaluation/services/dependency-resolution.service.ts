import { Injectable, BadRequestException } from '@nestjs/common';
import { ReEvaluationTarget, DependencyFingerprintDto } from '@gpios/shared';
import { createHash } from 'crypto';

@Injectable()
export class DependencyResolutionService {
  private readonly maxPropagationDepth = 5;

  computeDependencyFingerprint(params: {
    factVersions: Record<string, number>;
    policyVersions: Record<string, number>;
    eligibilitySnapshotVersion?: number;
    recommendationSnapshotVersion?: number;
    journeyVersion?: number;
    configurationVersion?: number;
  }): DependencyFingerprintDto {
    const configVer = params.configurationVersion || 1;
    const payload = {
      factVersions: params.factVersions,
      policyVersions: params.policyVersions,
      eligibilitySnapshotVersion: params.eligibilitySnapshotVersion || 0,
      recommendationSnapshotVersion: params.recommendationSnapshotVersion || 0,
      journeyVersion: params.journeyVersion || 0,
      configurationVersion: configVer,
    };

    const fingerprintSha256 = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

    return {
      factVersions: params.factVersions,
      policyVersions: params.policyVersions,
      eligibilitySnapshotVersion: params.eligibilitySnapshotVersion,
      recommendationSnapshotVersion: params.recommendationSnapshotVersion,
      journeyVersion: params.journeyVersion,
      configurationVersion: configVer,
      fingerprintSha256,
    };
  }

  validatePropagationDepth(depth: number): void {
    if (depth > this.maxPropagationDepth) {
      throw new BadRequestException(
        `Cascade Depth Safeguard Rejection: Propagation depth ${depth} exceeds maximum limit of ${this.maxPropagationDepth}. Evaluation terminated to prevent loops.`,
      );
    }
  }

  getDownstreamTargets(triggerType: string, attributeKey?: string): ReEvaluationTarget[] {
    const targets: ReEvaluationTarget[] = [];

    if (triggerType === 'FACT_CHANGED' || triggerType === 'FACT_VERIFIED') {
      if (!attributeKey || ['annualIncome', 'isLandOwner', 'residenceState', 'casteCategory'].includes(attributeKey)) {
        targets.push(ReEvaluationTarget.ELIGIBILITY, ReEvaluationTarget.RECOMMENDATION, ReEvaluationTarget.JOURNEY);
      } else if (['bankAccountNumber', 'aadhaarNumber'].includes(attributeKey)) {
        targets.push(ReEvaluationTarget.JOURNEY);
      }
    } else if (triggerType === 'POLICY_CHANGED') {
      targets.push(ReEvaluationTarget.ELIGIBILITY, ReEvaluationTarget.RECOMMENDATION, ReEvaluationTarget.JOURNEY);
    }

    return targets;
  }
}
