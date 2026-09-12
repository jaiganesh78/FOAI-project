import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  APPLICATION_JOURNEY_REPOSITORY,
  JOURNEY_BLUEPRINT_SERVICE,
  JOURNEY_CONSTRAINT_ENGINE,
  JOURNEY_PLANNER_SERVICE,
  CHECKLIST_GENERATION_SERVICE,
  JOURNEY_READINESS_SERVICE,
  DEADLINE_INTELLIGENCE_SERVICE,
  ACTION_PLANNING_SERVICE,
  JOURNEY_PROGRESS_SERVICE,
  JOURNEY_SNAPSHOT_SERVICE,
  JOURNEY_TIMELINE_SERVICE,
  JOURNEY_ANALYTICS_SERVICE,
  CITIZEN_QUERY_SERVICE,
  EVENT_PUBLISHER,
  CLOCK_PROVIDER,
} from '../../../core/tokens/injection-tokens';
import { IApplicationJourneyRepository, ApplicationJourneyWithDetails } from '../repositories/journey.repository.interface';
import { JourneyBlueprintService } from './journey-blueprint.service';
import { JourneyConstraintEngine } from './journey-constraint.engine';
import { JourneyPlannerService } from './journey-planner.service';
import { ChecklistGenerationService } from './checklist-generation.service';
import { JourneyReadinessService } from './journey-readiness.service';
import { DeadlineIntelligenceService } from './deadline-intelligence.service';
import { ActionPlanningService } from './action-planning.service';
import { JourneyProgressService } from './journey-progress.service';
import { JourneySnapshotService } from './journey-snapshot.service';
import { JourneyTimelineService } from './journey-timeline.service';
import { JourneyAnalyticsService } from './journey-analytics.service';
import { ICitizenQueryService } from '../../citizen/services/citizen-query.service';
import { IEventPublisher } from '../../../core/event-bus/event-publisher.interface';
import { IClockProvider } from '../../../core/clock/clock.provider.interface';
import {
  ApplicationJourneyDto,
  ApplicationJourneyStatus,
  JourneyStepStatus,
  TimelineEventType,
  DomainEventRegistry,
  JourneyUrgency,
  ApplicationJourneyStepDto,
  ApplicationChecklistDto,
  ActionPlanDto,
} from '@gpios/shared';
import { randomUUID } from 'crypto';

@Injectable()
export class ApplicationJourneyOrchestrator {
  private readonly logger = new Logger(ApplicationJourneyOrchestrator.name);

  constructor(
    @Inject(APPLICATION_JOURNEY_REPOSITORY) private readonly journeyRepo: IApplicationJourneyRepository,
    @Inject(JOURNEY_BLUEPRINT_SERVICE) private readonly blueprintService: JourneyBlueprintService,
    @Inject(JOURNEY_CONSTRAINT_ENGINE) private readonly constraintEngine: JourneyConstraintEngine,
    @Inject(JOURNEY_PLANNER_SERVICE) private readonly plannerService: JourneyPlannerService,
    @Inject(CHECKLIST_GENERATION_SERVICE) private readonly checklistService: ChecklistGenerationService,
    @Inject(JOURNEY_READINESS_SERVICE) private readonly readinessService: JourneyReadinessService,
    @Inject(DEADLINE_INTELLIGENCE_SERVICE) private readonly deadlineService: DeadlineIntelligenceService,
    @Inject(ACTION_PLANNING_SERVICE) private readonly actionPlanningService: ActionPlanningService,
    @Inject(JOURNEY_PROGRESS_SERVICE) private readonly progressService: JourneyProgressService,
    @Inject(JOURNEY_SNAPSHOT_SERVICE) private readonly snapshotService: JourneySnapshotService,
    @Inject(JOURNEY_TIMELINE_SERVICE) private readonly timelineService: JourneyTimelineService,
    @Inject(JOURNEY_ANALYTICS_SERVICE) private readonly analyticsService: JourneyAnalyticsService,
    @Inject(CITIZEN_QUERY_SERVICE) private readonly citizenQueryService: ICitizenQueryService,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
    @Inject(CLOCK_PROVIDER) private readonly clockProvider: IClockProvider,
  ) {}

