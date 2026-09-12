import { Injectable } from '@nestjs/common';
import { ApplicationReadinessDto, ApplicationReadinessStatus } from '@gpios/shared';

@Injectable()
export class ApplicationReadinessService {
  analyzeReadiness(_policy: { id: string; title: string }, citizenFacts: Record<string, unknown>): ApplicationReadinessDto {
    const missingFacts: string[] = [];
    const missingDocuments: string[] = [];
    const verificationGaps: string[] = [];
    const expiredEvidence: string[] = [];
    const missingOnboardingAnswers: string[] = [];

    if (!citizenFacts.bankAccountNumber) {
      missingFacts.push('bankAccountNumber');
    }
    if (!citizenFacts.aadhaarNumber) {
      missingDocuments.push('Aadhaar Card Copy');
    }

    let completionPercentage = 100;
    let status: ApplicationReadinessStatus = ApplicationReadinessStatus.READY;

    if (missingDocuments.length > 0) {
      completionPercentage = 75;
      status = ApplicationReadinessStatus.MISSING_DOCUMENTS;
    } else if (missingFacts.length > 0) {
      completionPercentage = 85;
      status = ApplicationReadinessStatus.PARTIALLY_READY;
    }

    return {
      status,
      completionPercentage,
      missingFacts,
      missingDocuments,
      verificationGaps,
      expiredEvidence,
      missingOnboardingAnswers,
    };
  }
}
