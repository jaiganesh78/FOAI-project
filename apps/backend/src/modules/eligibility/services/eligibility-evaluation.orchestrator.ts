import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  POLICY_RULE_REPOSITORY,
  CONTEXT_ENGINE_SERVICE,
  COMPILED_RULE_CACHE_SERVICE,
  EVALUATION_EXECUTION_PLANNER,
  RULE_ENGINE_SERVICE,
  EVALUATION_GRAPH_SERVICE,
  TRACE_STORE_SERVICE,
  SNAPSHOT_SERVICE_ELIGIBILITY,
  BENEFIT_INTELLIGENCE_SERVICE,
  OPPORTUNITY_INTELLIGENCE_SERVICE,
  EXPLAINABILITY_SERVICE,
  EVALUATION_METRICS_SERVICE,
  EVENT_PUBLISHER,
  CLOCK_PROVIDER,
} from '../../../core/tokens/injection-tokens';
import { IPolicyRuleRepository } from '../repositories/policy-rule.repository.interface';
import { ContextEngineService } from './context-engine.service';
import { CompiledRuleCacheService } from './compiled-rule-cache.service';
import { EvaluationExecutionPlanner } from './evaluation-execution-planner';
import { RuleEngineService, RuleEvaluationResult } from './rule-engine.service';
import { EvaluationGraphService } from './evaluation-graph.service';
import { TraceStoreService } from './trace-store.service';
import { SnapshotService } from './snapshot.service';
import { BenefitIntelligenceService } from './benefit-intelligence.service';
import { OpportunityIntelligenceService } from './opportunity-intelligence.service';
import { ExplainabilityService } from './explainability.service';
import { EvaluationMetricsService } from './evaluation-metrics.service';
import { IEventPublisher } from '../../../core/event-bus/event-publisher.interface';
import { IClockProvider } from '../../../core/clock/clock.provider.interface';
import { EligibilitySnapshotWithDetails } from '../repositories/eligibility-snapshot.repository.interface';
import { EligibilityStatus, OpportunityGapType, EligibilitySnapshotDto, DomainEventRegistry } from '@gpios/shared';
import { randomUUID } from 'crypto';

@Injectable()
export class EligibilityEvaluationOrchestrator {
  private readonly logger = new Logger(EligibilityEvaluationOrchestrator.name);

  constructor(
    @Inject(POLICY_RULE_REPOSITORY) private readonly ruleRepository: IPolicyRuleRepository,
    @Inject(CONTEXT_ENGINE_SERVICE) private readonly contextEngine: ContextEngineService,
    @Inject(COMPILED_RULE_CACHE_SERVICE) private readonly ruleCache: CompiledRuleCacheService,
    @Inject(EVALUATION_EXECUTION_PLANNER) private readonly executionPlanner: EvaluationExecutionPlanner,
    @Inject(RULE_ENGINE_SERVICE) private readonly ruleEngine: RuleEngineService,
    @Inject(EVALUATION_GRAPH_SERVICE) private readonly evaluationGraphService: EvaluationGraphService,
    @Inject(TRACE_STORE_SERVICE) private readonly traceStore: TraceStoreService,
    @Inject(SNAPSHOT_SERVICE_ELIGIBILITY) private readonly snapshotService: SnapshotService,
    @Inject(BENEFIT_INTELLIGENCE_SERVICE) private readonly benefitService: BenefitIntelligenceService,
    @Inject(OPPORTUNITY_INTELLIGENCE_SERVICE) private readonly opportunityService: OpportunityIntelligenceService,
    @Inject(EXPLAINABILITY_SERVICE) private readonly explainabilityService: ExplainabilityService,
    @Inject(EVALUATION_METRICS_SERVICE) private readonly metricsService: EvaluationMetricsService,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
    @Inject(CLOCK_PROVIDER) private readonly clockProvider: IClockProvider,
  ) {}

