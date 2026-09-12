import { Injectable } from '@nestjs/common';
import { ProfileChangeImpactDto } from '@gpios/shared';

@Injectable()
export class ChangeImpactEngineService {
  calculateImpact(changedFactKey: string, triggerFactValue: unknown, correlationId: string): ProfileChangeImpactDto {
    let eligibilityReEvaluationRequired = false;
    let recommendationRecalculationRequired = false;
    let journeyRevalidationRequired = false;
    let documentReverificationRequired = false;
    let noDownstreamImpact = false;
    const affectedDomains: string[] = [];

    if (['annualIncome', 'isLandOwner', 'residenceState', 'casteCategory'].includes(changedFactKey)) {
      eligibilityReEvaluationRequired = true;
      recommendationRecalculationRequired = true;
      affectedDomains.push('Eligibility', 'Recommendation');
    }

    if (['bankAccountNumber', 'aadhaarNumber', 'incomeCertificateNumber'].includes(changedFactKey)) {
      journeyRevalidationRequired = true;
      documentReverificationRequired = true;
      affectedDomains.push('ApplicationJourney', 'Document');
    }

    if (affectedDomains.length === 0) {
      noDownstreamImpact = true;
      affectedDomains.push('None');
    }

    return {
      changedFactKey,
      eligibilityReEvaluationRequired,
      recommendationRecalculationRequired,
      journeyRevalidationRequired,
      documentReverificationRequired,
      noDownstreamImpact,
      impactReason: noDownstreamImpact
        ? `Fact '${changedFactKey}' updated with no downstream domain impact.`
        : `Fact '${changedFactKey}' update triggers downstream evaluation for: ${affectedDomains.join(', ')}.`,
      triggerFactValue,
      affectedDomains,
      configurationVersion: 1,
      correlationId,
    };
  }
}
