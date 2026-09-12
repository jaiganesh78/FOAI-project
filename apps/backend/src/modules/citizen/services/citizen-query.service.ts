import { Inject, Injectable } from '@nestjs/common';
import { CITIZEN_PROFILE_REPOSITORY, CITIZEN_FACT_REPOSITORY, COMPLETENESS_ENGINE } from '../../../core/tokens/injection-tokens';
import { ICitizenProfileRepository } from '../repositories/citizen-profile.repository.interface';
import { ICitizenFactRepository } from '../repositories/citizen-fact.repository.interface';
import { CitizenCompletenessEngine } from './citizen-completeness.engine';
import { ProfileCompletenessResponseDto } from '@gpios/shared';

export interface ICitizenQueryService {
  getStructuredFactsByUserId(userId: string): Promise<Record<string, unknown>>;
  getFactValue<T = unknown>(userId: string, attributeKey: string): Promise<T | null>;
  getCategoryFacts(userId: string, category: string): Promise<Record<string, unknown>>;
  getCompletenessSummary(userId: string): Promise<ProfileCompletenessResponseDto | null>;
}

@Injectable()
export class CitizenQueryService implements ICitizenQueryService {
  constructor(
    @Inject(CITIZEN_PROFILE_REPOSITORY) private readonly profileRepository: ICitizenProfileRepository,
    @Inject(CITIZEN_FACT_REPOSITORY) private readonly factRepository: ICitizenFactRepository,
    @Inject(COMPLETENESS_ENGINE) private readonly completenessEngine: CitizenCompletenessEngine,
  ) {}

  async getStructuredFactsByUserId(userId: string): Promise<Record<string, unknown>> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) return {};

    const activeFacts = await this.factRepository.findActiveByProfileId(profile.id);
    const result: Record<string, unknown> = {};

    for (const fact of activeFacts) {
      const val = fact.valueBoolean ?? fact.valueNumber ?? fact.valueDate ?? fact.valueText ?? fact.valueJson;
      result[fact.attributeKey] = val;
    }

    return result;
  }

  async getFactValue<T = unknown>(userId: string, attributeKey: string): Promise<T | null> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) return null;

    const fact = await this.factRepository.findByProfileAndKey(profile.id, attributeKey);
    if (!fact) return null;

    const val = fact.valueBoolean ?? fact.valueNumber ?? fact.valueDate ?? fact.valueText ?? fact.valueJson;
    return val as T;
  }

  async getCategoryFacts(userId: string, category: string): Promise<Record<string, unknown>> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) return {};

    const activeFacts = await this.factRepository.findActiveByProfileId(profile.id);
    const result: Record<string, unknown> = {};

    for (const fact of activeFacts) {
      if (fact.attribute.category.toUpperCase() === category.toUpperCase()) {
        const val = fact.valueBoolean ?? fact.valueNumber ?? fact.valueDate ?? fact.valueText ?? fact.valueJson;
        result[fact.attributeKey] = val;
      }
    }

    return result;
  }

  async getCompletenessSummary(userId: string): Promise<ProfileCompletenessResponseDto | null> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) return null;

    const activeFacts = await this.factRepository.findActiveByProfileId(profile.id);
    const { completenessDto } = await this.completenessEngine.calculateCompleteness(profile.id, activeFacts);

    return completenessDto;
  }
}
