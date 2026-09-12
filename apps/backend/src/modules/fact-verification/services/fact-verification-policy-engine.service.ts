import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { FACT_VERIFICATION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IFactVerificationRepository } from '../repositories/fact-verification.repository.interface';
import { FactVerificationPolicyDto } from '@gpios/shared';
import { createHash } from 'crypto';

@Injectable()
export class FactVerificationPolicyEngineService {
  constructor(
    @Inject(FACT_VERIFICATION_REPOSITORY) private readonly repo: IFactVerificationRepository,
  ) {}

  computePolicyChecksum(policyPayload: Record<string, unknown>): string {
    return createHash('sha256').update(JSON.stringify(policyPayload)).digest('hex');
  }

  async getActivePolicy(attributeKey: string): Promise<FactVerificationPolicyDto> {
    let policy = await this.repo.findActivePolicy(attributeKey);
    if (!policy) {
      const defaultPayload = {
        attributeKey,
        acceptableSources: ['GOVERNMENT_VERIFIED', 'MANUAL_OFFICER_VERIFIED', 'DOCUMENT_DERIVED'],
        minimumTrustScore: 70.0,
        freshnessExpiryDurationDays: 365,
        requireManualReviewForGovernmentExpired: true,
        requireManualReviewForConflicts: true,
      };
      const checksumSha256 = this.computePolicyChecksum(defaultPayload);
      return {
        policyId: 'default-policy-v1',
        attributeKey,
        version: 1,
        acceptableSources: defaultPayload.acceptableSources,
        minimumTrustScore: 70.0,
        freshnessExpiryDurationDays: 365,
        requireManualReviewForGovernmentExpired: true,
        requireManualReviewForConflicts: true,
        checksumSha256,
        isActive: true,
      };
    }

    const sources = (policy.acceptableSources as string[]) || [];
    return {
      policyId: policy.id,
      attributeKey: policy.attributeKey,
      version: policy.version,
      acceptableSources: sources,
      minimumTrustScore: policy.minimumTrustScore,
      freshnessExpiryDurationDays: policy.freshnessExpiryDurationDays,
      requireManualReviewForGovernmentExpired: policy.requireManualReviewForGovernmentExpired,
      requireManualReviewForConflicts: policy.requireManualReviewForConflicts,
      checksumSha256: policy.checksumSha256,
      isActive: policy.isActive,
    };
  }

  async getPolicyByVersion(attributeKey: string, version: number): Promise<FactVerificationPolicyDto> {
    const policy = await this.repo.findPolicyByVersion(attributeKey, version);
    if (!policy) {
      throw new BadRequestException(`Verification Policy for '${attributeKey}' version ${version} not found.`);
    }

    const sources = (policy.acceptableSources as string[]) || [];
    return {
      policyId: policy.id,
      attributeKey: policy.attributeKey,
      version: policy.version,
      acceptableSources: sources,
      minimumTrustScore: policy.minimumTrustScore,
      freshnessExpiryDurationDays: policy.freshnessExpiryDurationDays,
      requireManualReviewForGovernmentExpired: policy.requireManualReviewForGovernmentExpired,
      requireManualReviewForConflicts: policy.requireManualReviewForConflicts,
      checksumSha256: policy.checksumSha256,
      isActive: policy.isActive,
    };
  }
}
