import { Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_QUERY_SERVICE } from '../../../core/tokens/injection-tokens';
import { DocumentQueryService } from '../../document/services/document-query.service';

export interface DocumentSatisfactionResult {
  isSatisfied: boolean;
  reason?: string;
  documentId?: string;
  evidenceId?: string;
  trustScore?: number;
}

@Injectable()
export class DocumentAwareQuestionEngineService {
  constructor(
    @Inject(DOCUMENT_QUERY_SERVICE) private readonly documentQueryService: DocumentQueryService,
  ) {}

  async checkDocumentSatisfaction(userId: string, attributeKey: string): Promise<DocumentSatisfactionResult> {
    const documents = await this.documentQueryService.getDocumentsByUserId(userId);
    if (!documents || documents.length === 0) {
      return { isSatisfied: false, reason: 'No uploaded documents found.' };
    }

    const evidences = await this.documentQueryService.getEvidencesByUserId(userId);
    const targetEvidence = evidences.find((e) => e.factKey === attributeKey);
    if (!targetEvidence) {
      return { isSatisfied: false, reason: `No evidence found for attribute '${attributeKey}'.` };
    }

    const doc = documents.find((d) => d.id === targetEvidence.documentId);
    if (!doc) {
      return { isSatisfied: false, reason: 'Document associated with evidence not found.' };
    }

    if (doc.status !== 'ACTIVE') {
      return { isSatisfied: false, reason: `Document lifecycle status '${doc.status}' is not ACTIVE.` };
    }

    const verification = await this.documentQueryService.getVerificationByDocumentId(doc.id);
    if (!verification || verification.status !== 'VERIFIED') {
      return { isSatisfied: false, reason: `Document verification status is not VERIFIED.` };
    }

    const trustScore = doc.trustScore || (targetEvidence.trustScore ? targetEvidence.trustScore.trustScore : 0);
    if (trustScore < 70) {
      return { isSatisfied: false, reason: `Document trust score (${trustScore}) is below threshold (70).`, trustScore };
    }

    const conflicts = await this.documentQueryService.getConflictsByUserId(userId);
    const activeConflict = conflicts.find((c) => c.documentId === doc.id && c.factKey === attributeKey && c.status === 'DETECTED');
    if (activeConflict) {
      return { isSatisfied: false, reason: `Active conflict detected between document and declared fact.` };
    }

    return {
      isSatisfied: true,
      reason: `Question satisfied by verified active document '${doc.fileName}' (Trust Score: ${trustScore}).`,
      documentId: doc.id,
      evidenceId: targetEvidence.id,
      trustScore,
    };
  }
}
