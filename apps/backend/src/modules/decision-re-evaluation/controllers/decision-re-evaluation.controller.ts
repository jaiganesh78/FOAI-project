import { Controller, Post, Get, Body, Param, UseGuards, Inject, ForbiddenException, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/security/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/security/decorators/current-user.decorator';
import {
  DECISION_RE_EVALUATION_ORCHESTRATOR,
  STALE_STATE_SERVICE,
  RE_EVALUATION_REPLAY_SERVICE,
  RE_EVALUATION_ANALYTICS_SERVICE,
  DECISION_RE_EVALUATION_REPOSITORY,
} from '../../../core/tokens/injection-tokens';
import { DecisionReEvaluationOrchestrator } from '../services/decision-re-evaluation.orchestrator';
import { StaleStateService } from '../services/stale-state.service';
import { ReEvaluationReplayService } from '../services/re-evaluation-replay.service';
import { ReEvaluationAnalyticsService } from '../services/re-evaluation-analytics.service';
import { IDecisionReEvaluationRepository } from '../repositories/decision-re-evaluation.repository.interface';
import { TriggerReEvaluationDto, TriggerPolicyChangeDto } from '@gpios/shared';

interface AuthenticatedUser {
  id: string;
  roles?: string[];
}

interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}

@Controller('api/v1/decision-re-evaluation')
@UseGuards(JwtAuthGuard)
export class DecisionReEvaluationController {
  constructor(
    @Inject(DECISION_RE_EVALUATION_ORCHESTRATOR) private readonly orchestrator: DecisionReEvaluationOrchestrator,
    @Inject(STALE_STATE_SERVICE) private readonly staleStateService: StaleStateService,
    @Inject(RE_EVALUATION_REPLAY_SERVICE) private readonly replayService: ReEvaluationReplayService,
    @Inject(RE_EVALUATION_ANALYTICS_SERVICE) private readonly analyticsService: ReEvaluationAnalyticsService,
    @Inject(DECISION_RE_EVALUATION_REPOSITORY) private readonly repo: IDecisionReEvaluationRepository,
  ) {}

  @Post('trigger')
  async triggerReEvaluation(@CurrentUser() user: AuthenticatedUser, @Body() dto: TriggerReEvaluationDto) {
    return this.orchestrator.triggerReEvaluation(user.id, dto);
  }

  @Get(':id')
  async getJob(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const job = await this.repo.findJobById(id);
    if (!job) throw new ForbiddenException('Job not found or access denied.');
    if (job.userId !== user.id && !user.roles?.includes('ADMIN')) {
      throw new ForbiddenException('Security Boundary Rejection: Access to cross-citizen job denied.');
    }
    return job;
  }

  @Get(':id/impact')
  async getImpacts(@CurrentUser() _user: AuthenticatedUser, @Param('id') id: string) {
    return this.repo.findImpactsByJob(id);
  }

  @Get(':id/steps')
  async getSteps(@CurrentUser() _user: AuthenticatedUser, @Param('id') id: string) {
    return this.repo.findStepsByJob(id);
  }

  @Get(':id/diff')
  async getDiffs(@CurrentUser() _user: AuthenticatedUser, @Param('id') id: string) {
    return this.repo.findDiffsByJob(id);
  }

  @Get(':id/replay')
  async replayJob(@CurrentUser() _user: AuthenticatedUser, @Param('id') id: string) {
    return this.replayService.replayRun(id);
  }

  @Get('stale')
  async getStaleStates(@CurrentUser() user: AuthenticatedUser) {
    return this.staleStateService.getActiveStaleStates(user.id);
  }

  @Get('analytics')
  async getAnalytics(@CurrentUser() user: AuthenticatedUser, @Req() req: AuthenticatedRequest) {
    const roles = req.user?.roles || ['CITIZEN'];
    if (!roles.includes('GOVERNMENT_OFFICER') && !roles.includes('ADMIN')) {
      throw new ForbiddenException('Security Boundary Rejection: Access to operational analytics denied.');
    }
    return this.analyticsService.getAnalytics(user.id);
  }

  @Post('policy-change/trigger')
  async triggerPolicyChange(@Body() dto: TriggerPolicyChangeDto, @Req() req: AuthenticatedRequest) {
    const roles = req.user?.roles || ['CITIZEN'];
    if (!roles.includes('GOVERNMENT_OFFICER') && !roles.includes('ADMIN')) {
      throw new ForbiddenException('Security Boundary Rejection: Citizens cannot trigger policy activations.');
    }
    const officerId = req.user?.id || 'admin-1';
    return this.orchestrator.triggerPolicyChange(dto, officerId);
  }

  @Get('health')
  async getHealth() {
    return { status: 'HEALTHY', engine: 'DecisionReEvaluationOrchestrator', timestamp: new Date().toISOString() };
  }
}
