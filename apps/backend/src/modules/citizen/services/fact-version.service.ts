import { Inject, Injectable } from '@nestjs/common';
import { CITIZEN_KNOWLEDGE_PROFILE_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { ICitizenKnowledgeProfileRepository } from '../repositories/citizen-knowledge-profile.repository.interface';
import { CitizenFactVersionDto } from '@gpios/shared';

@Injectable()
export class FactVersionService {
  constructor(
    @Inject(CITIZEN_KNOWLEDGE_PROFILE_REPOSITORY) private readonly repo: ICitizenKnowledgeProfileRepository,
  ) {}

  async createVersion(factId: string, params: {
    version: number;
    previousValue: unknown;
    newValue: unknown;
    source: string;
    sourcePrecedence: number;
    provenance?: unknown;
    verificationStatus: string;
    freshnessPolicyVersion: number;
    effectiveFrom: Date;
    effectiveTo?: Date;
    changeReason?: string;
    changedBy: string;
    correlationId?: string;
  }) {
    return this.repo.createFactVersion(factId, params);
  }

  async getHistory(factId: string): Promise<CitizenFactVersionDto[]> {
    const versions = await this.repo.getFactVersionsHistory(factId);
    return versions.map((v) => ({
      id: v.id,
      factId: v.factId,
      version: v.version,
      previousValue: v.previousValue,
      newValue: v.newValue,
      source: v.source,
      provenance: (v.provenance as any) || {},
      verificationStatus: v.verificationStatus,
      freshnessPolicyVersion: v.freshnessPolicyVersion,
      changeReason: v.changeReason || undefined,
      changedBy: v.changedBy,
      correlationId: v.correlationId || undefined,
      createdAt: v.createdAt.toISOString(),
    }));
  }
}
