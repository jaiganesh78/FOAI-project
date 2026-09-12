import { Inject, Injectable } from '@nestjs/common';
import {
  DOCUMENT_REPOSITORY,
  DOCUMENT_EVIDENCE_REPOSITORY,
  VERIFICATION_REPOSITORY,
  CONFLICT_REPOSITORY,
} from '../../../core/tokens/injection-tokens';
import { IDocumentRepository } from '../repositories/document.repository.interface';
import { IEvidenceRepository } from '../repositories/evidence.repository.interface';
import { IVerificationRepository } from '../repositories/verification.repository.interface';
import { IConflictRepository } from '../repositories/conflict.repository.interface';

@Injectable()
export class DocumentQueryService {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documentRepo: IDocumentRepository,
    @Inject(DOCUMENT_EVIDENCE_REPOSITORY) private readonly evidenceRepo: IEvidenceRepository,
    @Inject(VERIFICATION_REPOSITORY) private readonly verificationRepo: IVerificationRepository,
    @Inject(CONFLICT_REPOSITORY) private readonly conflictRepo: IConflictRepository,
  ) {}

  async getDocumentById(id: string) {
    return this.documentRepo.findById(id);
  }

  async getDocumentsByUserId(userId: string) {
    return this.documentRepo.findByUserId(userId);
  }

  async getEvidencesByUserId(userId: string) {
    return this.evidenceRepo.findByUserId(userId);
  }

  async getVerificationByDocumentId(documentId: string) {
    return this.verificationRepo.findByDocumentId(documentId);
  }

  async getConflictsByUserId(userId: string) {
    return this.conflictRepo.findByUserId(userId);
  }
}
