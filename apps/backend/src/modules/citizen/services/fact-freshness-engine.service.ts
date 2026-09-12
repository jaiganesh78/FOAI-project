import { Inject, Injectable } from '@nestjs/common';
import { CITIZEN_KNOWLEDGE_PROFILE_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { ICitizenKnowledgeProfileRepository } from '../repositories/citizen-knowledge-profile.repository.interface';
import { FactFreshnessStatus, FactFreshnessDto } from '@gpios/shared';

@Injectable()
export class FactFreshnessEngineService {
  constructor(
    @Inject(CITIZEN_KNOWLEDGE_PROFILE_REPOSITORY) private readonly repo: ICitizenKnowledgeProfileRepository,
  ) {}

  async evaluateFreshness(attributeKey: string, factUpdatedAt: Date): Promise<FactFreshnessDto> {
    const policy = await this.repo.getFreshnessPolicy(attributeKey);
    const durationDays = policy ? policy.expiryDurationDays : 365;
    const warningDays = policy ? policy.warningWindowDays : 30;
    const policyVersion = policy ? policy.version : 1;

    const expiryDate = new Date(factUpdatedAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const warningDate = new Date(expiryDate.getTime() - warningDays * 24 * 60 * 60 * 1000);
    const now = new Date();

    let freshnessStatus = FactFreshnessStatus.FRESH;
    if (now >= expiryDate) {
      freshnessStatus = FactFreshnessStatus.STALE;
    } else if (now >= warningDate) {
      freshnessStatus = FactFreshnessStatus.EXPIRING_SOON;
    }

    return {
      attributeKey,
      freshnessStatus,
      expiryDate: expiryDate.toISOString(),
      policyVersion,
      evaluatedAt: now.toISOString(),
    };
  }
}
