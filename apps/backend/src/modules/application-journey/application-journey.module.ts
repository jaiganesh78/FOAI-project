import { Module } from '@nestjs/common';
import {
  APPLICATION_JOURNEY_REPOSITORY,
  JOURNEY_BLUEPRINT_REPOSITORY,
  JOURNEY_SNAPSHOT_REPOSITORY,
  JOURNEY_BLUEPRINT_SERVICE,
  JOURNEY_CONSTRAINT_ENGINE,
  JOURNEY_DEPENDENCY_GRAPH_SERVICE,
  JOURNEY_PLANNER_SERVICE,
  CHECKLIST_GENERATION_SERVICE,
  DOCUMENT_REQUIREMENT_SERVICE,
  JOURNEY_READINESS_SERVICE,
  DEADLINE_INTELLIGENCE_SERVICE,
  ACTION_PLANNING_SERVICE,
  JOURNEY_PROGRESS_SERVICE,
  JOURNEY_SNAPSHOT_SERVICE,
  JOURNEY_REPLAY_SERVICE,
  JOURNEY_EVENT_REPLAY_SERVICE,
  JOURNEY_DIFFERENCE_SERVICE,
  JOURNEY_TIMELINE_SERVICE,
  JOURNEY_ANALYTICS_SERVICE,
  APPLICATION_JOURNEY_ORCHESTRATOR,
  JOURNEY_QUERY_SERVICE,
} from '../../core/tokens/injection-tokens';

import { PrismaApplicationJourneyRepository } from './repositories/prisma-application-journey.repository';
import { PrismaJourneyBlueprintRepository } from './repositories/prisma-journey-blueprint.repository';
import { PrismaJourneySnapshotRepository } from './repositories/prisma-journey-snapshot.repository';

import { JourneyBlueprintService } from './services/journey-blueprint.service';
import { JourneyConstraintEngine } from './services/journey-constraint.engine';
import { JourneyDependencyGraphService } from './services/journey-dependency-graph.service';
import { JourneyPlannerService } from './services/journey-planner.service';
import { ChecklistGenerationService } from './services/checklist-generation.service';
import { DocumentRequirementService } from './services/document-requirement.service';
import { JourneyReadinessService } from './services/journey-readiness.service';
import { DeadlineIntelligenceService } from './services/deadline-intelligence.service';
import { ActionPlanningService } from './services/action-planning.service';
import { JourneyProgressService } from './services/journey-progress.service';
import { JourneySnapshotService } from './services/journey-snapshot.service';
import { JourneyReplayService } from './services/journey-replay.service';
import { JourneyDifferenceService } from './services/journey-difference.service';
import { JourneyTimelineService } from './services/journey-timeline.service';
import { JourneyAnalyticsService } from './services/journey-analytics.service';
import { ApplicationJourneyOrchestrator } from './services/application-journey.orchestrator';
import { JourneyQueryService } from './services/journey-query.service';

import { ApplicationJourneyController } from './controllers/application-journey.controller';
import { AuthModule } from '../auth/auth.module';
import { CitizenModule } from '../citizen/citizen.module';
import { EligibilityModule } from '../eligibility/eligibility.module';
import { RecommendationModule } from '../recommendation/recommendation.module';
import { DatabaseModule } from '../../core/database/database.module';
import { EventBusModule } from '../../core/event-bus/event-bus.module';
import { ClockModule } from '../../core/clock/clock.module';

@Module({
  imports: [
    DatabaseModule,
    EventBusModule,
    ClockModule,
    AuthModule,
    CitizenModule,
    EligibilityModule,
    RecommendationModule,
  ],
  controllers: [ApplicationJourneyController],
  providers: [
    // Repositories
    { provide: APPLICATION_JOURNEY_REPOSITORY, useClass: PrismaApplicationJourneyRepository },
    { provide: JOURNEY_BLUEPRINT_REPOSITORY, useClass: PrismaJourneyBlueprintRepository },
    { provide: JOURNEY_SNAPSHOT_REPOSITORY, useClass: PrismaJourneySnapshotRepository },

    // Core Services & Constraint/Replay Engines
    { provide: JOURNEY_BLUEPRINT_SERVICE, useClass: JourneyBlueprintService },
    { provide: JOURNEY_CONSTRAINT_ENGINE, useClass: JourneyConstraintEngine },
    { provide: JOURNEY_DEPENDENCY_GRAPH_SERVICE, useClass: JourneyDependencyGraphService },
    { provide: JOURNEY_PLANNER_SERVICE, useClass: JourneyPlannerService },
    { provide: CHECKLIST_GENERATION_SERVICE, useClass: ChecklistGenerationService },
    { provide: DOCUMENT_REQUIREMENT_SERVICE, useClass: DocumentRequirementService },
    { provide: JOURNEY_READINESS_SERVICE, useClass: JourneyReadinessService },
    { provide: DEADLINE_INTELLIGENCE_SERVICE, useClass: DeadlineIntelligenceService },
    { provide: ACTION_PLANNING_SERVICE, useClass: ActionPlanningService },
    { provide: JOURNEY_PROGRESS_SERVICE, useClass: JourneyProgressService },
    { provide: JOURNEY_SNAPSHOT_SERVICE, useClass: JourneySnapshotService },
    { provide: JOURNEY_REPLAY_SERVICE, useClass: JourneyReplayService },
    { provide: JOURNEY_EVENT_REPLAY_SERVICE, useClass: JourneyReplayService },
    { provide: JOURNEY_DIFFERENCE_SERVICE, useClass: JourneyDifferenceService },
    { provide: JOURNEY_TIMELINE_SERVICE, useClass: JourneyTimelineService },
    { provide: JOURNEY_ANALYTICS_SERVICE, useClass: JourneyAnalyticsService },
    { provide: APPLICATION_JOURNEY_ORCHESTRATOR, useClass: ApplicationJourneyOrchestrator },
    { provide: JOURNEY_QUERY_SERVICE, useClass: JourneyQueryService },
  ],
  exports: [
    APPLICATION_JOURNEY_ORCHESTRATOR,
    JOURNEY_QUERY_SERVICE,
    JOURNEY_REPLAY_SERVICE,
    JOURNEY_BLUEPRINT_SERVICE,
  ],
})
export class ApplicationJourneyModule {}
