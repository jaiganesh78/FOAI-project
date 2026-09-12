import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  APPLICATION_JOURNEY_REPOSITORY,
  JOURNEY_SNAPSHOT_SERVICE,
  JOURNEY_TIMELINE_SERVICE,
  JOURNEY_ANALYTICS_SERVICE,
  JOURNEY_READINESS_SERVICE,
  CHECKLIST_GENERATION_SERVICE,
  ACTION_PLANNING_SERVICE,
  JOURNEY_PROGRESS_SERVICE,
  JOURNEY_REPLAY_SERVICE,
  CITIZEN_QUERY_SERVICE,
} from '../../../core/tokens/injection-tokens';
import { IApplicationJourneyRepository } from '../repositories/journey.repository.interface';
import { JourneySnapshotService } from './journey-snapshot.service';
import { JourneyTimelineService } from './journey-timeline.service';
import { JourneyAnalyticsService } from './journey-analytics.service';
import { JourneyReadinessService } from './journey-readiness.service';
import { ChecklistGenerationService } from './checklist-generation.service';
import { ActionPlanningService } from './action-planning.service';
import { JourneyProgressService } from './journey-progress.service';
import { JourneyReplayService } from './journey-replay.service';
import { ICitizenQueryService } from '../../citizen/services/citizen-query.service';
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
  ApplicationJourneyStatus,
  JourneyUrgency,
  JourneyStepStatus,
  StepExecutionMode,
  StepOwner,
  StepBlockingBehavior,
  ApplicationJourneyStepDto,
} from '@gpios/shared';

@Injectable()
export class JourneyQueryService {
  constructor(
    @Inject(APPLICATION_JOURNEY_REPOSITORY) private readonly journeyRepo: IApplicationJourneyRepository,
    @Inject(JOURNEY_SNAPSHOT_SERVICE) private readonly snapshotService: JourneySnapshotService,
    @Inject(JOURNEY_TIMELINE_SERVICE) private readonly timelineService: JourneyTimelineService,
    @Inject(JOURNEY_ANALYTICS_SERVICE) private readonly analyticsService: JourneyAnalyticsService,
    @Inject(JOURNEY_READINESS_SERVICE) private readonly readinessService: JourneyReadinessService,
    @Inject(CHECKLIST_GENERATION_SERVICE) private readonly checklistService: ChecklistGenerationService,
    @Inject(ACTION_PLANNING_SERVICE) private readonly actionPlanningService: ActionPlanningService,
    @Inject(JOURNEY_PROGRESS_SERVICE) private readonly progressService: JourneyProgressService,
    @Inject(JOURNEY_REPLAY_SERVICE) private readonly replayService: JourneyReplayService,
    @Inject(CITIZEN_QUERY_SERVICE) private readonly citizenQueryService: ICitizenQueryService,
  ) {}

  async getJourneysByUserId(userId: string): Promise<ApplicationJourneyDto[]> {
    const list = await this.journeyRepo.findByUserId(userId);
    return list.map((j) => this.mapToJourneyDto(j));
  }

  async getJourneyById(id: string): Promise<ApplicationJourneyDto> {
    const j = await this.journeyRepo.findById(id);
    if (!j) throw new NotFoundException(`Application Journey '${id}' not found.`);
    return this.mapToJourneyDto(j);
  }

  async getChecklist(journeyId: string): Promise<ApplicationChecklistDto> {
    const j = await this.journeyRepo.findById(journeyId);
    if (!j) throw new NotFoundException(`Application Journey '${journeyId}' not found.`);
    const facts = await this.citizenQueryService.getStructuredFactsByUserId(j.userId);
    return this.checklistService.generateChecklist(journeyId, facts);
  }

  async getActionPlan(journeyId: string): Promise<ActionPlanDto> {
    const j = await this.journeyRepo.findById(journeyId);
    if (!j) throw new NotFoundException(`Application Journey '${journeyId}' not found.`);
    const steps: ApplicationJourneyStepDto[] = (j.steps || []).map((s) => ({
      id: s.id,
      stepCode: s.stepCode,
      title: s.title,
      description: s.description,
      status: s.status as JourneyStepStatus,
      order: s.order,
      isOptional: s.isOptional,
      executionPolicy: {
        executionMode: s.executionMode as StepExecutionMode,
        owner: s.owner as StepOwner,
        retryLimit: s.retryLimit,
        retryIntervalMs: s.retryIntervalMs,
        blockingBehavior: s.blockingBehavior as StepBlockingBehavior,
        timeoutMs: s.timeoutMs,
        requiresVerification: s.requiresVerification,
      },
      prerequisiteStepIds: [],
      blockedByStepIds: [],
    }));
    return this.actionPlanningService.generatePersonalizedActionPlan(journeyId, steps);
  }

