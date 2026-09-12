import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IPolicyChunkRepository, CreatePolicyChunkData, PolicyChunkWithMetadata } from './policy-chunk.repository.interface';

@Injectable()
export class PrismaPolicyChunkRepository implements IPolicyChunkRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PolicyChunkWithMetadata | null> {
    return this.prisma.policyChunk.findUnique({
      where: { id },
      include: { metadata: true, embeddingPrep: true },
    });
  }

  async findByVersionId(versionId: string): Promise<PolicyChunkWithMetadata[]> {
    return this.prisma.policyChunk.findMany({
      where: { versionId },
      include: { metadata: true, embeddingPrep: true },
      orderBy: { chunkIndex: 'asc' },
    });
  }

  async findByStableChunkId(stableChunkId: string): Promise<PolicyChunkWithMetadata | null> {
    return this.prisma.policyChunk.findFirst({
      where: { stableChunkId },
      include: { metadata: true, embeddingPrep: true },
    });
  }

  async findAll(): Promise<PolicyChunkWithMetadata[]> {
    return this.prisma.policyChunk.findMany({
      include: { metadata: true, embeddingPrep: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createChunk(data: CreatePolicyChunkData): Promise<PolicyChunkWithMetadata> {
    return this.prisma.policyChunk.create({
      data: {
        documentId: data.documentId,
        versionId: data.versionId,
        stableChunkId: data.stableChunkId,
        chunkIndex: data.chunkIndex,
        sectionTitle: data.sectionTitle,
        pageNumber: data.pageNumber,
        paragraphIndex: data.paragraphIndex,
        content: data.content,
        checksum: data.checksum,
        metadata: data.metadata
          ? {
              create: {
                ministry: data.metadata.ministry,
                department: data.metadata.department,
                schemeName: data.metadata.schemeName,
                state: data.metadata.state,
                district: data.metadata.district,
                beneficiaryCategory: data.metadata.beneficiaryCategory,
                normalizedAmount: data.metadata.normalizedAmount,
                extractionConfidence: data.metadata.extractionConfidence || 1.0,
                extractionMethod: data.metadata.extractionMethod || 'DETERMINISTIC',
                extractedBy: data.metadata.extractedBy || 'SYSTEM',
                sourceLocation: data.metadata.sourceLocation,
              },
            }
          : undefined,
        embeddingPrep: {
          create: {
            checksum: data.checksum,
          },
        },
      },
      include: { metadata: true, embeddingPrep: true },
    });
  }

  async countTotalChunks(): Promise<number> {
    return this.prisma.policyChunk.count();
  }
}
