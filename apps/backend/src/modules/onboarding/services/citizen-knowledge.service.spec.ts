import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FactSourcePrecedencePolicy } from '../../citizen/services/fact-source-precedence.policy';
import { FactSourcePrecedence } from '@gpios/shared';
import { ProfileCompletenessEngineService } from '../../citizen/services/profile-completeness-engine.service';
import { ChangeImpactEngineService } from '../../citizen/services/change-impact-engine.service';
import { QuestionDependencyEngineService } from './question-dependency-engine.service';
import { QuestionPrioritizationEngineService } from './question-prioritization-engine.service';

describe('Sprint 9 — Enterprise Citizen Knowledge Profile & Adaptive Onboarding Unit Tests', () => {
  let precedencePolicy: FactSourcePrecedencePolicy;
  let completenessEngine: ProfileCompletenessEngineService;
  let impactEngine: ChangeImpactEngineService;
  let dependencyEngine: QuestionDependencyEngineService;
  let prioritizationEngine: QuestionPrioritizationEngineService;

  beforeEach(() => {
    precedencePolicy = new FactSourcePrecedencePolicy();
    completenessEngine = new ProfileCompletenessEngineService();
    impactEngine = new ChangeImpactEngineService();
    dependencyEngine = new QuestionDependencyEngineService();

    const mockRepo = {
      getActivePrioritizationConfig: vi.fn().mockResolvedValue({
        version: 1,
        eligibilityRelevanceWeight: 0.35,
        recommendationUnlockWeight: 0.25,
        criticalFactImpactWeight: 0.20,
        downstreamDependencyWeight: 0.15,
        citizenEffortPenaltyWeight: 0.05,
      }),
    };
    prioritizationEngine = new QuestionPrioritizationEngineService(mockRepo as any);
  });

  describe('A. Source Precedence Policy', () => {
    it('should assign correct precedence levels', () => {
      expect(precedencePolicy.getPrecedenceValue('GOVERNMENT_API')).toBe(FactSourcePrecedence.GOVERNMENT_VERIFIED);
      expect(precedencePolicy.getPrecedenceValue('MANUAL_OFFICER')).toBe(FactSourcePrecedence.MANUAL_OFFICER_VERIFIED);
      expect(precedencePolicy.getPrecedenceValue('DOCUMENT_OCR')).toBe(FactSourcePrecedence.DOCUMENT_DERIVED);
      expect(precedencePolicy.getPrecedenceValue('SYSTEM_DERIVED')).toBe(FactSourcePrecedence.SYSTEM_DERIVED);
      expect(precedencePolicy.getPrecedenceValue('USER_DECLARED')).toBe(FactSourcePrecedence.SELF_DECLARED);
    });

    it('should override lower-trust source with higher-trust source', () => {
      const result = precedencePolicy.shouldOverride('USER_DECLARED', 'GOVERNMENT_API');
      expect(result.override).toBe(true);
    });

    it('should preserve higher-trust source when lower-trust source attempts mutation', () => {
      const result = precedencePolicy.shouldOverride('GOVERNMENT_API', 'USER_DECLARED');
      expect(result.override).toBe(false);
    });
  });

  describe('E. Dependency Cycle Rejection (Tarjan DFS)', () => {
    it('should throw BadRequestException on circular question dependencies', () => {
      const cyclicNodes = [
        { id: 'Q1', dependencies: [{ parentQuestionId: 'Q2' }] },
        { id: 'Q2', dependencies: [{ parentQuestionId: 'Q1' }] },
      ];
      expect(() => dependencyEngine.detectCycles(cyclicNodes)).toThrow('Circular question dependency detected');
    });

    it('should pass cycle check for acyclic question dependency graph', () => {
      const acyclicNodes = [
        { id: 'Q1', dependencies: [] },
        { id: 'Q2', dependencies: [{ parentQuestionId: 'Q1' }] },
      ];
      expect(() => dependencyEngine.detectCycles(acyclicNodes)).not.toThrow();
    });
  });

  describe('F & G. Deterministic Question Ranking & Tie-Breaking', () => {
    it('should rank questions deterministically and apply 5-step tie-breaker', async () => {
      const questions = [
        {
          questionId: 'Q1',
          questionCode: 'Q_LAND_OWNERSHIP',
          questionVersionId: 'v1-land',
          attributeKey: 'isLandOwner',
          priority: 10,
          inputType: 'BOOLEAN',
        },
        {
          questionId: 'Q2',
          questionCode: 'Q_ANNUAL_INCOME',
          questionVersionId: 'v1-income',
          attributeKey: 'annualIncome',
          priority: 10,
          inputType: 'NUMBER',
        },
      ];

      const scored = await prioritizationEngine.calculatePrioritization(questions);
      expect(scored).toHaveLength(2);
      expect(scored[0].questionCode).toBe('Q_ANNUAL_INCOME');
      expect(scored[0].deterministicQuestionImpactScore).toBeGreaterThan(0);
    });
  });

  describe('R. Change Impact Engine', () => {
    it('should detect eligibility and recommendation impact for income change', () => {
      const impact = impactEngine.calculateImpact('annualIncome', 250000, 'corr-1');
      expect(impact.eligibilityReEvaluationRequired).toBe(true);
      expect(impact.recommendationRecalculationRequired).toBe(true);
      expect(impact.noDownstreamImpact).toBe(false);
    });

    it('should report no downstream impact for unmapped attribute', () => {
      const impact = impactEngine.calculateImpact('hobbies', 'gardening', 'corr-2');
      expect(impact.noDownstreamImpact).toBe(true);
    });
  });

  describe('Completeness Calculation', () => {
    it('should compute exact percentage breakdown', () => {
      const breakdown = completenessEngine.calculateCompleteness(['annualIncome', 'residenceState']);
      expect(breakdown.overallCompletenessPercentage).toBe(50);
      expect(breakdown.criticalEligibilityCompletenessPercentage).toBe(67);
      expect(breakdown.completenessConfigurationVersion).toBe(1);
    });
  });
});
