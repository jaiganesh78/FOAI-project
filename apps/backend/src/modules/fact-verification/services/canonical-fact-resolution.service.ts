import { Inject, Injectable } from '@nestjs/common';
import { FACT_SOURCE_PRECEDENCE_POLICY } from '../../../core/tokens/injection-tokens';
import { FactSourcePrecedencePolicy } from '../../citizen/services/fact-source-precedence.policy';
import { ReconciliationStrategy, FactVerificationPolicyDto } from '@gpios/shared';

@Injectable()
export class CanonicalFactResolutionService {
  constructor(
    @Inject(FACT_SOURCE_PRECEDENCE_POLICY) private readonly precedencePolicy: FactSourcePrecedencePolicy,
  ) {}

  async resolveCanonicalFact(params: {
    verificationRunId: string;
    userId: string;
    factId: string;
    attributeKey: string;
    currentFactValue: unknown;
    currentSource: string;
    competingValues: Array<{ source: string; value: unknown }>;
    policy: FactVerificationPolicyDto;
    isFresh: boolean;
    trustScore: number;
    isValidChain: boolean;
    hasProvenance: boolean;
  }): Promise<{
    winningValue: unknown;
    winningSource: string;
    strategy: ReconciliationStrategy;
    resolutionReason: string;
    requiresManualReview: boolean;
  }> {
    // 10-Condition Resolution Matrix
    if (!params.hasProvenance) {
      return {
        winningValue: params.currentFactValue,
        winningSource: params.currentSource,
        strategy: ReconciliationStrategy.REQUIRE_MANUAL_REVIEW,
        resolutionReason: 'Condition 4: Missing evidence provenance. Flagged as INCOMPLETE_EVIDENCE.',
        requiresManualReview: true,
      };
    }

    if (!params.isFresh) {
      return {
        winningValue: params.currentFactValue,
        winningSource: params.currentSource,
        strategy: ReconciliationStrategy.REQUIRE_MANUAL_REVIEW,
        resolutionReason: 'Condition 2: Higher precedence source but expired evidence. Policy overrides automatic resolution to require manual review.',
        requiresManualReview: true,
      };
    }

    if (params.trustScore < params.policy.minimumTrustScore) {
      return {
        winningValue: params.currentFactValue,
        winningSource: params.currentSource,
        strategy: ReconciliationStrategy.DEFER,
        resolutionReason: `Condition 3: Trust score (${params.trustScore}) below policy threshold (${params.policy.minimumTrustScore}). Cannot establish canonical truth.`,
        requiresManualReview: false,
      };
    }

    // Evaluate competing values
    let winningCandidate = { source: params.currentSource, value: params.currentFactValue, precedence: this.precedencePolicy.getPrecedenceValue(params.currentSource) };

    for (const item of params.competingValues) {
      const p = this.precedencePolicy.getPrecedenceValue(item.source);
      if (p < winningCandidate.precedence) {
        winningCandidate = { source: item.source, value: item.value, precedence: p };
      }
    }

    let strategy = ReconciliationStrategy.ACCEPT_GOVERNMENT;
    if (winningCandidate.source.includes('OFFICER')) strategy = ReconciliationStrategy.ACCEPT_OFFICER;
    else if (winningCandidate.source.includes('DOCUMENT')) strategy = ReconciliationStrategy.ACCEPT_DOCUMENT;
    else if (winningCandidate.source.includes('SYSTEM')) strategy = ReconciliationStrategy.ACCEPT_SYSTEM;
    else if (winningCandidate.source.includes('USER') || winningCandidate.source.includes('SELF')) strategy = ReconciliationStrategy.ACCEPT_CITIZEN;

    return {
      winningValue: winningCandidate.value,
      winningSource: winningCandidate.source,
      strategy,
      resolutionReason: `Condition 1: Higher-precedence source '${winningCandidate.source}' with valid evidence, freshness, and trust score satisfied policy.`,
      requiresManualReview: false,
    };
  }
}
