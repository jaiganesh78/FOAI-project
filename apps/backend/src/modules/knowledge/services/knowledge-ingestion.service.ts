import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  KNOWLEDGE_SOURCE_REPOSITORY,
  INGESTION_JOB_REPOSITORY,
  DOCUMENT_PROCESSING_PIPELINE,
  EVENT_PUBLISHER,
  CLOCK_PROVIDER,
} from '../../../core/tokens/injection-tokens';
import { IKnowledgeSourceRepository } from '../repositories/knowledge-source.repository.interface';
import { IIngestionJobRepository } from '../repositories/ingestion-job.repository.interface';
import { DocumentProcessingPipeline } from './document-processing.pipeline';
import { IEventPublisher } from '../../../core/event-bus/event-publisher.interface';
import { IClockProvider } from '../../../core/clock/clock.provider.interface';
import { DomainEventRegistry, KnowledgeHealthDto } from '@gpios/shared';
import { randomUUID } from 'crypto';

@Injectable()
export class KnowledgeIngestionService {
  constructor(
    @Inject(KNOWLEDGE_SOURCE_REPOSITORY) private readonly sourceRepository: IKnowledgeSourceRepository,
    @Inject(INGESTION_JOB_REPOSITORY) private readonly jobRepository: IIngestionJobRepository,
    @Inject(DOCUMENT_PROCESSING_PIPELINE) private readonly pipeline: DocumentProcessingPipeline,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
    @Inject(CLOCK_PROVIDER) private readonly clockProvider: IClockProvider,
  ) {}

  async triggerManualRefresh(sourceId: string): Promise<{ jobId: string; status: string }> {
    const source = await this.sourceRepository.findById(sourceId);
    if (!source) throw new NotFoundException(`Knowledge source '${sourceId}' not found.`);

    const job = await this.jobRepository.createJob({ sourceId: source.id });

    try {
      const metrics = await this.pipeline.processSource(source);
      await this.jobRepository.completeJob(job.id, metrics);

      await this.eventPublisher.publish({
        eventId: randomUUID(),
        eventName: DomainEventRegistry.Knowledge.IngestionCompleted,
        eventVersion: '1.0',
        aggregateId: job.id,
        occurredOn: this.clockProvider.now(),
        occurredAt: this.clockProvider.now(),
        payload: {
          jobId: job.id,
          sourceId: source.id,
          processedDurationMs: metrics.processingDurationMs,
          documentsProcessedCount: metrics.skippedDuplicate ? 0 : 1,
        },
      });

      return { jobId: job.id, status: 'COMPLETED' };
    } catch (err) {
      const errorMsg = (err as Error).message;
      await this.jobRepository.failJob(job.id, errorMsg);
      await this.sourceRepository.updateHealthStatus(source.id, 'DEGRADED');

      await this.eventPublisher.publish({
        eventId: randomUUID(),
        eventName: DomainEventRegistry.Knowledge.IngestionFailed,
        eventVersion: '1.0',
        aggregateId: job.id,
        occurredOn: this.clockProvider.now(),
        occurredAt: this.clockProvider.now(),
        payload: {
          jobId: job.id,
          sourceId: source.id,
          errorMessage: errorMsg,
        },
      });

      throw err;
    }
  }

  async getAllJobs() {
    return this.jobRepository.findAll();
  }

  async getHealth(): Promise<KnowledgeHealthDto> {
    const sources = await this.sourceRepository.findAllActive();
    const jobs = await this.jobRepository.findAll();

    return {
      status: 'HEALTHY',
      totalJobsRun: jobs.length,
      activeSourcesCount: sources.length,
      healthySourcesCount: sources.filter((s) => s.healthStatus === 'HEALTHY').length,
      failedIngestions24h: jobs.filter((j) => j.status === 'FAILED').length,
      sources: sources.map((s) => ({
        sourceId: s.id,
        sourceCode: s.code,
        healthStatus: s.healthStatus,
        lastCrawlAt: s.updatedAt.toISOString(),
      })),
    };
  }
}
