import { describe, it, expect } from 'vitest';
import { ApplicationJourneyOrchestrator } from '../../../src/modules/application-journey/services/application-journey.orchestrator';
import { JourneyBlueprintService } from '../../../src/modules/application-journey/services/journey-blueprint.service';
import { JourneyConstraintEngine } from '../../../src/modules/application-journey/services/journey-constraint.engine';
import { JourneyDependencyGraphService } from '../../../src/modules/application-journey/services/journey-dependency-graph.service';
import { JourneyPlannerService } from '../../../src/modules/application-journey/services/journey-planner.service';
import { ChecklistGenerationService } from '../../../src/modules/application-journey/services/checklist-generation.service';
import { JourneyReadinessService } from '../../../src/modules/application-journey/services/journey-readiness.service';
import { DeadlineIntelligenceService } from '../../../src/modules/application-journey/services/deadline-intelligence.service';
import { ActionPlanningService } from '../../../src/modules/application-journey/services/action-planning.service';
import { JourneyProgressService } from '../../../src/modules/application-journey/services/journey-progress.service';
import { JourneySnapshotService } from '../../../src/modules/application-journey/services/journey-snapshot.service';
import { JourneyTimelineService } from '../../../src/modules/application-journey/services/journey-timeline.service';
import { JourneyAnalyticsService } from '../../../src/modules/application-journey/services/journey-analytics.service';
import { ApplicationJourneyStatus } from '@gpios/shared';

describe('ApplicationJourneyOrchestrator (Integration)', () => {
  const mockJourneyRepo = {
    createJourney: async (data: any) => ({
      id: 'journey-101',
      status: ApplicationJourneyStatus.CREATED,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    }),
  };

  const mockBlueprintRepo = {
    findById: async () => ({
      id: 'bp-pm-kisan-v1',
      parentBlueprintId: null,
      policyId: 'pol-pm-kisan-101',
      policyTitle: 'PM Kisan Samman Nidhi',
    }),
    findByPolicyId: async () => ({
      id: 'bp-pm-kisan-v1',
      parentBlueprintId: null,
      policyId: 'pol-pm-kisan-101',
      policyTitle: 'PM Kisan Samman Nidhi',
    }),
  };

  const mockSnapshotRepo = {
    createSnapshot: async (s: any) => ({ id: 'snap-101', ...s }),
  };

  const mockPrisma = {
    journeyTimeline: { create: async () => ({ id: 't-1', timestamp: new Date() }) },
    journeyAnalytics: { create: async () => ({ id: 1 }) },
  };

  const mockCitizenQuery = {
    getStructuredFactsByUserId: async () => ({ aadhaarNumber: '1234', bankAccountNumber: '5678', landHolding: 1.5 }),
  };

  const blueprintService = new JourneyBlueprintService(mockBlueprintRepo as any);
  const constraintEngine = new JourneyConstraintEngine();
  const graphService = new JourneyDependencyGraphService();
  const plannerService = new JourneyPlannerService(blueprintService, graphService);
  const checklistService = new ChecklistGenerationService();
  const readinessService = new JourneyReadinessService();
  const deadlineService = new DeadlineIntelligenceService();
  const actionPlanningService = new ActionPlanningService();
  const progressService = new JourneyProgressService();
  const snapshotService = new JourneySnapshotService(mockSnapshotRepo as any);
  const timelineService = new JourneyTimelineService(mockPrisma as any);
  const analyticsService = new JourneyAnalyticsService(mockPrisma as any);
  const eventPublisher = { publish: async () => {} };
  const clock = { now: () => new Date() };

  const orchestrator = new ApplicationJourneyOrchestrator(
    mockJourneyRepo as any,
    blueprintService,
    constraintEngine,
    plannerService,
    checklistService,
    readinessService,
    deadlineService,
    actionPlanningService,
    progressService,
    snapshotService,
    timelineService,
    analyticsService,
    mockCitizenQuery as any,
    eventPublisher as any,
    clock as any,
  );

  it('should generate complete citizen application journey and return journey DTO', async () => {
    const journey = await orchestrator.generateJourney('user-101', 'pol-pm-kisan-101');

    expect(journey.userId).toBe('user-101');
    expect(journey.status).toBe(ApplicationJourneyStatus.CREATED);
    expect(journey.steps.length).toBeGreaterThan(0);
    expect(journey.readinessScore).toBeGreaterThan(50);
  });
});
