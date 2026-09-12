import { Injectable, Logger } from '@nestjs/common';
import { PolicyDocument, PolicyVersion } from '@prisma/client';

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
}

@Injectable()
export class PolicyValidationService {
  private readonly logger = new Logger(PolicyValidationService.name);

  validatePolicyForActivation(doc: PolicyDocument, version?: PolicyVersion | null): ValidationReport {
    const errors: string[] = [];

    if (!doc.documentNumber) errors.push('Document number is missing.');
    if (!doc.title) errors.push('Document title is missing.');
    if (!version) errors.push('Current policy version is missing.');
    if (version && !version.fingerprintHash) errors.push('Version fingerprint hash is missing.');

    const isValid = errors.length === 0;
    if (!isValid) {
      this.logger.warn(`Policy Document ${doc.id} failed validation for activation: ${errors.join(', ')}`);
    }

    return { isValid, errors };
  }
}