  async getTimeline(journeyId: string): Promise<JourneyTimelineEventDto[]> {
    return this.timelineService.getTimelineForJourney(journeyId);
  }

  async getProgress(journeyId: string) {
    const j = await this.journeyRepo.findById(journeyId);
    if (!j) throw new NotFoundException(`Application Journey '${journeyId}' not found.`);
    return this.progressService.calculateProgress(j.steps as unknown as ApplicationJourneyStepDto[]);
  }

  async getReadiness(journeyId: string): Promise<JourneyReadinessDto> {
    const j = await this.journeyRepo.findById(journeyId);
    if (!j) throw new NotFoundException(`Application Journey '${journeyId}' not found.`);
    const facts = await this.citizenQueryService.getStructuredFactsByUserId(j.userId);
    const checklist = this.checklistService.generateChecklist(journeyId, facts);
    return this.readinessService.computeJourneyReadiness(
      facts,
      j.steps as unknown as ApplicationJourneyStepDto[],
      checklist,
    );
  }

  async getSnapshot(journeyId: string): Promise<JourneySnapshotDto> {
    const list = await this.snapshotService.getSnapshotsByJourneyId(journeyId);
    if (list.length === 0) throw new NotFoundException(`No snapshot found for journey '${journeyId}'.`);
    const s = list[0];
    return {
      id: s.id,
      journeyId: s.journeyId,
      userId: s.userId,
      citizenSnapshotId: s.citizenSnapshotId,
      eligibilitySnapshotId: s.eligibilitySnapshotId,
      recommendationSnapshotId: s.recommendationSnapshotId,
      journeyVersion: s.journeyVersion,
      snapshotData: (s.snapshotData as Record<string, unknown>) || {},
      createdAt: s.createdAt.toISOString(),
    };
  }

  async replayJourney(journeyId: string, replayType: 'SNAPSHOT' | 'EVENT' = 'SNAPSHOT'): Promise<JourneyReplayResultDto> {
    return this.replayService.replayJourney(journeyId, replayType);
  }

  async getDifferences(_journeyId: string): Promise<JourneyDifferenceDto[]> {
    return [];
  }

  async getAnalytics(userId: string): Promise<JourneyAnalyticsDto> {
    return this.analyticsService.getLatestAnalytics(userId);
  }

  private mapToJourneyDto(j: {
    id: string;
    userId: string;
    policyId: string;
    policyTitle: string;
    blueprintId: string;
    status: string;
    urgency: string;
    readinessScore: number;
    steps: Array<{
      id: string;
      stepCode: string;
      title: string;
      description: string;
      status: string;
      order: number;
      isOptional: boolean;
      executionMode: string;
      owner: string;
      retryLimit: number;
      retryIntervalMs: number;
      blockingBehavior: string;
      timeoutMs: number;
      requiresVerification: boolean;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }): ApplicationJourneyDto {
    return {
      id: j.id,
      userId: j.userId,
      policyId: j.policyId,
      policyTitle: j.policyTitle,
      blueprintId: j.blueprintId,
      status: j.status as ApplicationJourneyStatus,
      urgency: j.urgency as JourneyUrgency,
      readinessScore: j.readinessScore,
      steps: (j.steps || []).map((s) => ({
        id: s.id,
        stepCode: s.stepCode,
        title: s.title,
        description: s.description,
        status: s.status as JourneyStepStatus,
        order: s.order,
        isOptional: s.isOptional,
        executionPolicy: {
          executionMode: s.executionMode as StepExecutionMode,
          owner: s.owner as StepOwner,
          retryLimit: s.retryLimit,
          retryIntervalMs: s.retryIntervalMs,
          blockingBehavior: s.blockingBehavior as StepBlockingBehavior,
          timeoutMs: s.timeoutMs,
          requiresVerification: s.requiresVerification,
        },
        prerequisiteStepIds: [],
        blockedByStepIds: [],
      })),
      createdAt: j.createdAt.toISOString(),
      updatedAt: j.updatedAt.toISOString(),
    };
  }
}
