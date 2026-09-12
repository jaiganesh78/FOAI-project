import { Injectable } from '@nestjs/common';
import { DocumentExpiryDto, DocumentType } from '@gpios/shared';

@Injectable()
export class ExpiryIntelligenceService {
  computeExpiry(documentId: string, documentType: DocumentType, issueDate?: Date, expiryDate?: Date): DocumentExpiryDto {
    if (!expiryDate) {
      return {
        documentId,
        documentType,
        status: 'VALID',
      };
    }

    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' = 'VALID';
    if (daysRemaining <= 0) {
      status = 'EXPIRED';
    } else if (daysRemaining <= 30) {
      status = 'EXPIRING_SOON';
    }

    return {
      documentId,
      documentType,
      issueDate: issueDate ? issueDate.toISOString() : undefined,
      expiryDate: expiryDate.toISOString(),
      daysRemaining,
      status,
    };
  }
}
