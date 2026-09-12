import { Inject, Injectable } from '@nestjs/common';
import {
  CITIZEN_KNOWLEDGE_PROFILE_REPOSITORY,
  FACT_FRESHNESS_ENGINE_SERVICE,
  PROFILE_COMPLETENESS_ENGINE_SERVICE,
} from '../../../core/tokens/injection-tokens';
import { ICitizenKnowledgeProfileRepository } from '../repositories/citizen-knowledge-profile.repository.interface';
import { FactFreshnessEngineService } from './fact-freshness-engine.service';
import { ProfileCompletenessEngineService } from './profile-completeness-engine.service';
import { CitizenFactDto, ProfileCompletenessBreakdownDto, FactSourcePrecedence } from '@gpios/shared';

@Injectable()
export class CitizenKnowledgeProfileService {
  constructor(
    @Inject(CITIZEN_KNOWLEDGE_PROFILE_REPOSITORY) private readonly repo: ICitizenKnowledgeProfileRepository,
    @Inject(FACT_FRESHNESS_ENGINE_SERVICE) private readonly freshnessEngine: FactFreshnessEngineService,
    @Inject(PROFILE_COMPLETENESS_ENGINE_SERVICE) private readonly completenessEngine: ProfileCompletenessEngineService,
  ) {}

  async getProfileFacts(userId: string): Promise<CitizenFactDto[]> {
    const facts = await this.repo.findProfileFacts(userId);
    const result: CitizenFactDto[] = [];

    for (const f of facts) {
      const freshness = await this.freshnessEngine.evaluateFreshness(f.attributeKey, f.updatedAt);
      const val = f.valueBoolean ?? f.valueNumber ?? f.valueDate ?? f.valueText ?? f.valueJson;

      result.push({
        id: f.id,
        profileId: f.profileId,
        attributeKey: f.attributeKey,
        value: val,
        normalizedValue: f.normalizedValue,
        source: f.source,
        sourcePrecedence: f.sourcePrecedence as FactSourcePrecedence,
        confidence: f.confidence,
        verificationStatus: f.verificationStatus,
        evidenceId: f.evidenceId || undefined,
        freshnessStatus: freshness.freshnessStatus,
        freshnessExpiryDate: freshness.expiryDate,
        freshnessPolicyVersion: freshness.policyVersion,
        version: f.version,
        effectiveFrom: f.effectiveFrom.toISOString(),
        effectiveTo: f.effectiveTo ? f.effectiveTo.toISOString() : undefined,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      });
    }

    return result;
  }

  async getCompletenessBreakdown(userId: string): Promise<ProfileCompletenessBreakdownDto> {
    const facts = await this.repo.findProfileFacts(userId);
    const knownKeys = facts.map((f) => f.attributeKey);
    return this.completenessEngine.calculateCompleteness(knownKeys);
  }
}
