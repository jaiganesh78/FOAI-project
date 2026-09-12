import { Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_EVIDENCE_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IEvidenceRepository } from '../repositories/evidence.repository.interface';
import { EvidenceStatus } from '@gpios/shared';

@Injectable()
export class EvidenceGenerationService {
  constructor(@Inject(DOCUMENT_EVIDENCE_REPOSITORY) private readonly evidenceRepo: IEvidenceRepository) {}

  async generateEvidenceForFacts(params: {
    documentId: string;
    userId: string;
    extractedFacts: Array<{ factKey: string; extractedValue: unknown }>;
  }) {
    const createdEvidences = [];

    for (const fact of params.extractedFacts) {
      const evidence = await this.evidenceRepo.createEvidence({
        documentId: params.documentId,
        userId: params.userId,
        factKey: fact.factKey,
        factValue: fact.extractedValue,
        status: EvidenceStatus.UNVERIFIED,
      });

      await this.evidenceRepo.createVersion(evidence.id, 1, fact.factKey, fact.extractedValue, EvidenceStatus.UNVERIFIED);
      createdEvidences.push(evidence);
    }

    return createdEvidences;
  }
}
