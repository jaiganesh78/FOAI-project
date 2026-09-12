import { PolicyChunk, PolicyChunkMetadata } from '@prisma/client';

export interface CreatePolicyChunkData {
  documentId: string;
  versionId: string;
  stableChunkId: string;
  chunkIndex: number;
  sectionTitle?: string;
  pageNumber?: number;
  paragraphIndex?: number;
  content: string;
  checksum: string;
  metadata?: {
    ministry?: string;
    department?: string;
    schemeName?: string;
    state?: string;
    district?: string;
    beneficiaryCategory?: string;
    normalizedAmount?: number;
    extractionConfidence?: number;
    extractionMethod?: string;
    extractedBy?: string;
    sourceLocation?: string;
  };
}

export interface PolicyChunkWithMetadata extends PolicyChunk {
  metadata?: PolicyChunkMetadata | null;
}

export interface IPolicyChunkRepository {
  findById(id: string): Promise<PolicyChunkWithMetadata | null>;
  findByVersionId(versionId: string): Promise<PolicyChunkWithMetadata[]>;
  findByStableChunkId(stableChunkId: string): Promise<PolicyChunkWithMetadata | null>;
  findAll(): Promise<PolicyChunkWithMetadata[]>;
  createChunk(data: CreatePolicyChunkData): Promise<PolicyChunkWithMetadata>;
  countTotalChunks(): Promise<number>;
}
