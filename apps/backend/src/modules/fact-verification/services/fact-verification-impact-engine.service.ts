import { Injectable } from '@nestjs/common';
import { FactVerificationImpactDto } from '@gpios/shared';

@Injectable()
export class FactVerificationImpactEngineService {
  calculateImpact(params: {
    factId: string;
    attributeKey: string;
    requiresManualReview: boolean;
    correlationId: string;
  }): FactVerificationImpactDto {
    let eligibilityReEvaluationRequired = false;
    let recommendationRecalculationRequired = false;
    let journeyRevalidationRequired = false;
    let documentReverificationRequired = false;
    let noDownstreamImpact = false;

    const affectedSchemes: string[] = [];
    const affectedRecommendations: string[] = [];
    const affectedJourneys: string[] = [];

    if (['annualIncome', 'isLandOwner', 'residenceState', 'casteCategory'].includes(params.attributeKey)) {
      eligibilityReEvaluationRequired = true;
      recommendationRecalculationRequired = true;
      affectedSchemes.push('PM-KISAN', 'NSP Scholarship');
      affectedRecommendations.push('Agricultural Support Subvention');
    }

    if (['bankAccountNumber', 'aadhaarNumber', 'incomeCertificateNumber'].includes(params.attributeKey)) {
      journeyRevalidationRequired = true;
      documentReverificationRequired = true;
      affectedJourneys.push('Direct Support Journey');
    }

    if (!eligibilityReEvaluationRequired && !recommendationRecalculationRequired && !journeyRevalidationRequired && !params.requiresManualReview) {
      noDownstreamImpact = true;
    }

    return {
      factId: params.factId,
      attributeKey: params.attributeKey,
      eligibilityReEvaluationRequired,
      recommendationRecalculationRequired,
      journeyRevalidationRequired,
      documentReverificationRequired,
      manualReviewRequired: params.requiresManualReview,
      noDownstreamImpact,
      impactReason: noDownstreamImpact
        ? `Fact verification for '${params.attributeKey}' completed with no downstream domain impact.`
        : `Fact verification for '${params.attributeKey}' triggers downstream re-evaluation.`,
      affectedSchemes,
      affectedRecommendations,
      affectedJourneys,
      correlationId: params.correlationId,
    };
  }
}
