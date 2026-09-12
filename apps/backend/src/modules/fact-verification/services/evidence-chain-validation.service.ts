import { Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_QUERY_SERVICE } from '../../../core/tokens/injection-tokens';
import { DocumentQueryService } from '../../document/services/document-query.service';
import { EvidenceChainValidationDto } from '@gpios/shared';

@Injectable()
export class EvidenceChainValidationService {
  constructor(
    @Inject(DOCUMENT_QUERY_SERVICE) private readonly documentQueryService: DocumentQueryService,
  ) {}

  async validateEvidenceChain(userId: string, factId: string, attributeKey: string): Promise<EvidenceChainValidationDto> {
    const documents = await this.documentQueryService.getDocumentsByUserId(userId);
    if (!documents || documents.length === 0) {
      return {
        factId,
        isValidChain: false,
        provenanceExists: false,
        documentStatus: 'NONE',
        documentVerificationStatus: 'UNVERIFIED',
        trustScore: 0,
        isFresh: false,
        hasBlockingConflict: false,
        validationFailureReason: 'No uploaded documents found for citizen.',
      };
    }

    const evidences = await this.documentQueryService.getEvidencesByUserId(userId);
    const targetEvidence = evidences.find((e) => e.factKey === attributeKey);
    if (!targetEvidence) {
      return {
        factId,
        isValidChain: false,
        provenanceExists: false,
        documentStatus: 'NONE',
        documentVerificationStatus: 'UNVERIFIED',
        trustScore: 0,
        isFresh: false,
        hasBlockingConflict: false,
        validationFailureReason: `No evidence record found linking fact '${attributeKey}' to a document.`,
      };
    }

    const doc = documents.find((d) => d.id === targetEvidence.documentId);
    if (!doc) {
      return {
        factId,
        isValidChain: false,
        provenanceExists: true,
        documentStatus: 'MISSING',
        documentVerificationStatus: 'UNVERIFIED',
        trustScore: 0,
        isFresh: false,
        hasBlockingConflict: false,
        validationFailureReason: 'Document associated with evidence record does not exist.',
      };
    }

    if (doc.status !== 'ACTIVE') {
      return {
        factId,
        isValidChain: false,
        provenanceExists: true,
        documentStatus: doc.status,
        documentVerificationStatus: 'UNVERIFIED',
        trustScore: 0,
        isFresh: false,
        hasBlockingConflict: false,
        validationFailureReason: `Document status '${doc.status}' is not ACTIVE.`,
      };
    }

    const verification = await this.documentQueryService.getVerificationByDocumentId(doc.id);
    const docVerStatus = verification ? verification.status : 'UNVERIFIED';

    if (docVerStatus !== 'VERIFIED') {
      return {
        factId,
        isValidChain: false,
        provenanceExists: true,
        documentStatus: doc.status,
        documentVerificationStatus: docVerStatus,
        trustScore: doc.trustScore || 0,
        isFresh: true,
        hasBlockingConflict: false,
        validationFailureReason: `Document verification status '${docVerStatus}' is not VERIFIED.`,
      };
    }

    const trustScore = doc.trustScore || 80;
    const conflicts = await this.documentQueryService.getConflictsByUserId(userId);
    const activeConflict = conflicts.find((c) => c.documentId === doc.id && c.factKey === attributeKey && c.status === 'DETECTED');

    return {
      factId,
      isValidChain: !activeConflict && trustScore >= 70,
      provenanceExists: true,
      documentStatus: doc.status,
      documentVerificationStatus: docVerStatus,
      trustScore,
      isFresh: true,
      hasBlockingConflict: !!activeConflict,
      validationFailureReason: activeConflict ? 'Blocking conflict detected on document.' : trustScore < 70 ? 'Trust score below minimum threshold.' : undefined,
    };
  }
}
