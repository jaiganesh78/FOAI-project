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
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/security/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/security/decorators/current-user.decorator';
import {
  APPLICATION_JOURNEY_ORCHESTRATOR,
  JOURNEY_QUERY_SERVICE,
} from '../../../core/tokens/injection-tokens';
import { ApplicationJourneyOrchestrator } from '../services/application-journey.orchestrator';
import { JourneyQueryService } from '../services/journey-query.service';
import {
  ApplicationJourneyDto,
  ApplicationChecklistDto,
  ActionPlanDto,
  JourneyTimelineEventDto,
  JourneyReadinessDto,
  JourneySnapshotDto,
  JourneyDifferenceDto,
  JourneyAnalyticsDto,
  JourneyReplayResultDto,
} from '@gpios/shared';

@Controller('journeys')
@UseGuards(JwtAuthGuard)
export class ApplicationJourneyController {
  constructor(
    @Inject(APPLICATION_JOURNEY_ORCHESTRATOR) private readonly orchestrator: ApplicationJourneyOrchestrator,
    @Inject(JOURNEY_QUERY_SERVICE) private readonly queryService: JourneyQueryService,
  ) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generateJourney(
    @CurrentUser() user: { userId: string },
    @Body() body: { policyId: string },
  ): Promise<ApplicationJourneyDto> {
    return this.orchestrator.generateJourney(user.userId, body.policyId);
  }

  @Get()
  async getJourneys(@CurrentUser() user: { userId: string }): Promise<ApplicationJourneyDto[]> {
    return this.queryService.getJourneysByUserId(user.userId);
  }

  @Get('differences')
  async getDifferences(@Query('journeyId') journeyId: string): Promise<JourneyDifferenceDto[]> {
    return this.queryService.getDifferences(journeyId);
  }

  @Get('analytics')
  async getAnalytics(@CurrentUser() user: { userId: string }): Promise<JourneyAnalyticsDto> {
    return this.queryService.getAnalytics(user.userId);
  }

  @Get('health')
  async getHealth() {
    return {
      status: 'HEALTHY',
      engine: 'GPIOS Application Journey & Action Planning Engine',
      version: '1.0.0',
      uptimeSec: process.uptime(),
    };
  }

  @Get(':id')
  async getJourneyById(@Param('id') id: string): Promise<ApplicationJourneyDto> {
    return this.queryService.getJourneyById(id);
  }

  @Get(':id/checklist')
  async getChecklist(@Param('id') id: string): Promise<ApplicationChecklistDto> {
    return this.queryService.getChecklist(id);
  }

  @Get(':id/action-plan')
  async getActionPlan(@Param('id') id: string): Promise<ActionPlanDto> {
    return this.queryService.getActionPlan(id);
  }

  @Get(':id/timeline')
  async getTimeline(@Param('id') id: string): Promise<JourneyTimelineEventDto[]> {
    return this.queryService.getTimeline(id);
  }

  @Get(':id/progress')
  async getProgress(@Param('id') id: string) {
    return this.queryService.getProgress(id);
  }

  @Get(':id/readiness')
  async getReadiness(@Param('id') id: string): Promise<JourneyReadinessDto> {
    return this.queryService.getReadiness(id);
  }

  @Get(':id/snapshot')
  async getSnapshot(@Param('id') id: string): Promise<JourneySnapshotDto> {
    return this.queryService.getSnapshot(id);
  }

  @Post(':id/replay')
  @HttpCode(HttpStatus.OK)
  async replayJourney(
    @Param('id') id: string,
    @Body() body?: { replayType?: 'SNAPSHOT' | 'EVENT' },
  ): Promise<JourneyReplayResultDto> {
    return this.queryService.replayJourney(id, body?.replayType || 'SNAPSHOT');
  }

  @Post(':id/step/:stepId/complete')
  @HttpCode(HttpStatus.OK)
  async completeStep(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
  ): Promise<ApplicationJourneyDto> {
    return this.orchestrator.completeJourneyStep(id, stepId);
  }
}
