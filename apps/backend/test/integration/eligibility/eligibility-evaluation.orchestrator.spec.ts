import { describe, it, expect } from 'vitest';
import { EligibilityEvaluationOrchestrator } from '../../../src/modules/eligibility/services/eligibility-evaluation.orchestrator';
import { CompiledRuleCacheService } from '../../../src/modules/eligibility/services/compiled-rule-cache.service';
import { EvaluationExecutionPlanner } from '../../../src/modules/eligibility/services/evaluation-execution-planner';
import { RuleEngineService } from '../../../src/modules/eligibility/services/rule-engine.service';
import { EvaluationGraphService } from '../../../src/modules/eligibility/services/evaluation-graph.service';
import { BenefitIntelligenceService } from '../../../src/modules/eligibility/services/benefit-intelligence.service';
import { OpportunityIntelligenceService } from '../../../src/modules/eligibility/services/opportunity-intelligence.service';
import { EligibilityStatus, LogicalGroupOperator, RuleOperator, RuleEvaluationCost } from '@gpios/shared';

describe('EligibilityEvaluationOrchestrator (Integration)', () => {
  const mockRule = {
    id: 'rule-1',
    ruleCode: 'RULE_PM_KISAN_LAND',
    estimatedCost: RuleEvaluationCost.LOW,
    versions: [
      {
        id: 'rv-1',
        versionNumber: 1,
        logicFingerprint: 'landHolding_lte_2',
        isCurrent: true,
        groups: [
          {
            id: 'g-1',
            logicalOperator: LogicalGroupOperator.ALL,
            conditions: [
              {
                id: 'c-1',
                attributeKey: 'landHolding',
                operator: RuleOperator.LESS_OR_EQUAL,
                expectedValue: 2.0,
                estimatedCost: RuleEvaluationCost.LOW,
              },
            ],
          },
        ],
      },
    ],
  };

  const mockRuleRepo = {
    findAllActiveRules: async () => [mockRule],
  };

  const mockContextEngine = {
    buildContext: async () => ({
      userId: 'user-101',
      citizenSnapshotId: 'snap-101',
      citizenFacts: { landHolding: 1.5, annualIncome: 180000 },
      activePolicies: [{ id: 'pol-1', title: 'PM Kisan Samman Nidhi Portal' }],
    }),
  };

  const mockTraceStore = {
    createTrace: async (t: any) => ({ id: 'trace-1', ...t }),
  };

  const mockSnapshotService = {
    createEligibilitySnapshot: async (s: any) => ({
      id: 'snap-uuid-1',
      userId: s.userId,
      citizenSnapshotId: s.citizenSnapshotId,
      policyVersionId: s.policyVersionId,
      decisionTraceId: s.decisionTraceId,
      status: s.status,
      results: s.results,
      benefitAnalysis: s.benefitAnalysis,
      opportunityAnalysis: s.opportunityAnalysis,
      createdAt: new Date(),
    }),
  };

  const mockExplainability = {
    generateExplanation: async () => ({
      humanExplanation: 'Citizen is eligible.',
      technicalExplanation: 'Evaluated 1 rules.',
    }),
  };

  const mockMetricsService = {
    recordMetrics: async () => {},
  };

  const mockEventPublisher = { publish: async () => {} };
  const mockClock = { now: () => new Date() };

  const orchestrator = new EligibilityEvaluationOrchestrator(
    mockRuleRepo as any,
    mockContextEngine as any,
    new CompiledRuleCacheService(),
    new EvaluationExecutionPlanner(),
    new RuleEngineService(),
    new EvaluationGraphService(),
    mockTraceStore as any,
    mockSnapshotService as any,
    new BenefitIntelligenceService(),
    new OpportunityIntelligenceService(),
    mockExplainability as any,
    mockMetricsService as any,
    mockEventPublisher as any,
    mockClock as any,
  );

  it('should orchestrate complete eligibility evaluation pipeline and produce snapshot', async () => {
    const snapshot = await orchestrator.evaluateEligibility('user-101');

    expect(snapshot.userId).toBe('user-101');
    expect(snapshot.status).toBe(EligibilityStatus.ELIGIBLE);
    expect(snapshot.results.length).toBe(1);
    expect(snapshot.benefitAnalysis?.totalMonetaryValue).toBe(6000);
  });
});
