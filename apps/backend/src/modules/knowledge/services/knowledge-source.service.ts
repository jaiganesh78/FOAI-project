import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { KNOWLEDGE_SOURCE_REPOSITORY, EVENT_PUBLISHER, CLOCK_PROVIDER } from '../../../core/tokens/injection-tokens';
import { IKnowledgeSourceRepository } from '../repositories/knowledge-source.repository.interface';
import { IEventPublisher } from '../../../core/event-bus/event-publisher.interface';
import { IClockProvider } from '../../../core/clock/clock.provider.interface';
import {
  KnowledgeSourceDto,
  CreateKnowledgeSourceInputDto,
  DomainEventRegistry,
  SourceCapabilitiesDto,
  KnowledgeSourceType,
  CrawlStrategy,
} from '@gpios/shared';
import { KnowledgeSource } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class KnowledgeSourceService {
  constructor(
    @Inject(KNOWLEDGE_SOURCE_REPOSITORY) private readonly sourceRepository: IKnowledgeSourceRepository,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
    @Inject(CLOCK_PROVIDER) private readonly clockProvider: IClockProvider,
  ) {}

  async getAllSources(): Promise<KnowledgeSourceDto[]> {
    const sources = await this.sourceRepository.findAllActive();
    return sources.map((s) => this.mapToDto(s));
  }

  async getSourceByCode(code: string): Promise<KnowledgeSourceDto> {
    const source = await this.sourceRepository.findByCode(code);
    if (!source) throw new NotFoundException(`Knowledge source '${code}' not found.`);
    return this.mapToDto(source);
  }

  async registerSource(input: CreateKnowledgeSourceInputDto): Promise<KnowledgeSourceDto> {
    const source = await this.sourceRepository.createSource(input);

    await this.eventPublisher.publish({
      eventId: randomUUID(),
      eventName: DomainEventRegistry.Knowledge.SourceRegistered,
      eventVersion: '1.0',
      aggregateId: source.id,
      occurredOn: this.clockProvider.now(),
      occurredAt: this.clockProvider.now(),
      payload: {
        sourceId: source.id,
        sourceCode: source.code,
        sourceType: source.sourceType,
        baseUrl: source.baseUrl,
        priority: source.priority,
      },
    });

    return this.mapToDto(source);
  }

  async updateSource(id: string, data: Partial<CreateKnowledgeSourceInputDto>): Promise<KnowledgeSourceDto> {
    const updated = await this.sourceRepository.updateSource(id, data as Partial<KnowledgeSource>);
    return this.mapToDto(updated);
  }

  private mapToDto(s: KnowledgeSource): KnowledgeSourceDto {
    return {
      id: s.id,
      code: s.code,
      name: s.name,
      sourceType: s.sourceType as unknown as KnowledgeSourceType,
      baseUrl: s.baseUrl,
      crawlStrategy: s.crawlStrategy as unknown as CrawlStrategy,
      updateFrequencyCron: s.updateFrequencyCron,
      capabilities: s.capabilities as unknown as SourceCapabilitiesDto,
      healthStatus: s.healthStatus,
      priority: s.priority,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
    };
  }
}
