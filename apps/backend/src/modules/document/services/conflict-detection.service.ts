import { Inject, Injectable } from '@nestjs/common';
import { CONFLICT_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IConflictRepository } from '../repositories/conflict.repository.interface';

@Injectable()
export class ConflictDetectionService {
  constructor(@Inject(CONFLICT_REPOSITORY) private readonly conflictRepo: IConflictRepository) {}

  async detectAndRecordConflicts(params: {
    documentId: string;
    userId: string;
    citizenFacts: Record<string, unknown>;
    extractedFacts: Array<{ factKey: string; extractedValue: unknown }>;
  }) {
    const detectedConflicts = [];

    for (const extracted of params.extractedFacts) {
      const declared = params.citizenFacts[extracted.factKey];
      if (declared !== undefined && declared !== null && String(declared) !== String(extracted.extractedValue)) {
        const conflict = await this.conflictRepo.createConflict({
          documentId: params.documentId,
          userId: params.userId,
          factKey: extracted.factKey,
          declaredValue: declared,
          extractedValue: extracted.extractedValue,
        });
        detectedConflicts.push(conflict);
      }
    }

    return detectedConflicts;
  }
}