  async generateJourney(userId: string, policyId: string): Promise<ApplicationJourneyDto> {
    const startTime = Date.now();
    this.logger.log(`Generating Application Journey for user ${userId} and policy ${policyId}`);

    // 1. Resolve Blueprint
    let blueprint = await this.blueprintService.getBlueprintByPolicyId(policyId);
    if (!blueprint) {
      blueprint = await this.blueprintService.getBlueprintById('bp-pm-kisan-v1');
    }

    // 2. Plan Steps & Dependency Graph
    const steps = await this.plannerService.createPlanForBlueprint(blueprint.id);
    this.progressService.calculateProgress(steps);

    // 3. Citizen Facts & Checklist
    const citizenFacts = await this.citizenQueryService.getStructuredFactsByUserId(userId);
    const checklist = this.checklistService.generateChecklist('temp-id', citizenFacts);

    // 4. Urgency & Readiness Calculation
    const urgency = this.deadlineService.computeJourneyUrgency(blueprint.policyTitle, 85);
    const readiness = this.readinessService.computeJourneyReadiness(citizenFacts, steps, checklist);

    // 5. Persist Journey
    const journey = await this.journeyRepo.createJourney({
      userId,
      policyId: blueprint.policyId,
      policyTitle: blueprint.policyTitle,
      blueprintId: blueprint.id,
      urgency,
      readinessScore: readiness.score,
    });

    // 6. Personalized Action Plan
    const actionPlan = this.actionPlanningService.generatePersonalizedActionPlan(journey.id, steps);

    // 7. Timeline Event
    await this.timelineService.recordTimelineEvent({
      journeyId: journey.id,
      eventType: TimelineEventType.JOURNEY_CREATED,
      description: `Application journey initialized for policy '${blueprint.policyTitle}'`,
    });

    // 8. Snapshot Creation
    await this.snapshotService.createSnapshot({
      journeyId: journey.id,
      userId,
      citizenSnapshotId: `csnap-${userId}`,
      eligibilitySnapshotId: `esnap-${userId}`,
      recommendationSnapshotId: `rsnap-${userId}`,
      journeyVersion: 1,
      snapshotData: {
        journeyId: journey.id,
        blueprintId: blueprint.id,
        urgency,
        readinessScore: readiness.score,
        stepsCount: steps.length,
      },
    });

    // 9. Analytics & Domain Event
    await this.analyticsService.recordAnalytics({
      userId,
      averageJourneyDurationMs: Date.now() - startTime,
    });

    await this.eventPublisher.publish({
      eventId: randomUUID(),
      eventName: DomainEventRegistry.Journey.Created,
      eventVersion: '1.0',
      aggregateId: journey.id,
      occurredOn: this.clockProvider.now(),
      occurredAt: this.clockProvider.now(),
      payload: {
        journeyId: journey.id,
        userId,
        policyId: blueprint.policyId,
        blueprintId: blueprint.id,
        status: ApplicationJourneyStatus.CREATED,
      },
    });

    return this.mapToJourneyDto(journey, steps, checklist, actionPlan, urgency, readiness.score);
  }

  async completeJourneyStep(journeyId: string, stepId: string): Promise<ApplicationJourneyDto> {
    const journey = await this.journeyRepo.findById(journeyId);
    if (!journey) throw new NotFoundException(`Journey '${journeyId}' not found.`);

    const targetStep = journey.steps.find((s) => s.id === stepId || s.stepCode === stepId);
    if (!targetStep) throw new NotFoundException(`Step '${stepId}' not found in journey '${journeyId}'.`);

    // Evaluate Constraint Engine
    const prereqStatuses: Record<string, JourneyStepStatus> = {};
    journey.steps.forEach((s) => {
      prereqStatuses[s.id] = s.status as JourneyStepStatus;
    });

    this.constraintEngine.assertStepCanBeCompleted({
      stepId: targetStep.id,
      stepCode: targetStep.stepCode,
      prerequisiteStepStatuses: prereqStatuses,
      deadlinePassed: false,
      documentUploaded: true,
      verificationComplete: true,
    });

    // Update Step Status
    await this.journeyRepo.updateStepStatus(targetStep.id, JourneyStepStatus.COMPLETED);

    // Record Timeline Event
    await this.timelineService.recordTimelineEvent({
      journeyId,
      eventType: TimelineEventType.STATUS_UPDATED,
      description: `Completed step '${targetStep.title}'`,
    });

    const updatedJourney = await this.journeyRepo.findById(journeyId);
    return this.mapToJourneyDto(
      updatedJourney!,
      updatedJourney!.steps as unknown as ApplicationJourneyStepDto[],
      null,
      null,
      updatedJourney!.urgency as unknown as JourneyUrgency,
      updatedJourney!.readinessScore,
    );
  }

  private mapToJourneyDto(
    j: ApplicationJourneyWithDetails | Record<string, unknown>,
    steps: ApplicationJourneyStepDto[],
    checklist: ApplicationChecklistDto | null,
    actionPlan: ActionPlanDto | null,
    urgency: JourneyUrgency,
    readinessScore: number,
  ): ApplicationJourneyDto {
    const obj = j as Record<string, unknown>;
    return {
      id: obj.id as string,
      userId: obj.userId as string,
      policyId: obj.policyId as string,
      policyTitle: obj.policyTitle as string,
      blueprintId: obj.blueprintId as string,
      status: obj.status as ApplicationJourneyStatus,
      urgency,
      readinessScore,
      steps: (steps || []).map((s) => ({
        id: s.id,
        stepCode: s.stepCode || 'STEP_CODE',
        title: s.title || 'Step Title',
        description: s.description || 'Step Description',
        status: s.status || JourneyStepStatus.NOT_STARTED,
        order: s.order || 1,
        isOptional: s.isOptional || false,
        executionPolicy: s.executionPolicy || {
          executionMode: 'MANUAL',
          owner: 'CITIZEN',
          retryLimit: 3,
          retryIntervalMs: 60000,
          blockingBehavior: 'BLOCKING',
          timeoutMs: 86400000,
          requiresVerification: true,
        },
        prerequisiteStepIds: s.prerequisiteStepIds || [],
        blockedByStepIds: s.blockedByStepIds || [],
      })),
      checklist: checklist || undefined,
      actionPlan: actionPlan || undefined,
      createdAt: obj.createdAt ? (obj.createdAt as Date).toISOString() : new Date().toISOString(),
      updatedAt: obj.updatedAt ? (obj.updatedAt as Date).toISOString() : new Date().toISOString(),
    };
  }
}
