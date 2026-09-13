import { Injectable, BadRequestException } from '@nestjs/common';
import { PolicyDerivedClassification } from '@gpios/shared';

export interface CreatePolicyDerivedClassificationParams {
  classificationCode: string;
  policyId: string;
  policyVersion: string;
  ruleId: string;
  ruleVersion: string;
  sourceFacts: Record<string, unknown>;
  isSatisfied: boolean;
  provenanceNote?: string;
  evaluatedAt?: string;
}

@Injectable()
export class PolicyDerivedClassificationService {
  // Set of known policy-derived labels that must NEVER be written as universal citizen facts
  private readonly reservedDerivedClassificationCodes: Set<string> = new Set([
    'SMALL_FARMER',
    'MARGINAL_FARMER',
    'LARGE_FARMER',
    'LANDLESS_LABOURER',
    'BELOW_POVERTY_LINE_BENEFICIARY',
    'PRIORITY_HOUSEHOLD',
    'ELIGIBLE_BENEFICIARY',
    'TARGET_GROUP_MEMBER',
    'VULNERABLE_CITIZEN',
    'SCHEME_ELIGIBLE',
  ]);

  /**
   * Create an immutable, auditable PolicyDerivedClassification projection.
   * This classification belongs strictly to the policy decision trace and NEVER to universal citizen facts.
   */
  createDerivedClassification(params: CreatePolicyDerivedClassificationParams): PolicyDerivedClassification {
    if (!params.classificationCode || !params.policyId || !params.policyVersion || !params.ruleId) {
      throw new BadRequestException(
        'Policy-derived classifications must be explicitly attributed to policyId, policyVersion, ruleId, and ruleVersion.',
      );
    }

    const classification: PolicyDerivedClassification = {
      classificationCode: params.classificationCode.trim().toUpperCase(),
      policyId: params.policyId,
      policyVersion: params.policyVersion,
      ruleId: params.ruleId,
      ruleVersion: params.ruleVersion,
      evaluatedAt: params.evaluatedAt || new Date().toISOString(),
      sourceFacts: Object.freeze({ ...params.sourceFacts }),
      isSatisfied: params.isSatisfied,
      provenanceNote:
        params.provenanceNote ||
        `Classification '${params.classificationCode}' derived conditionally under Policy ${params.policyId} (v${params.policyVersion}) Rule ${params.ruleId}. Not a universal citizen fact.`,
    };

    return Object.freeze(classification);
  }

  /**
   * Guard preventing policy-specific derived classifications from polluting universal CitizenFact storage.
   */
  assertNotPolicyDerivedClassification(attributeKey: string): void {
    const normalizedKey = attributeKey.trim().toUpperCase().replace(/[.-]/g, '_');
    if (this.reservedDerivedClassificationCodes.has(normalizedKey)) {
      throw new BadRequestException(
        `Architectural Violation: '${attributeKey}' is a policy-specific derived classification, not a universal citizen fact. It cannot be stored as a universal citizen attribute.`,
      );
    }
  }

  /**
   * Check if a code is a known policy-derived classification.
   */
  isPolicyDerivedClassification(code: string): boolean {
    const normalized = code.trim().toUpperCase().replace(/[.-]/g, '_');
    return this.reservedDerivedClassificationCodes.has(normalized);
  }
}
