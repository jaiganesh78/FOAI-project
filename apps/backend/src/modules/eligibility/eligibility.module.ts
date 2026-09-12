import { Module } from '@nestjs/common';
import {
  POLICY_RULE_REPOSITORY,
  DECISION_TRACE_REPOSITORY,
  ELIGIBILITY_SNAPSHOT_REPOSITORY,
  POLICY_VALIDATION_SERVICE,
  RULE_ENGINE_SERVICE,
  COMPILED_RULE_CACHE_SERVICE,
  EVALUATION_EXECUTION_PLANNER,
  FACT_USAGE_INDEX_SERVICE,
  DEPENDENCY_GRAPH_SERVICE,
  EVALUATION_GRAPH_SERVICE,
  TRACE_STORE_SERVICE,
  SNAPSHOT_SERVICE_ELIGIBILITY,
  CONTEXT_ENGINE_SERVICE,
  BENEFIT_INTELLIGENCE_SERVICE,
  OPPORTUNITY_INTELLIGENCE_SERVICE,
  EXPLAINABILITY_SERVICE,
  DECISION_REPLAY_SERVICE,
  EVALUATION_METRICS_SERVICE,
  INCREMENTAL_EVALUATION_SERVICE,
  ELIGIBILITY_EVALUATION_ORCHESTRATOR,
  ELIGIBILITY_QUERY_SERVICE,
} from '../../core/tokens/injection-tokens';
import { PrismaPolicyRuleRepository } from './repositories/prisma-policy-rule.repository';
import { PrismaDecisionTraceRepository } from './repositories/prisma-decision-trace.repository';
import { PrismaEligibilitySnapshotRepository } from './repositories/prisma-eligibility-snapshot.repository';

import { PolicyValidationService } from './services/policy-validation.service';
import { CompiledRuleCacheService } from './services/compiled-rule-cache.service';
import { EvaluationExecutionPlanner } from './services/evaluation-execution-planner';
import { FactUsageIndexService } from './services/fact-usage-index.service';
import { RuleEngineService } from './services/rule-engine.service';
import { DependencyGraphService } from './services/dependency-graph.service';
import { EvaluationGraphService } from './services/evaluation-graph.service';
import { TraceStoreService } from './services/trace-store.service';
import { SnapshotService } from './services/snapshot.service';
import { ContextEngineService } from './services/context-engine.service';
import { BenefitIntelligenceService } from './services/benefit-intelligence.service';
import { OpportunityIntelligenceService } from './services/opportunity-intelligence.service';
import { ExplainabilityService } from './services/explainability.service';
import { DecisionReplayService } from './services/decision-replay.service';
import { EvaluationMetricsService } from './services/evaluation-metrics.service';
import { IncrementalEvaluationService } from './services/incremental-evaluation.service';
import { EligibilityEvaluationOrchestrator } from './services/eligibility-evaluation.orchestrator';
import { EligibilityQueryService } from './services/eligibility-query.service';

import { EligibilityController } from './controllers/eligibility.controller';
import { AuthModule } from '../auth/auth.module';
import { CitizenModule } from '../citizen/citizen.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { DatabaseModule } from '../../core/database/database.module';
import { EventBusModule } from '../../core/event-bus/event-bus.module';
import { ClockModule } from '../../core/clock/clock.module';

@Module({
  imports: [DatabaseModule, EventBusModule, ClockModule, AuthModule, CitizenModule, KnowledgeModule],
  controllers: [EligibilityController],
  providers: [
    // Repositories
    { provide: POLICY_RULE_REPOSITORY, useClass: PrismaPolicyRuleRepository },
    { provide: DECISION_TRACE_REPOSITORY, useClass: PrismaDecisionTraceRepository },
    { provide: ELIGIBILITY_SNAPSHOT_REPOSITORY, useClass: PrismaEligibilitySnapshotRepository },

    // Services & Engines
    { provide: POLICY_VALIDATION_SERVICE, useClass: PolicyValidationService },
    { provide: COMPILED_RULE_CACHE_SERVICE, useClass: CompiledRuleCacheService },
    { provide: EVALUATION_EXECUTION_PLANNER, useClass: EvaluationExecutionPlanner },
    { provide: FACT_USAGE_INDEX_SERVICE, useClass: FactUsageIndexService },
    { provide: RULE_ENGINE_SERVICE, useClass: RuleEngineService },
    { provide: DEPENDENCY_GRAPH_SERVICE, useClass: DependencyGraphService },
    { provide: EVALUATION_GRAPH_SERVICE, useClass: EvaluationGraphService },
    { provide: TRACE_STORE_SERVICE, useClass: TraceStoreService },
    { provide: SNAPSHOT_SERVICE_ELIGIBILITY, useClass: SnapshotService },
    { provide: CONTEXT_ENGINE_SERVICE, useClass: ContextEngineService },
    { provide: BENEFIT_INTELLIGENCE_SERVICE, useClass: BenefitIntelligenceService },
    { provide: OPPORTUNITY_INTELLIGENCE_SERVICE, useClass: OpportunityIntelligenceService },
    { provide: EXPLAINABILITY_SERVICE, useClass: ExplainabilityService },
    { provide: DECISION_REPLAY_SERVICE, useClass: DecisionReplayService },
    { provide: EVALUATION_METRICS_SERVICE, useClass: EvaluationMetricsService },
    { provide: INCREMENTAL_EVALUATION_SERVICE, useClass: IncrementalEvaluationService },
    { provide: ELIGIBILITY_EVALUATION_ORCHESTRATOR, useClass: EligibilityEvaluationOrchestrator },
    { provide: ELIGIBILITY_QUERY_SERVICE, useClass: EligibilityQueryService },
  ],
  exports: [
    ELIGIBILITY_EVALUATION_ORCHESTRATOR,
    ELIGIBILITY_QUERY_SERVICE,
    DECISION_REPLAY_SERVICE,
    POLICY_VALIDATION_SERVICE,
  ],
})
export class EligibilityModule {}
