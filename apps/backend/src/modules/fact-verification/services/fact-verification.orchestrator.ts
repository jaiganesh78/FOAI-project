import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  FACT_VERIFICATION_POLICY_ENGINE_SERVICE,
  EVIDENCE_CHAIN_VALIDATION_SERVICE,
  FACT_FRESHNESS_REVALIDATION_SERVICE,
  CANONICAL_FACT_RESOLUTION_SERVICE,
  FACT_VERIFICATION_REPLAY_SERVICE,
  FACT_VERIFICATION_IMPACT_ENGINE_SERVICE,
} from '../../../core/tokens/injection-tokens';
import { FactVerificationPolicyEngineService } from './fact-verification-policy-engine.service';
import { EvidenceChainValidationService } from './evidence-chain-validation.service';
import { FactFreshnessRevalidationService } from './fact-freshness-revalidation.service';
import { CanonicalFactResolutionService } from './canonical-fact-resolution.service';
import { FactVerificationReplayService } from './fact-verification-replay.service';
import { FactVerificationImpactEngineService } from './fact-verification-impact-engine.service';
import { VerifyFactRequestDto, CanonicalFactResolutionDto, FactVerificationImpactDto, ReconciliationStrategy } from '@gpios/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class FactVerificationOrchestrator {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(FACT_VERIFICATION_POLICY_ENGINE_SERVICE) private readonly policyEngine: FactVerificationPolicyEngineService,
    @Inject(EVIDENCE_CHAIN_VALIDATION_SERVICE) private readonly evidenceChainService: EvidenceChainValidationService,
    @Inject(FACT_FRESHNESS_REVALIDATION_SERVICE) private readonly freshnessService: FactFreshnessRevalidationService,
    @Inject(CANONICAL_FACT_RESOLUTION_SERVICE) private readonly resolutionService: CanonicalFactResolutionService,
    @Inject(FACT_VERIFICATION_REPLAY_SERVICE) private readonly replayService: FactVerificationReplayService,
    @Inject(FACT_VERIFICATION_IMPACT_ENGINE_SERVICE) private readonly impactEngine: FactVerificationImpactEngineService,
  ) {}

  async runVerification(userId: string, dto: VerifyFactRequestDto): Promise<{
    verificationRunId: string;
    resolution: CanonicalFactResolutionDto;
    impact: FactVerificationImpactDto;
    isDuplicateRun: boolean;
  }> {
    // 1. Idempotency Check
    const existingRun = await this.prisma.factVerificationRun.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey: dto.idempotencyKey } },
    });

    if (existingRun) {
      const existingRes = await this.prisma.factVerificationResolution.findFirst({
        where: { verificationRunId: existingRun.id },
      });
      const impact = this.impactEngine.calculateImpact({
        factId: dto.factId,
        attributeKey: existingRun.attributeKey,
        requiresManualReview: false,
        correlationId: dto.idempotencyKey,
      });

      return {
        verificationRunId: existingRun.id,
        resolution: {
          resolutionId: existingRes ? existingRes.id : 'res-id',
          verificationRunId: existingRun.id,
          factId: dto.factId,
          attributeKey: existingRun.attributeKey,
          winningValue: existingRes ? existingRes.winningValue : null,
          winningSource: existingRes ? existingRes.winningSource : 'GOVERNMENT_VERIFIED',
          winningSourcePrecedence: existingRes ? existingRes.winningSourcePrecedence : 1,
          losingValues: existingRes ? (existingRes.losingValues as Array<{ source: string; value: unknown; precedence: number }>) : [],
          strategy: existingRes ? (existingRes.strategy as ReconciliationStrategy) : ReconciliationStrategy.ACCEPT_GOVERNMENT,
          resolutionReason: existingRes ? existingRes.resolutionReason : 'Replayed duplicate run',
          policyId: existingRun.policyId,
          policyVersion: existingRun.policyVersion,
          policyChecksumSha256: existingRun.policyChecksumSha256,
          resolvedAt: existingRes ? existingRes.createdAt.toISOString() : new Date().toISOString(),
          resolvedBy: userId,
        },
        impact,
        isDuplicateRun: true,
      };
    }

    // 2. Fetch CitizenFact (Sprint 9 single source of truth)
    const fact = await this.prisma.citizenFact.findUnique({
      where: { id: dto.factId },
    });
    if (!fact) {
      throw new BadRequestException(`CitizenFact '${dto.factId}' not found.`);
    }

    // 3. Load Active Verification Policy
    const policy = await this.policyEngine.getActivePolicy(fact.attributeKey);

    // 4. Evidence Chain Validation & Freshness Evaluation
    const chain = await this.evidenceChainService.validateEvidenceChain(userId, fact.id, fact.attributeKey);
    const freshness = await this.freshnessService.revalidateFreshness(fact.attributeKey, fact.updatedAt);
    const isFresh = freshness.freshnessStatus === 'FRESH';

    // 5. Competing Fact Values
    const factValue = fact.valueBoolean ?? fact.valueNumber ?? fact.valueDate ?? fact.valueText ?? fact.valueJson;
    const competingValues = [{ source: fact.source, value: factValue }];

    // 6. Resolution Evaluation
    const resolutionEval = await this.resolutionService.resolveCanonicalFact({
      verificationRunId: 'pending',
      userId,
      factId: fact.id,
      attributeKey: fact.attributeKey,
      currentFactValue: factValue,
      currentSource: fact.source,
      competingValues,
      policy,
      isFresh,
      trustScore: chain.trustScore,
      isValidChain: chain.isValidChain,
      hasProvenance: chain.provenanceExists,
    });

    // 7. Atomic Prisma Transaction (Outbox + Resolution + Canonical Fact Mutation + Review + Snapshot)
    return this.prisma.$transaction(async (tx) => {
      // Step A: Create Verification Run
      const run = await tx.factVerificationRun.create({
        data: {
          userId,
          factId: fact.id,
          attributeKey: fact.attributeKey,
          policyId: policy.policyId,
          policyVersion: policy.version,
          policyConfiguration: {
            acceptableSources: policy.acceptableSources,
            minimumTrustScore: policy.minimumTrustScore,
            freshnessExpiryDurationDays: policy.freshnessExpiryDurationDays,
          } as Prisma.InputJsonValue,
          policyChecksumSha256: policy.checksumSha256,
          idempotencyKey: dto.idempotencyKey,
          status: 'COMPLETED',
        },
      });

      // Step B: Create Resolution Record
      const res = await tx.factVerificationResolution.create({
        data: {
          verificationRunId: run.id,
          factId: fact.id,
          attributeKey: fact.attributeKey,
          winningValue: resolutionEval.winningValue as Prisma.InputJsonValue,
          winningSource: resolutionEval.winningSource,
          winningSourcePrecedence: fact.sourcePrecedence,
          losingValues: [] as Prisma.InputJsonValue,
          strategy: resolutionEval.strategy,
          resolutionReason: resolutionEval.resolutionReason,
          policyId: policy.policyId,
          policyVersion: policy.version,
          policyChecksumSha256: policy.checksumSha256,
          resolvedBy: userId,
        },
      });

      // Step C: Update Canonical CitizenFact (Sprint 9 Single Source of Truth)
      const nextVersion = fact.version + 1;
      await tx.citizenFact.update({
        data: {
          verificationStatus: resolutionEval.requiresManualReview ? 'SELF_DECLARED' : 'DOCUMENT_VERIFIED',
          version: nextVersion,
          freshnessStatus: freshness.freshnessStatus,
          updatedAt: new Date(),
        },
        where: { id: fact.id },
      });

      await tx.citizenFactVersion.create({
        data: {
          factId: fact.id,
          version: nextVersion,
          previousValue: (factValue as Prisma.InputJsonValue) || undefined,
          newValue: resolutionEval.winningValue as Prisma.InputJsonValue,
          source: resolutionEval.winningSource,
          sourcePrecedence: fact.sourcePrecedence,
          verificationStatus: resolutionEval.requiresManualReview ? 'SELF_DECLARED' : 'DOCUMENT_VERIFIED',
          freshnessPolicyVersion: policy.version,
          effectiveFrom: new Date(),
          changedBy: userId,
          correlationId: dto.idempotencyKey,
        },
      });

      // Step D: Create Manual Review item if policy required
      if (resolutionEval.requiresManualReview) {
        await tx.factVerificationReview.create({
          data: {
            conflictId: `conflict_${fact.id}`,
            citizenId: userId,
            attributeKey: fact.attributeKey,
            priority: 100,
            reason: resolutionEval.resolutionReason,
            requiredEvidenceTypes: ['DOCUMENT'] as Prisma.InputJsonValue,
            slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
            status: 'PENDING',
          },
        });
      }

      // Step E: Compute Downstream Impact
      const impact = this.impactEngine.calculateImpact({
        factId: fact.id,
        attributeKey: fact.attributeKey,
        requiresManualReview: resolutionEval.requiresManualReview,
        correlationId: dto.idempotencyKey,
      });

      // Step F: Create Verification Snapshot
      const snapshotPayload = {
        verificationRunId: run.id,
        citizenId: userId,
        factId: fact.id,
        canonicalValue: resolutionEval.winningValue,
        canonicalSource: resolutionEval.winningSource,
        freshnessStatus: freshness.freshnessStatus,
        policyId: policy.policyId,
        policyVersion: policy.version,
        policyConfiguration: {
          acceptableSources: policy.acceptableSources,
          minimumTrustScore: policy.minimumTrustScore,
        },
        policyChecksumSha256: policy.checksumSha256,
      };

      await this.replayService.createSnapshot(snapshotPayload);

      // Step G: Create Transactional Outbox Event
      await tx.factVerificationEvent.create({
        data: {
          eventId: `evt_${dto.idempotencyKey}`,
          eventType: 'fact.verification_completed',
          aggregateId: run.id,
          userId,
          correlationId: dto.idempotencyKey,
          payload: {
            runId: run.id,
            resolutionId: res.id,
            factId: fact.id,
            attributeKey: fact.attributeKey,
            strategy: resolutionEval.strategy,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        verificationRunId: run.id,
        resolution: {
          resolutionId: res.id,
          verificationRunId: run.id,
          factId: fact.id,
          attributeKey: fact.attributeKey,
          winningValue: res.winningValue,
          winningSource: res.winningSource,
          winningSourcePrecedence: res.winningSourcePrecedence,
          losingValues: [],
          strategy: res.strategy as ReconciliationStrategy,
          resolutionReason: res.resolutionReason,
          policyId: res.policyId,
          policyVersion: res.policyVersion,
          policyChecksumSha256: res.policyChecksumSha256,
          resolvedAt: res.createdAt.toISOString(),
          resolvedBy: userId,
        },
        impact,
        isDuplicateRun: false,
      };
    });
  }
}
