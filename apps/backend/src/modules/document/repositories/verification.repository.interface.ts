import { Verification, VerificationStep, VerificationActor } from '@prisma/client';
import { DocumentVerificationStatus, VerificationMethod } from '@gpios/shared';

export type VerificationWithDetails = Verification & {
  steps: VerificationStep[];
};

export interface IVerificationRepository {
  createVerification(data: {
    documentId: string;
    userId: string;
    status: DocumentVerificationStatus;
    method: VerificationMethod;
    verifiedBy: string;
    notes?: string;
  }): Promise<VerificationWithDetails>;

  findById(id: string): Promise<VerificationWithDetails | null>;
  findByDocumentId(documentId: string): Promise<VerificationWithDetails | null>;
  updateStatus(id: string, status: DocumentVerificationStatus, notes?: string): Promise<VerificationWithDetails>;
  addStep(verificationId: string, stepName: string, actorName: string, status: string, details?: Record<string, unknown>): Promise<VerificationStep>;
  findActorByCode(actorCode: string): Promise<VerificationActor | null>;
}
