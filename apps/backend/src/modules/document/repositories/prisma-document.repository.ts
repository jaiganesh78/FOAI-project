import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  IDocumentRepository,
  DocumentWithDetails,
  CreateDocumentData,
} from './document.repository.interface';
import {
  DocumentVersion,
  DocumentAlias,
  DocumentIntelligenceClassification,
  DocumentQuality,
  DocumentChecksum,
  DocumentExpiry,
  Prisma,
} from '@prisma/client';
import { DocumentStatus } from '@gpios/shared';

@Injectable()
export class PrismaDocumentRepository implements IDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createDocument(data: CreateDocumentData): Promise<DocumentWithDetails> {
    const doc = await this.prisma.document.create({
      data: {
        userId: data.userId,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        storageUrl: data.storageUrl,
        checksumSha256: data.checksumSha256,
        documentType: data.documentType,
        source: data.source,
        status: DocumentStatus.UPLOADED,
      },
      include: {
        versions: true,
        classification: true,
        quality: true,
      },
    });

    await this.prisma.documentChecksum.create({
      data: {
        documentId: doc.id,
        checksumSha256: data.checksumSha256,
        fileSize: data.fileSize,
      },
    });

    return doc as unknown as DocumentWithDetails;
  }

  async findById(id: string): Promise<DocumentWithDetails | null> {
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        versions: true,
        classification: true,
        quality: true,
      },
    }) as unknown as DocumentWithDetails | null;
  }

  async findByUserId(userId: string): Promise<DocumentWithDetails[]> {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        versions: true,
        classification: true,
        quality: true,
      },
    }) as unknown as DocumentWithDetails[];
  }

  async findByChecksum(checksumSha256: string): Promise<DocumentWithDetails | null> {
    return this.prisma.document.findFirst({
      where: { checksumSha256 },
      include: {
        versions: true,
        classification: true,
        quality: true,
      },
    }) as unknown as DocumentWithDetails | null;
  }

  async updateStatus(id: string, status: DocumentStatus): Promise<DocumentWithDetails> {
    return this.prisma.document.update({
      where: { id },
      data: { status },
      include: {
        versions: true,
        classification: true,
        quality: true,
      },
    }) as unknown as DocumentWithDetails;
  }

  async updateTrustScore(id: string, trustScore: number): Promise<void> {
    await this.prisma.document.update({
      where: { id },
      data: { trustScore },
    });
  }

  async createVersion(documentId: string, version: number, data: CreateDocumentData): Promise<DocumentVersion> {
    return this.prisma.documentVersion.create({
      data: {
        documentId,
        version,
        fileName: data.fileName,
        fileSize: data.fileSize,
        storageUrl: data.storageUrl,
        checksumSha256: data.checksumSha256,
      },
    });
  }

  async createAlias(originalDocumentId: string, aliasDocumentId: string, checksumSha256: string): Promise<DocumentAlias> {
    return this.prisma.documentAlias.create({
      data: {
        originalDocumentId,
        aliasDocumentId,
        checksumSha256,
      },
    });
  }

  async saveClassification(documentId: string, data: Record<string, unknown>): Promise<DocumentIntelligenceClassification> {
    return this.prisma.documentIntelligenceClassification.upsert({
      where: { documentId },
      update: {
        documentCategory: (data.documentCategory as any) || 'OTHER',
        detectedLanguage: (data.detectedLanguage as string) || 'en',
        pageOrientation: (data.pageOrientation as string) || 'PORTRAIT',
        layoutType: (data.layoutType as string) || 'SINGLE_PAGE',
        ocrTemplateId: data.ocrTemplateId as string,
        isOcrRequired: (data.isOcrRequired as boolean) ?? true,
        isEncrypted: (data.isEncrypted as boolean) ?? false,
        isSupported: (data.isSupported as boolean) ?? true,
        classificationConfidence: (data.classificationConfidence as number) ?? 1.0,
      },
      create: {
        documentId,
        documentCategory: (data.documentCategory as any) || 'OTHER',
        detectedLanguage: (data.detectedLanguage as string) || 'en',
        pageOrientation: (data.pageOrientation as string) || 'PORTRAIT',
        layoutType: (data.layoutType as string) || 'SINGLE_PAGE',
        ocrTemplateId: data.ocrTemplateId as string,
        isOcrRequired: (data.isOcrRequired as boolean) ?? true,
        isEncrypted: (data.isEncrypted as boolean) ?? false,
        isSupported: (data.isSupported as boolean) ?? true,
        classificationConfidence: (data.classificationConfidence as number) ?? 1.0,
      },
    });
  }

  async saveQuality(documentId: string, data: Record<string, unknown>): Promise<DocumentQuality> {
    return this.prisma.documentQuality.upsert({
      where: { documentId },
      update: {
        qualityScore: (data.qualityScore as number) ?? 100.0,
        qualityGrade: (data.qualityGrade as any) || 'EXCELLENT',
        ocrReadiness: (data.ocrReadiness as any) || 'READY',
        resolutionDpi: (data.resolutionDpi as number) ?? 300,
        isBlurred: (data.isBlurred as boolean) ?? false,
        noiseLevel: (data.noiseLevel as string) || 'LOW',
        contrastScore: (data.contrastScore as number) ?? 1.0,
        issues: (data.issues as Prisma.InputJsonValue) || [],
        recommendedFixes: (data.recommendedFixes as Prisma.InputJsonValue) || [],
      },
      create: {
        documentId,
        qualityScore: (data.qualityScore as number) ?? 100.0,
        qualityGrade: (data.qualityGrade as any) || 'EXCELLENT',
        ocrReadiness: (data.ocrReadiness as any) || 'READY',
        resolutionDpi: (data.resolutionDpi as number) ?? 300,
        isBlurred: (data.isBlurred as boolean) ?? false,
        noiseLevel: (data.noiseLevel as string) || 'LOW',
        contrastScore: (data.contrastScore as number) ?? 1.0,
        issues: (data.issues as Prisma.InputJsonValue) || [],
        recommendedFixes: (data.recommendedFixes as Prisma.InputJsonValue) || [],
      },
    });
  }

  async saveExpiry(documentId: string, data: Record<string, unknown>): Promise<DocumentExpiry> {
    return this.prisma.documentExpiry.create({
      data: {
        documentId,
        documentType: (data.documentType as string) || 'OTHER',
        issueDate: data.issueDate ? new Date(data.issueDate as string) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate as string) : null,
        daysRemaining: data.daysRemaining as number,
        status: (data.status as string) || 'VALID',
      },
    });
  }

  async getChecksumRecord(checksumSha256: string): Promise<DocumentChecksum | null> {
    return this.prisma.documentChecksum.findUnique({
      where: { checksumSha256 },
    });
  }
}
