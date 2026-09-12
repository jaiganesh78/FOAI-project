import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CONFLICT_REPOSITORY, CITIZEN_FACT_REPOSITORY, CITIZEN_PROFILE_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IConflictRepository } from '../repositories/conflict.repository.interface';
import { ICitizenFactRepository } from '../../citizen/repositories/citizen-fact.repository.interface';
import { ICitizenProfileRepository } from '../../citizen/repositories/citizen-profile.repository.interface';
import { ConflictResolutionType, ConflictStatus } from '@gpios/shared';

@Injectable()
export class FactReconciliationService {
  constructor(
    @Inject(CONFLICT_REPOSITORY) private readonly conflictRepo: IConflictRepository,
    @Inject(CITIZEN_FACT_REPOSITORY) private readonly citizenFactRepo: ICitizenFactRepository,
    @Inject(CITIZEN_PROFILE_REPOSITORY) private readonly citizenProfileRepo: ICitizenProfileRepository,
  ) {}

  async reconcileConflict(params: {
    conflictId: string;
    resolutionType: ConflictResolutionType;
    overrideValue?: unknown;
    reconciledBy: string;
  }) {
    const conflict = await this.conflictRepo.findById(params.conflictId);
    if (!conflict) throw new NotFoundException(`Conflict '${params.conflictId}' not found.`);

    let finalValue = conflict.extractedValue;
    if (params.resolutionType === ConflictResolutionType.ACCEPT_CITIZEN_DECLARATION) {
      finalValue = conflict.declaredValue;
    } else if (params.resolutionType === ConflictResolutionType.MANUAL_OVERRIDE && params.overrideValue !== undefined) {
      finalValue = params.overrideValue;
    }

    const reconciliation = await this.conflictRepo.createReconciliation({
      conflictId: conflict.id,
      documentId: conflict.documentId,
      userId: conflict.userId,
      factKey: conflict.factKey,
      resolutionType: params.resolutionType,
      finalValue,
      reconciledBy: params.reconciledBy,
    });

    await this.conflictRepo.updateStatus(conflict.id, ConflictStatus.RESOLVED);

    // Update Citizen Profile Fact (Sprint 2 integration)
    const profile = await this.citizenProfileRepo.findByUserId(conflict.userId);
    if (profile) {
      const targetFact = await this.citizenFactRepo.findByProfileAndKey(profile.id, conflict.factKey);
      if (targetFact) {
        let valueNumber: number | null = null;
        let valueText: string | null = null;
        if (typeof finalValue === 'number') valueNumber = finalValue;
        else if (typeof finalValue === 'string') valueText = finalValue;

        await this.citizenFactRepo.updateFact(targetFact.id, {
          valueNumber,
          valueText,
          valueJson: typeof finalValue === 'object' ? (finalValue as any) : undefined,
          verificationStatus: 'DOCUMENT_VERIFIED' as any,
          changeReason: `Reconciled via Document Platform (${params.resolutionType})`,
          changedBy: params.reconciledBy,
        });
      }
    }

    return reconciliation;
  }
}
