import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FactSourcePrecedencePolicy } from '../../citizen/services/fact-source-precedence.policy';
import { FactConflictEngineService } from './fact-conflict-engine.service';
import { CanonicalFactResolutionService } from './canonical-fact-resolution.service';
import { FactVerificationImpactEngineService } from './fact-verification-impact-engine.service';
import { FactVerificationReviewService } from './fact-verification-review.service';
import { FactVerificationReplayService } from './fact-verification-replay.service';
import { FactReconciliationWorkflowService } from './fact-reconciliation-workflow.service';
import { FactSourcePrecedence, ReconciliationStatus, ReconciliationStrategy, FactConflictCategory } from '@gpios/shared';

describe('Sprint 10 — Enterprise Fact Verification, Evidence Reconciliation & Citizen Truth Engine Unit Tests', () => {
  let precedencePolicy: FactSourcePrecedencePolicy;
  let conflictEngine: FactConflictEngineService;
  let resolutionService: CanonicalFactResolutionService;
  let impactEngine: FactVerificationImpactEngineService;
  let reviewService: FactVerificationReviewService;
  let replayService: FactVerificationReplayService;
  let workflowService: FactReconciliationWorkflowService;

  beforeEach(() => {
    precedencePolicy = new FactSourcePrecedencePolicy();
    conflictEngine = new FactConflictEngineService();
    impactEngine = new FactVerificationImpactEngineService();
    workflowService = new FactReconciliationWorkflowService();

    const mockVerificationRepo = {
      createReview: vi.fn().mockImplementation((data: Record<string, unknown>) => ({
        id: 'review-101',
        ...data,
        status: 'PENDING',
        createdAt: new Date(),
      })),
      updateReview: vi.fn().mockImplementation((id: string, data: Record<string, unknown>) => ({
        id,
        ...data,
        citizenId: 'citizen-101',
        attributeKey: 'annualIncome',
        priority: 100,
        reason: 'Officer review required',
        requiredEvidenceTypes: ['DOCUMENT'],
        slaDeadline: new Date(),
        version: 2,
      })),
      findReviewsByCitizenId: vi.fn().mockResolvedValue([]),
      createSnapshot: vi.fn().mockImplementation((data: Record<string, unknown>) => ({
        id: 'snap-101',
        ...data,
        createdAt: new Date(),
      })),
      getRunById: vi.fn().mockResolvedValue({
        id: 'run-101',
        attributeKey: 'annualIncome',
        policyId: 'policy-101',
        policyVersion: 3,
        policyChecksumSha256: 'mock-checksum-v3',
      }),
      getSnapshotByRun: vi.fn().mockResolvedValue({
        id: 'snap-101',
        verificationRunId: 'run-101',
        citizenId: 'user-101',
        factId: 'fact-101',
        canonicalValue: 250000,
        canonicalSource: 'GOVERNMENT_VERIFIED',
        freshnessStatus: 'FRESH',
        policyId: 'policy-101',
        policyVersion: 3,
        policyConfiguration: { minimumTrustScore: 70 },
        policyChecksumSha256: 'mock-checksum-v3',
        checksumSha256: 'mock-snapshot-checksum',
        createdAt: new Date(),
      }),
    };

    const mockPolicyEngine = {
      getPolicyByVersion: vi.fn().mockImplementation((attrKey: string, ver: number) => {
        if (ver === 3) {
          return {
            policyId: 'policy-101',
            attributeKey: attrKey,
            version: 3,
            acceptableSources: ['GOVERNMENT_VERIFIED'],
            minimumTrustScore: 70,
            freshnessExpiryDurationDays: 365,
            requireManualReviewForGovernmentExpired: true,
            requireManualReviewForConflicts: true,
            checksumSha256: 'mock-checksum-v3',
            isActive: false,
          };
        }
        return {
          policyId: 'policy-101',
          attributeKey: attrKey,
          version: 4,
          acceptableSources: ['GOVERNMENT_VERIFIED', 'MANUAL_OFFICER_VERIFIED'],
          minimumTrustScore: 75,
          checksumSha256: 'mock-checksum-v4',
          isActive: true,
        };
      }),
    };

    resolutionService = new CanonicalFactResolutionService(precedencePolicy);
    reviewService = new FactVerificationReviewService(mockVerificationRepo as unknown as import('../repositories/fact-verification.repository.interface').IFactVerificationRepository);
    replayService = new FactVerificationReplayService(
      mockVerificationRepo as unknown as import('../repositories/fact-verification.repository.interface').IFactVerificationRepository,
      mockPolicyEngine as unknown as import('./fact-verification-policy-engine.service').FactVerificationPolicyEngineService,
    );
  });

  describe('1. Single Source of Truth & Precedence', () => {
    it('should assign correct source precedence ordering', () => {
      expect(precedencePolicy.getPrecedenceValue('GOVERNMENT_VERIFIED')).toBe(FactSourcePrecedence.GOVERNMENT_VERIFIED);
      expect(precedencePolicy.getPrecedenceValue('MANUAL_OFFICER_VERIFIED')).toBe(FactSourcePrecedence.MANUAL_OFFICER_VERIFIED);
      expect(precedencePolicy.getPrecedenceValue('DOCUMENT_DERIVED')).toBe(FactSourcePrecedence.DOCUMENT_DERIVED);
      expect(precedencePolicy.getPrecedenceValue('SYSTEM_DERIVED')).toBe(FactSourcePrecedence.SYSTEM_DERIVED);
      expect(precedencePolicy.getPrecedenceValue('SELF_DECLARED')).toBe(FactSourcePrecedence.SELF_DECLARED);
    });
  });

  describe('2 & 3. Policy Overrides & Resolution Matrix', () => {
    it('Condition 1: Higher precedence + valid evidence + fresh => Automatic resolution', async () => {
      const policy = {
        policyId: 'p1',
        attributeKey: 'annualIncome',
        version: 1,
        acceptableSources: ['GOVERNMENT_VERIFIED'],
        minimumTrustScore: 70,
        freshnessExpiryDurationDays: 365,
        requireManualReviewForGovernmentExpired: true,
        requireManualReviewForConflicts: true,
        checksumSha256: 'chk',
        isActive: true,
      };

      const result = await resolutionService.resolveCanonicalFact({
        verificationRunId: 'run-1',
        userId: 'user-1',
        factId: 'fact-1',
        attributeKey: 'annualIncome',
        currentFactValue: 250000,
        currentSource: 'GOVERNMENT_VERIFIED',
        competingValues: [{ source: 'GOVERNMENT_VERIFIED', value: 250000 }],
        policy,
        isFresh: true,
        trustScore: 85,
        isValidChain: true,
        hasProvenance: true,
      });

      expect(result.requiresManualReview).toBe(false);
      expect(result.strategy).toBe(ReconciliationStrategy.ACCEPT_GOVERNMENT);
    });

    it('Condition 2: Government source with expired evidence does NOT automatically win; policy overrides to require manual review', async () => {
      const policy = {
        policyId: 'p1',
        attributeKey: 'annualIncome',
        version: 1,
        acceptableSources: ['GOVERNMENT_VERIFIED'],
        minimumTrustScore: 70,
        freshnessExpiryDurationDays: 365,
        requireManualReviewForGovernmentExpired: true,
        requireManualReviewForConflicts: true,
        checksumSha256: 'chk',
        isActive: true,
      };

      const result = await resolutionService.resolveCanonicalFact({
        verificationRunId: 'run-2',
        userId: 'user-1',
        factId: 'fact-1',
        attributeKey: 'annualIncome',
        currentFactValue: 250000,
        currentSource: 'GOVERNMENT_VERIFIED',
        competingValues: [{ source: 'GOVERNMENT_VERIFIED', value: 250000 }],
        policy,
        isFresh: false, // Expired evidence!
        trustScore: 85,
        isValidChain: true,
        hasProvenance: true,
      });

      expect(result.requiresManualReview).toBe(true);
      expect(result.strategy).toBe(ReconciliationStrategy.REQUIRE_MANUAL_REVIEW);
    });
  });

  describe('5. Conflict Detection Isolation', () => {
    it('should classify conflict without mutating state', () => {
      const conflict = conflictEngine.classifyConflict({
        citizenId: 'u1',
        factId: 'f1',
        attributeKey: 'annualIncome',
        competingValues: [
          { source: 'GOVERNMENT_VERIFIED', value: 250000 },
          { source: 'SELF_DECLARED', value: 500000 },
        ],
        isExpired: false,
        trustScore: 85,
        hasProvenance: true,
        policyVersion: 1,
      });

      expect(conflict.category).toBe(FactConflictCategory.SOURCE_CONFLICT);
      expect(conflict.severity).toBe('CRITICAL');
      expect(conflict.status).toBe('DETECTED');
    });

    it('should deduplicate same-value sources without false conflict', () => {
      const conflict = conflictEngine.classifyConflict({
        citizenId: 'u1',
        factId: 'f1',
        attributeKey: 'annualIncome',
        competingValues: [
          { source: 'GOVERNMENT_VERIFIED', value: 250000 },
          { source: 'DOCUMENT_DERIVED', value: 250000 },
        ],
        isExpired: false,
        trustScore: 85,
        hasProvenance: true,
        policyVersion: 1,
      });

      expect(conflict.category).toBe(FactConflictCategory.DUPLICATE_FACT);
      expect(conflict.severity).toBe('LOW');
    });
  });

  describe('7 & 9. Manual Review Queue & Security Boundaries', () => {
    it('should reject citizen attempt to assign officer review', async () => {
      await expect(
        reviewService.assignReview('review-101', 'officer-1', ['CITIZEN']),
      ).rejects.toThrow('Security Boundary Rejection');
    });

    it('should allow officer to assign review', async () => {
      const result = await reviewService.assignReview('review-101', 'officer-1', ['GOVERNMENT_OFFICER']);
      expect(result.assignedReviewerId).toBe('officer-1');
      expect(result.status).toBe('ASSIGNED');
    });

    it('should reject citizen attempt to complete officer review', async () => {
      await expect(
        reviewService.completeReview('review-101', 'APPROVED', 'Reason', ['CITIZEN']),
      ).rejects.toThrow('Security Boundary Rejection');
    });
  });

  describe('2 & 10. Historical Policy Version Replay Isolation', () => {
    it('should replay run #101 using recorded historical policy v3 when v4 is currently active', async () => {
      vi.spyOn(replayService, 'computeSnapshotChecksum').mockReturnValue('mock-snapshot-checksum');

      const replay = await replayService.replayVerification('run-101');
      expect(replay.isVerified).toBe(true);
      expect(replay.replayedPolicyVersion).toBe(3);
    });
  });

  describe('Impact Engine', () => {
    it('should calculate declarative downstream impact', () => {
      const impact = impactEngine.calculateImpact({
        factId: 'f101',
        attributeKey: 'annualIncome',
        requiresManualReview: false,
        correlationId: 'corr-1',
      });
      expect(impact.eligibilityReEvaluationRequired).toBe(true);
      expect(impact.recommendationRecalculationRequired).toBe(true);
    });
  });

  describe('Workflow State Machine', () => {
    it('should validate legal state machine transitions', () => {
      expect(workflowService.validateTransition(ReconciliationStatus.DETECTED, ReconciliationStatus.CLASSIFIED)).toBe(true);
      expect(workflowService.validateTransition(ReconciliationStatus.DETECTED, ReconciliationStatus.CANONICAL_FACT_UPDATED)).toBe(false);
    });
  });
});
