import { Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_EVIDENCE_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IEvidenceRepository } from '../repositories/evidence.repository.interface';
import { EvidenceStatus } from '@gpios/shared';

@Injectable()
export class EvidenceVersionService {
  constructor(@Inject(DOCUMENT_EVIDENCE_REPOSITORY) private readonly evidenceRepo: IEvidenceRepository) {}

  async createNewVersion(evidenceId: string, newFactValue: unknown, status: EvidenceStatus) {
    const evidence = await this.evidenceRepo.findById(evidenceId);
    if (!evidence) return null;

    const nextVersionNumber = evidence.versions.length + 1;
    return this.evidenceRepo.createVersion(evidenceId, nextVersionNumber, evidence.factKey, newFactValue, status);
  }
}
