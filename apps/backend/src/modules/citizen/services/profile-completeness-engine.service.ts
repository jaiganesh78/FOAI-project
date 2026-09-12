import { Injectable } from '@nestjs/common';
import { ProfileCompletenessBreakdownDto } from '@gpios/shared';

@Injectable()
export class ProfileCompletenessEngineService {
  private readonly mandatoryKeys = ['annualIncome', 'residenceState', 'occupationCategory', 'bankAccountNumber'];
  private readonly criticalEligibilityKeys = ['annualIncome', 'isLandOwner', 'residenceState'];
  private readonly recommendationKeys = ['occupationCategory', 'bankAccountNumber', 'casteCategory'];
  private readonly applicationKeys = ['annualIncome', 'residenceState', 'bankAccountNumber'];

  calculateCompleteness(knownAttributeKeys: string[]): ProfileCompletenessBreakdownDto {
    const knownSet = new Set(knownAttributeKeys);

    const missingMandatory = this.mandatoryKeys.filter((k) => !knownSet.has(k));
    const missingEligibility = this.criticalEligibilityKeys.filter((k) => !knownSet.has(k));
    const missingRecs = this.recommendationKeys.filter((k) => !knownSet.has(k));
    const missingApps = this.applicationKeys.filter((k) => !knownSet.has(k));

    const overallCompletenessPercentage = Math.round(
      ((this.mandatoryKeys.length - missingMandatory.length) / this.mandatoryKeys.length) * 100,
    );
    const criticalEligibilityCompletenessPercentage = Math.round(
      ((this.criticalEligibilityKeys.length - missingEligibility.length) / this.criticalEligibilityKeys.length) * 100,
    );
    const recommendationCompletenessPercentage = Math.round(
      ((this.recommendationKeys.length - missingRecs.length) / this.recommendationKeys.length) * 100,
    );
    const applicationReadinessCompletenessPercentage = Math.round(
      ((this.applicationKeys.length - missingApps.length) / this.applicationKeys.length) * 100,
    );

    return {
      overallCompletenessPercentage,
      criticalEligibilityCompletenessPercentage,
      recommendationCompletenessPercentage,
      applicationReadinessCompletenessPercentage,
      missingMandatoryAttributeKeys: missingMandatory,
      missingEligibilityAttributeKeys: missingEligibility,
      completenessConfigurationVersion: 1,
      calculatedAt: new Date().toISOString(),
    };
  }
}
