import { Injectable } from '@nestjs/common';
import { VerificationMethod, DocumentVerificationStatus } from '@gpios/shared';

@Injectable()
export class VerificationPolicyService {
  evaluateVerificationRequirements(method: VerificationMethod, qualityScore: number): DocumentVerificationStatus {
    if (method === VerificationMethod.DIGILOCKER || method === VerificationMethod.GOVERNMENT_API) {
      return DocumentVerificationStatus.VERIFIED;
    }
    if (qualityScore < 50) {
      return DocumentVerificationStatus.REQUIRES_MANUAL_REVIEW;
    }
    return DocumentVerificationStatus.VERIFIED;
  }
}
