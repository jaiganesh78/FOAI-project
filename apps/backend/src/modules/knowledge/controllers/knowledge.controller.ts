import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Inject,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/security/guards/jwt-auth.guard';
import {
  KNOWLEDGE_SOURCE_SERVICE,
  KNOWLEDGE_INGESTION_SERVICE,
  KNOWLEDGE_QUERY_SERVICE,
  KNOWLEDGE_STATISTICS_SERVICE,
} from '../../../core/tokens/injection-tokens';
import { KnowledgeSourceService } from '../services/knowledge-source.service';
import { KnowledgeIngestionService } from '../services/knowledge-ingestion.service';
import { IKnowledgeQueryService } from '../services/knowledge-query.service';
import { KnowledgeStatisticsService } from '../services/knowledge-statistics.service';
import { CreateKnowledgeSourceInputDto, KnowledgeSourceDto, KnowledgeStatisticsDto, KnowledgeHealthDto } from '@gpios/shared';

@Controller('knowledge')
@UseGuards(JwtAuthGuard)
export class KnowledgeController {
  constructor(
    @Inject(KNOWLEDGE_SOURCE_SERVICE) private readonly sourceService: KnowledgeSourceService,
    @Inject(KNOWLEDGE_INGESTION_SERVICE) private readonly ingestionService: KnowledgeIngestionService,
    @Inject(KNOWLEDGE_QUERY_SERVICE) private readonly queryService: IKnowledgeQueryService,
    @Inject(KNOWLEDGE_STATISTICS_SERVICE) private readonly statsService: KnowledgeStatisticsService,
  ) {}

  @Get('sources')
  async getSources(): Promise<KnowledgeSourceDto[]> {
    return this.sourceService.getAllSources();
  }

  @Post('sources')
  @HttpCode(HttpStatus.CREATED)
  async registerSource(@Body() input: CreateKnowledgeSourceInputDto): Promise<KnowledgeSourceDto> {
    return this.sourceService.registerSource(input);
  }

  @Patch('sources/:id')
  async updateSource(
    @Param('id') id: string,
    @Body() data: Partial<CreateKnowledgeSourceInputDto>,
  ): Promise<KnowledgeSourceDto> {
    return this.sourceService.updateSource(id, data);
  }

  @Post('sources/:id/refresh')
  @HttpCode(HttpStatus.OK)
  async triggerRefresh(@Param('id') id: string): Promise<{ jobId: string; status: string }> {
    return this.ingestionService.triggerManualRefresh(id);
  }

  @Get('documents')
  async getActiveDocuments() {
    return this.queryService.getActivePolicies();
  }

  @Get('documents/:id')
  async getDocumentById(@Param('id') id: string) {
    return this.queryService.getDocumentById(id);
  }

  @Get('documents/:id/versions')
  async getDocumentVersions(@Param('id') id: string) {
    return this.queryService.getDocumentVersions(id);
  }

  @Get('policies')
  async getNormalizedPolicies() {
    return this.queryService.getActivePolicies();
  }

  @Get('chunks')
  async getChunks() {
    return this.queryService.getAllChunks();
  }

  @Get('jobs')
  async getJobs() {
    return this.ingestionService.getAllJobs();
  }

  @Get('health')
  async getHealth(): Promise<KnowledgeHealthDto> {
    return this.ingestionService.getHealth();
  }

  @Get('stats')
  async getStats(): Promise<KnowledgeStatisticsDto> {
    return this.statsService.getStatistics();
  }
}
