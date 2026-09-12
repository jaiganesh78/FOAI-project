import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { DocumentAnalyticsDto } from '@gpios/shared';

@Injectable()
export class DocumentAnalyticsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async recordAnalytics(params: {
    userId: string;
    totalDocumentsUploaded?: number;
    totalVerifiedDocuments?: number;
    totalConflictedDocuments?: number;
    averageQualityScore?: number;
    averageTrustScore?: number;
    averageOcrConfidence?: number;
    deduplicationSavingsCount?: number;
    mostUploadedDocumentType?: string;
  }): Promise<void> {
    await this.prisma.documentAnalytics.create({
      data: {
        userId: params.userId,
        totalDocumentsUploaded: params.totalDocumentsUploaded ?? 1,
        totalVerifiedDocuments: params.totalVerifiedDocuments ?? 1,
        totalConflictedDocuments: params.totalConflictedDocuments ?? 0,
        averageQualityScore: params.averageQualityScore ?? 95.0,
        averageTrustScore: params.averageTrustScore ?? 95.0,
        averageOcrConfidence: params.averageOcrConfidence ?? 96.0,
        deduplicationSavingsCount: params.deduplicationSavingsCount ?? 0,
        mostUploadedDocumentType: params.mostUploadedDocumentType ?? 'INCOME_CERTIFICATE',
      },
    });
  }

  async getLatestAnalytics(userId: string): Promise<DocumentAnalyticsDto> {
    const record = await this.prisma.documentAnalytics.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return {
        totalDocumentsUploaded: 1,
        totalVerifiedDocuments: 1,
        totalConflictedDocuments: 0,
        averageQualityScore: 95.0,
        averageTrustScore: 95.0,
        averageOcrConfidence: 96.0,
        deduplicationSavingsCount: 0,
        mostUploadedDocumentType: 'INCOME_CERTIFICATE',
      };
    }

    return {
      totalDocumentsUploaded: record.totalDocumentsUploaded,
      totalVerifiedDocuments: record.totalVerifiedDocuments,
      totalConflictedDocuments: record.totalConflictedDocuments,
      averageQualityScore: record.averageQualityScore,
      averageTrustScore: record.averageTrustScore,
      averageOcrConfidence: record.averageOcrConfidence,
      deduplicationSavingsCount: record.deduplicationSavingsCount,
      mostUploadedDocumentType: record.mostUploadedDocumentType,
    };
  }
}
