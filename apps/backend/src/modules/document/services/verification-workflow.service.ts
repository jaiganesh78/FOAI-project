import { Inject, Injectable } from '@nestjs/common';
import { VERIFICATION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IVerificationRepository } from '../repositories/verification.repository.interface';
import { DocumentVerificationStatus, VerificationMethod } from '@gpios/shared';

@Injectable()
export class VerificationWorkflowService {
  constructor(@Inject(VERIFICATION_REPOSITORY) private readonly verificationRepo: IVerificationRepository) {}

  async startVerification(documentId: string, userId: string, method: VerificationMethod, actorCode = 'ACTOR_DIGILOCKER_API') {
    const actor = await this.verificationRepo.findActorByCode(actorCode);
    const actorName = actor ? actor.name : 'System OCR Engine';

    const verification = await this.verificationRepo.createVerification({
      documentId,
      userId,
      status: DocumentVerificationStatus.IN_PROGRESS,
      method,
      verifiedBy: actorName,
    });

    await this.verificationRepo.addStep(verification.id, 'INITIATE_VERIFICATION', actorName, 'SUCCESS', { method });
    return verification;
  }

  async completeVerification(verificationId: string, status: DocumentVerificationStatus, notes?: string) {
    const verification = await this.verificationRepo.updateStatus(verificationId, status, notes);
    await this.verificationRepo.addStep(verification.id, 'COMPLETE_VERIFICATION', verification.verifiedBy, status, { notes });
    return verification;
  }
}
