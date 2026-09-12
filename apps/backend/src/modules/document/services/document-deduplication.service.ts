import { Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IDocumentRepository } from '../repositories/document.repository.interface';
import { createHash } from 'crypto';

@Injectable()
export class DocumentDeduplicationService {
  constructor(@Inject(DOCUMENT_REPOSITORY) private readonly documentRepo: IDocumentRepository) {}

  computeChecksum(content: Buffer): string {
    return createHash('sha256').update(content).digest('hex');
  }

  async checkDuplicate(checksumSha256: string) {
    const existingChecksum = await this.documentRepo.getChecksumRecord(checksumSha256);
    if (!existingChecksum) return null;
    return this.documentRepo.findById(existingChecksum.documentId);
  }

  async createAlias(originalDocumentId: string, aliasDocumentId: string, checksumSha256: string) {
    return this.documentRepo.createAlias(originalDocumentId, aliasDocumentId, checksumSha256);
  }
}
