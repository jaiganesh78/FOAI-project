import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Inject,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/security/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/security/decorators/current-user.decorator';
import {
  ELIGIBILITY_EVALUATION_ORCHESTRATOR,
  ELIGIBILITY_QUERY_SERVICE,
  INCREMENTAL_EVALUATION_SERVICE,
} from '../../../core/tokens/injection-tokens';
import { EligibilityEvaluationOrchestrator } from '../services/eligibility-evaluation.orchestrator';
import { EligibilityQueryService } from '../services/eligibility-query.service';
import { IncrementalEvaluationService } from '../services/incremental-evaluation.service';
import {
  EligibilitySnapshotDto,
  DecisionTraceDto,
  EvaluationMetricsDto,
  ReEvaluateEligibilityInput,
} from '@gpios/shared';

@Controller('eligibility')
@UseGuards(JwtAuthGuard)
export class EligibilityController {
  constructor(
    @Inject(ELIGIBILITY_EVALUATION_ORCHESTRATOR) private readonly orchestrator: EligibilityEvaluationOrchestrator,
    @Inject(ELIGIBILITY_QUERY_SERVICE) private readonly queryService: EligibilityQueryService,
    @Inject(INCREMENTAL_EVALUATION_SERVICE) private readonly incrementalService: IncrementalEvaluationService,
  ) {}

  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  async evaluateEligibility(@CurrentUser() user: { userId: string }): Promise<EligibilitySnapshotDto> {
    return this.orchestrator.evaluateEligibility(user.userId);
  }

  @Get('results')
  async getResults(@CurrentUser() user: { userId: string }): Promise<EligibilitySnapshotDto | null> {
    return this.queryService.getLatestSnapshot(user.userId);
  }

  @Get('results/:id')
  async getResultById(@Param('id') id: string): Promise<EligibilitySnapshotDto> {
    const res = await this.queryService.getSnapshotById(id);
    if (!res) throw new NotFoundException(`Eligibility Snapshot '${id}' not found.`);
    return res;
  }

  @Get('snapshots')
  async getSnapshots(@CurrentUser() user: { userId: string }) {
    const latest = await this.queryService.getLatestSnapshot(user.userId);
    return latest ? [latest] : [];
  }

  @Get('snapshots/:id')
  async getSnapshotById(@Param('id') id: string) {
    const res = await this.queryService.getSnapshotById(id);
    if (!res) throw new NotFoundException(`Eligibility Snapshot '${id}' not found.`);
    return res;
  }

  @Get('decision-traces/:id')
  async getDecisionTrace(@Param('id') id: string): Promise<DecisionTraceDto> {
    const trace = await this.queryService.getTraceById(id);
    if (!trace) throw new NotFoundException(`Decision Trace '${id}' not found.`);
    return trace;
  }

  @Post('replay/:id')
  @HttpCode(HttpStatus.OK)
  async replayDecision(@Param('id') id: string) {
    return this.queryService.replayDecision(id);
  }

  @Get('opportunities')
  async getOpportunities(@CurrentUser() user: { userId: string }) {
    const snapshot = await this.queryService.getLatestSnapshot(user.userId);
    return snapshot?.opportunityAnalysis ? [snapshot.opportunityAnalysis] : [];
  }

  @Get('explanations/:id')
  async getExplanation(@Param('id') id: string) {
    const snapshot = await this.queryService.getSnapshotById(id);
    if (!snapshot) throw new NotFoundException(`Eligibility Snapshot '${id}' not found.`);
    return {
      snapshotId: id,
      results: snapshot.results.map((r) => ({
        policyId: r.policyId,
        humanExplanation: r.humanExplanation,
        technicalExplanation: r.technicalExplanation,
      })),
    };
  }

  @Post('re-evaluate')
  @HttpCode(HttpStatus.OK)
  async reEvaluate(
    @CurrentUser() user: { userId: string },
    @Body() input: ReEvaluateEligibilityInput,
  ): Promise<EligibilitySnapshotDto> {
    const { shouldEvaluate } = this.incrementalService.shouldReEvaluate(input.attributeKeysChanged || []);
    if (!shouldEvaluate) {
      const existing = await this.queryService.getLatestSnapshot(user.userId);
      if (existing) return existing;
    }
    return this.orchestrator.evaluateEligibility(user.userId);
  }

  @Get('metrics')
  async getMetrics(@CurrentUser() user: { userId: string }): Promise<EvaluationMetricsDto> {
    return this.queryService.getMetrics(user.userId);
  }

  @Get('health')
  async getHealth() {
    return {
      status: 'HEALTHY',
      engine: 'GPIOS Eligibility Evaluation Orchestrator',
      version: '1.0.0',
      uptimeSec: process.uptime(),
    };
  }
}
