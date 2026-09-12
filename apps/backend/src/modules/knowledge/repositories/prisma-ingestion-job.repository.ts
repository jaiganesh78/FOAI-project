import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IIngestionJobRepository, CreateIngestionJobData } from './ingestion-job.repository.interface';
import { KnowledgeIngestionJob } from '@prisma/client';

@Injectable()
export class PrismaIngestionJobRepository implements IIngestionJobRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<KnowledgeIngestionJob | null> {
    return this.prisma.knowledgeIngestionJob.findUnique({ where: { id } });
  }

  async findAll(): Promise<KnowledgeIngestionJob[]> {
    return this.prisma.knowledgeIngestionJob.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createJob(data: CreateIngestionJobData): Promise<KnowledgeIngestionJob> {
    return this.prisma.knowledgeIngestionJob.create({
      data: {
        sourceId: data.sourceId,
        stage: data.stage || 'DISCOVERY',
        status: 'RUNNING',
      },
    });
  }

  async updateStage(id: string, stage: string): Promise<void> {
    await this.prisma.knowledgeIngestionJob.update({
      where: { id },
      data: { stage },
    });
  }

  async completeJob(
    id: string,
    metrics: {
      processingDurationMs: number;
      parsingDurationMs: number;
      normalizationDurationMs: number;
      chunkGenerationDurationMs: number;
      storageDurationMs: number;
    },
  ): Promise<KnowledgeIngestionJob> {
    return this.prisma.knowledgeIngestionJob.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        stage: 'COMPLETED',
        completedAt: new Date(),
        processingDurationMs: metrics.processingDurationMs,
        parsingDurationMs: metrics.parsingDurationMs,
        normalizationDurationMs: metrics.normalizationDurationMs,
        chunkGenerationDurationMs: metrics.chunkGenerationDurationMs,
        storageDurationMs: metrics.storageDurationMs,
      },
    });
  }

  async failJob(id: string, errorMessage: string): Promise<KnowledgeIngestionJob> {
    return this.prisma.knowledgeIngestionJob.update({
      where: { id },
      data: {
        status: 'FAILED',
        stage: 'FAILED',
        completedAt: new Date(),
        errorMessage,
      },
    });
  }
}
