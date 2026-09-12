import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IKnowledgeSourceRepository } from './knowledge-source.repository.interface';
import { KnowledgeSource, Prisma } from '@prisma/client';
import { CreateKnowledgeSourceInputDto } from '@gpios/shared';

@Injectable()
export class PrismaKnowledgeSourceRepository implements IKnowledgeSourceRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<KnowledgeSource | null> {
    return this.prisma.knowledgeSource.findFirst({ where: { id, deletedAt: null } });
  }

  async findByCode(code: string): Promise<KnowledgeSource | null> {
    return this.prisma.knowledgeSource.findFirst({ where: { code, deletedAt: null } });
  }

  async findAllActive(): Promise<KnowledgeSource[]> {
    return this.prisma.knowledgeSource.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { priority: 'asc' } });
  }

  async createSource(data: CreateKnowledgeSourceInputDto): Promise<KnowledgeSource> {
    return this.prisma.knowledgeSource.create({
      data: {
        code: data.code,
        name: data.name,
        sourceType: data.sourceType,
        baseUrl: data.baseUrl,
        crawlStrategy: data.crawlStrategy,
        updateFrequencyCron: data.updateFrequencyCron,
        capabilities: (data.capabilities as Prisma.InputJsonValue) || {
          supportsDownload: true,
          supportsApi: true,
          supportsHtmlScraping: true,
          supportsPdf: true,
          supportsIncrementalSync: true,
          supportsVersionDetection: true,
          supportsAuthentication: false,
        },
        priority: data.priority || 1,
      },
    });
  }

  async updateSource(id: string, data: Partial<KnowledgeSource>): Promise<KnowledgeSource> {
    return this.prisma.knowledgeSource.update({
      where: { id },
      data: data as Prisma.KnowledgeSourceUpdateInput,
    });
  }

  async updateHealthStatus(id: string, status: string): Promise<void> {
    await this.prisma.knowledgeSource.update({
      where: { id },
      data: { healthStatus: status },
    });
  }

  async softDelete(id: string): Promise<boolean> {
    await this.prisma.knowledgeSource.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return true;
  }
}
