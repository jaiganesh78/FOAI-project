import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DOCUMENT_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IDocumentRepository } from '../repositories/document.repository.interface';
import { DocumentReplayResultDto } from '@gpios/shared';

@Injectable()
export class DocumentReplayService {
  constructor(@Inject(DOCUMENT_REPOSITORY) private readonly documentRepo: IDocumentRepository) {}

  async replayDocumentHistory(documentId: string): Promise<DocumentReplayResultDto> {
    const startTime = Date.now();
    const doc = await this.documentRepo.findById(documentId);
    if (!doc) {
      throw new NotFoundException(`Document '${documentId}' not found for replay.`);
    }

    return {
      documentId,
      snapshotId: `doc-replay-${documentId}`,
      isMatch: doc.versions.length >= 1,
      executionTimeMs: Date.now() - startTime,
    };
  }
}