  async evaluateEligibility(userId: string): Promise<EligibilitySnapshotDto> {
    const startTime = Date.now();
    const correlationId = randomUUID();
    this.logger.log(`Starting Eligibility Evaluation Orchestrator for user ${userId} [${correlationId}]`);

    // 1. Build Context
    const context = await this.contextEngine.buildContext(userId);

    // 2. Load & Compile Rules
    const activeRules = await this.ruleRepository.findAllActiveRules();
    let cacheHitCount = 0;

    const compiledRules = activeRules.map((rule) => {
      const { compiled, isHit } = this.ruleCache.getCompiledRule(rule);
      if (isHit) cacheHitCount++;
      return compiled;
    });

    // 3. Execution Planning (Cost-aware topological sort)
    const executionPlan = this.executionPlanner.planExecution(compiledRules);

    // 4. Rule Engine Execution
    const ruleResults: RuleEvaluationResult[] = [];
    for (const step of executionPlan) {
      const res = this.ruleEngine.evaluateRule(step.compiledRule, context.citizenFacts);
      ruleResults.push(res);
    }

    // 5. Build Evaluation Graph
    const graph = this.evaluationGraphService.buildEvaluationGraph(ruleResults, context.citizenFacts);

    // 6. Overall Status Determination
    const allPassed = ruleResults.length > 0 && ruleResults.every((r) => r.isPassed);
    const status = allPassed ? EligibilityStatus.ELIGIBLE : EligibilityStatus.INELIGIBLE;
    const executionDurationMs = Date.now() - startTime;

    // 7. Store Decision Trace
    const defaultRuleVersionId = compiledRules[0]?.ruleVersionId || 'default-ver-1';
    const trace = await this.traceStore.createTrace({
      userId,
      citizenSnapshotId: context.citizenSnapshotId,
      policyVersionId: context.activePolicies[0]?.id || 'default-policy-ver',
      policyRuleVersionId: defaultRuleVersionId,
      status,
      executionDurationMs,
      correlationId,
      ruleResults,
      graph,
    });

    // 8. Generate Explanations & Intelligence (Benefit & Opportunity)
    const policyTitle = context.activePolicies[0]?.title || 'PM Kisan Samman Nidhi';
    const explanation = await this.explainabilityService.generateExplanation(status, policyTitle, ruleResults, context.citizenFacts);

    const eligiblePolicies = status === EligibilityStatus.ELIGIBLE ? context.activePolicies : [];
    const ineligiblePolicies = status === EligibilityStatus.INELIGIBLE ? context.activePolicies : [];

    const benefit = this.benefitService.calculateBenefits(eligiblePolicies);
    const opportunity = this.opportunityService.analyzeOpportunities(ineligiblePolicies, context.citizenFacts);

    // 9. Create Snapshot
    const snapshot = await this.snapshotService.createEligibilitySnapshot({
      userId,
      citizenSnapshotId: context.citizenSnapshotId,
      policyVersionId: context.activePolicies[0]?.id || 'default-policy-ver',
      decisionTraceId: trace.id,
      status,
      results: [
        {
          policyId: context.activePolicies[0]?.id || 'pol-1',
          policyVersionId: context.activePolicies[0]?.id || 'pol-ver-1',
          status,
          passedRules: ruleResults.filter((r) => r.isPassed).map((r) => r.ruleCode),
          failedRules: ruleResults.filter((r) => !r.isPassed).map((r) => r.ruleCode),
          skippedRules: [],
          humanExplanation: explanation.humanExplanation,
          technicalExplanation: explanation.technicalExplanation,
        },
      ],
      benefitAnalysis: benefit,
      opportunityAnalysis: opportunity || undefined,
    });

    // 10. Record Operational Metrics
    await this.metricsService.recordMetrics({
      userId,
      executionDurationMs,
      graphDepth: 2,
      executedRuleCount: ruleResults.length,
      skippedRuleCount: 0,
      dependencyTraversalCount: executionPlan.length,
      cacheHit: cacheHitCount > 0,
    });

    // 11. Publish Domain Event
    await this.eventPublisher.publish({
      eventId: randomUUID(),
      eventName: DomainEventRegistry.Eligibility.Completed,
      eventVersion: '1.0',
      aggregateId: snapshot.id,
      occurredOn: this.clockProvider.now(),
      occurredAt: this.clockProvider.now(),
      payload: {
        userId,
        snapshotId: snapshot.id,
        traceId: trace.id,
        eligiblePoliciesCount: eligiblePolicies.length,
        ineligiblePoliciesCount: ineligiblePolicies.length,
        executionDurationMs,
      },
    });

    return this.mapToSnapshotDto(snapshot);
  }

  private mapToSnapshotDto(s: EligibilitySnapshotWithDetails): EligibilitySnapshotDto {
    return {
      id: s.id,
      userId: s.userId,
      citizenSnapshotId: s.citizenSnapshotId,
      policyVersionId: s.policyVersionId,
      decisionTraceId: s.decisionTraceId,
      status: s.status as unknown as EligibilityStatus,
      results: (s.results || []).map((r) => ({
        policyId: r.policyId,
        policyNumber: 'PM_KISAN-DOC-001',
        policyTitle: 'PM Kisan Guidelines',
        status: r.status as unknown as EligibilityStatus,
        passedRules: (r.passedRules as string[]) || [],
        failedRules: (r.failedRules as string[]) || [],
        skippedRules: (r.skippedRules as string[]) || [],
        humanExplanation: r.humanExplanation,
        technicalExplanation: r.technicalExplanation,
      })),
      benefitAnalysis: s.benefitAnalysis
        ? {
            id: s.benefitAnalysis.id,
            totalMonetaryValue: s.benefitAnalysis.totalMonetaryValue,
            recurringMonthlyValue: s.benefitAnalysis.recurringMonthlyValue,
            oneTimeGrantValue: s.benefitAnalysis.oneTimeGrantValue,
            urgencyLevel: s.benefitAnalysis.urgencyLevel,
            applicationDeadline: s.benefitAnalysis.applicationDeadline?.toISOString(),
          }
        : null,
      opportunityAnalysis: s.opportunityAnalysis
        ? {
            id: s.opportunityAnalysis.id,
            gapType: s.opportunityAnalysis.gapType as unknown as OpportunityGapType,
            description: s.opportunityAnalysis.description,
            requiredAction: s.opportunityAnalysis.requiredAction,
            potentialBenefitAmount: s.opportunityAnalysis.potentialBenefitAmount,
            gapValue: s.opportunityAnalysis.gapValue,
          }
        : null,
      createdAt: s.createdAt.toISOString(),
    };
  }
}
