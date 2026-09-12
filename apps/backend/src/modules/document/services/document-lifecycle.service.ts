import { Injectable, BadRequestException } from '@nestjs/common';
import { DocumentStatus } from '@gpios/shared';

@Injectable()
export class DocumentLifecycleService {
  private readonly allowedTransitions: Record<DocumentStatus, DocumentStatus[]> = {
    [DocumentStatus.UPLOADED]: [DocumentStatus.STORED, DocumentStatus.ARCHIVED],
    [DocumentStatus.STORED]: [DocumentStatus.CLASSIFIED, DocumentStatus.ARCHIVED],
    [DocumentStatus.CLASSIFIED]: [DocumentStatus.QUALITY_CHECKED, DocumentStatus.ARCHIVED],
    [DocumentStatus.QUALITY_CHECKED]: [DocumentStatus.OCR_PROCESSED, DocumentStatus.FACTS_EXTRACTED, DocumentStatus.ARCHIVED],
    [DocumentStatus.OCR_PROCESSED]: [DocumentStatus.FACTS_EXTRACTED, DocumentStatus.ARCHIVED],
    [DocumentStatus.FACTS_EXTRACTED]: [DocumentStatus.VERIFICATION_PENDING, DocumentStatus.ACTIVE, DocumentStatus.ARCHIVED],
    [DocumentStatus.VERIFICATION_PENDING]: [DocumentStatus.VERIFIED, DocumentStatus.ACTIVE, DocumentStatus.ARCHIVED],
    [DocumentStatus.VERIFIED]: [DocumentStatus.ACTIVE, DocumentStatus.SUPERSEDED, DocumentStatus.ARCHIVED],
    [DocumentStatus.ACTIVE]: [DocumentStatus.SUPERSEDED, DocumentStatus.ARCHIVED],
    [DocumentStatus.SUPERSEDED]: [DocumentStatus.ARCHIVED],
    [DocumentStatus.ARCHIVED]: [],
  };

  validateTransition(currentStatus: DocumentStatus, newStatus: DocumentStatus): void {
    const allowed = this.allowedTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid document lifecycle transition from '${currentStatus}' to '${newStatus}'.`,
      );
    }
  }

  canBeConsumedByDownstreamEngines(status: DocumentStatus): boolean {
    return status === DocumentStatus.ACTIVE;
  }
}
