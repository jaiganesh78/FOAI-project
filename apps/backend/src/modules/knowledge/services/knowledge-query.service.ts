import { Inject, Injectable } from '@nestjs/common';
import {
  POLICY_DOCUMENT_REPOSITORY,
  POLICY_VERSION_REPOSITORY,
  POLICY_CHUNK_REPOSITORY,
} from '../../../core/tokens/injection-tokens';
import { IPolicyDocumentRepository } from '../repositories/policy-document.repository.interface';
import { IPolicyVersionRepository } from '../repositories/policy-version.repository.interface';
import { IPolicyChunkRepository, PolicyChunkWithMetadata } from '../repositories/policy-chunk.repository.interface';
import { PolicyDocument, PolicyVersion, PolicyLifecycleStatus } from '@prisma/client';

export interface IKnowledgeQueryService {
  getActivePolicies(): Promise<PolicyDocument[]>;
  getDocumentById(id: string): Promise<PolicyDocument | null>;
  getDocumentVersions(documentId: string): Promise<PolicyVersion[]>;
  getAllChunks(): Promise<PolicyChunkWithMetadata[]>;
  getChunksByVersionId(versionId: string): Promise<PolicyChunkWithMetadata[]>;
}

@Injectable()
export class KnowledgeQueryService implements IKnowledgeQueryService {
  constructor(
    @Inject(POLICY_DOCUMENT_REPOSITORY) private readonly documentRepository: IPolicyDocumentRepository,
    @Inject(POLICY_VERSION_REPOSITORY) private readonly versionRepository: IPolicyVersionRepository,
    @Inject(POLICY_CHUNK_REPOSITORY) private readonly chunkRepository: IPolicyChunkRepository,
  ) {}

  async getActivePolicies(): Promise<PolicyDocument[]> {
    return this.documentRepository.findByStatus(PolicyLifecycleStatus.ACTIVE);
  }

  async getDocumentById(id: string): Promise<PolicyDocument | null> {
    return this.documentRepository.findById(id);
  }

  async getDocumentVersions(documentId: string): Promise<PolicyVersion[]> {
    return this.versionRepository.findByDocumentId(documentId);
  }

  async getAllChunks(): Promise<PolicyChunkWithMetadata[]> {
    return this.chunkRepository.findAll();
  }

  async getChunksByVersionId(versionId: string): Promise<PolicyChunkWithMetadata[]> {
    return this.chunkRepository.findByVersionId(versionId);
  }
}
