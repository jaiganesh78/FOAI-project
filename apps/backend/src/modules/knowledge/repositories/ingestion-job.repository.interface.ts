import { KnowledgeIngestionJob } from '@prisma/client';

export interface CreateIngestionJobData {
  sourceId: string;
  stage?: string;
}

export interface IIngestionJobRepository {
  findById(id: string): Promise<KnowledgeIngestionJob | null>;
  findAll(): Promise<KnowledgeIngestionJob[]>;
  createJob(data: CreateIngestionJobData): Promise<KnowledgeIngestionJob>;
  updateStage(id: string, stage: string): Promise<void>;
  completeJob(id: string, metrics: { processingDurationMs: number; parsingDurationMs: number; normalizationDurationMs: number; chunkGenerationDurationMs: number; storageDurationMs: number }): Promise<KnowledgeIngestionJob>;
  failJob(id: string, errorMessage: string): Promise<KnowledgeIngestionJob>;
}
