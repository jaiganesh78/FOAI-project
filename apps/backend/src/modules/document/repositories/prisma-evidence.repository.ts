import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IEvidenceRepository, EvidenceWithDetails } from './evidence.repository.interface';
import { EvidenceVersion, EvidenceTrustScore, EvidenceGraph, Prisma } from '@prisma/client';
import { EvidenceStatus } from '@gpios/shared';

@Injectable()
export class PrismaEvidenceRepository implements IEvidenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createEvidence(data: {
    documentId: string;
    userId: string;
    factKey: string;
    factValue: unknown;
    status: EvidenceStatus;
  }): Promise<EvidenceWithDetails> {
    return this.prisma.evidence.create({
      data: {
        documentId: data.documentId,
        userId: data.userId,
        factKey: data.factKey,
        factValue: data.factValue as Prisma.InputJsonValue,
        status: data.status,
      },
      include: {
        versions: true,
        trustScore: true,
        graphs: true,
      },
    }) as unknown as EvidenceWithDetails;
  }

  async findById(id: string): Promise<EvidenceWithDetails | null> {
    return this.prisma.evidence.findUnique({
      where: { id },
      include: {
        versions: true,
        trustScore: true,
        graphs: true,
      },
    }) as unknown as EvidenceWithDetails | null;
  }

  async findByDocumentId(documentId: string): Promise<EvidenceWithDetails[]> {
    return this.prisma.evidence.findMany({
      where: { documentId },
      include: {
        versions: true,
        trustScore: true,
        graphs: true,
      },
    }) as unknown as EvidenceWithDetails[];
  }

  async findByUserId(userId: string): Promise<EvidenceWithDetails[]> {
    return this.prisma.evidence.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        versions: true,
        trustScore: true,
        graphs: true,
      },
    }) as unknown as EvidenceWithDetails[];
  }

  async updateStatus(id: string, status: EvidenceStatus): Promise<EvidenceWithDetails> {
    return this.prisma.evidence.update({
      where: { id },
      data: { status },
      include: {
        versions: true,
        trustScore: true,
        graphs: true,
      },
    }) as unknown as EvidenceWithDetails;
  }

  async createVersion(evidenceId: string, version: number, factKey: string, factValue: unknown, status: EvidenceStatus): Promise<EvidenceVersion> {
    return this.prisma.evidenceVersion.create({
      data: {
        evidenceId,
        version,
        factKey,
        factValue: factValue as Prisma.InputJsonValue,
        status,
      },
    });
  }

  async saveTrustScore(evidenceId: string, data: Record<string, unknown>): Promise<EvidenceTrustScore> {
    return this.prisma.evidenceTrustScore.upsert({
      where: { evidenceId },
      update: {
        trustScore: (data.trustScore as number) ?? 100.0,
        documentAgeDays: (data.documentAgeDays as number) ?? 0,
        verificationMethodWeight: (data.verificationMethodWeight as number) ?? 1.0,
        governmentSourceWeight: (data.governmentSourceWeight as number) ?? 1.0,
        manualVerificationBonus: (data.manualVerificationBonus as number) ?? 0.0,
        ocrQualityScore: (data.ocrQualityScore as number) ?? 100.0,
        documentQualityScore: (data.documentQualityScore as number) ?? 100.0,
        extractionConfidence: (data.extractionConfidence as number) ?? 100.0,
        conflictHistoryPenalty: (data.conflictHistoryPenalty as number) ?? 0.0,
        confidenceLevel: (data.confidenceLevel as any) || 'HIGH',
      },
      create: {
        evidenceId,
        trustScore: (data.trustScore as number) ?? 100.0,
        documentAgeDays: (data.documentAgeDays as number) ?? 0,
        verificationMethodWeight: (data.verificationMethodWeight as number) ?? 1.0,
        governmentSourceWeight: (data.governmentSourceWeight as number) ?? 1.0,
        manualVerificationBonus: (data.manualVerificationBonus as number) ?? 0.0,
        ocrQualityScore: (data.ocrQualityScore as number) ?? 100.0,
        documentQualityScore: (data.documentQualityScore as number) ?? 100.0,
        extractionConfidence: (data.extractionConfidence as number) ?? 100.0,
        conflictHistoryPenalty: (data.conflictHistoryPenalty as number) ?? 0.0,
        confidenceLevel: (data.confidenceLevel as any) || 'HIGH',
      },
    });
  }

  async saveGraph(evidenceId: string, data: Record<string, unknown>): Promise<EvidenceGraph> {
    return this.prisma.evidenceGraph.create({
      data: {
        evidenceId,
        factKey: data.factKey as string,
        documentId: data.documentId as string,
        ocrBlockId: data.ocrBlockId as string,
        originalFileName: data.originalFileName as string,
        provenanceChain: (data.provenanceChain as Prisma.InputJsonValue) || [],
      },
    });
  }
}
