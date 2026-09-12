import { Inject, Injectable } from '@nestjs/common';
import { DECISION_RE_EVALUATION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IDecisionReEvaluationRepository } from '../repositories/decision-re-evaluation.repository.interface';
import { StaleStateDto, ReEvaluationTarget } from '@gpios/shared';

@Injectable()
export class StaleStateService {
  constructor(
    @Inject(DECISION_RE_EVALUATION_REPOSITORY) private readonly repo: IDecisionReEvaluationRepository,
  ) {}

  async markStale(params: {
    userId: string;
    targetType: ReEvaluationTarget;
    targetEntityId: string;
    dependencyId: string;
    oldDependencyVersion: number;
    currentDependencyVersion: number;
    dependencyFingerprintSha256: string;
    staleReason: string;
    reEvaluationId?: string;
  }): Promise<StaleStateDto> {
    const stale = await this.repo.upsertStaleState(params);
    return {
      staleId: stale.id,
      userId: stale.userId,
      targetType: stale.targetType as ReEvaluationTarget,
      targetEntityId: stale.targetEntityId,
      dependencyId: stale.dependencyId,
      oldDependencyVersion: stale.oldDependencyVersion,
      currentDependencyVersion: stale.currentDependencyVersion,
      dependencyFingerprintSha256: stale.dependencyFingerprintSha256,
      staleReason: stale.staleReason,
      status: stale.status as 'STALE' | 'CLEARED',
      reEvaluationId: stale.reEvaluationId || undefined,
      staleAt: stale.staleAt.toISOString(),
      clearedAt: stale.clearedAt ? stale.clearedAt.toISOString() : undefined,
    };
  }

  async conditionalClear(params: {
    userId: string;
    targetType: ReEvaluationTarget;
    targetEntityId: string;
    dependencyFingerprintSha256: string;
    reEvaluationId: string;
  }): Promise<boolean> {
    // CAS Hardening Rule 3: Clears stale marker ONLY IF evaluation fingerprint matches canonical fingerprint!
    return this.repo.conditionalClearStaleState(
      params.userId,
      params.targetType,
      params.targetEntityId,
      params.dependencyFingerprintSha256,
      params.reEvaluationId,
    );
  }

  async getActiveStaleStates(userId: string): Promise<StaleStateDto[]> {
    const list = await this.repo.findActiveStaleStates(userId);
    return list.map((s) => ({
      staleId: s.id,
      userId: s.userId,
      targetType: s.targetType as ReEvaluationTarget,
      targetEntityId: s.targetEntityId,
      dependencyId: s.dependencyId,
      oldDependencyVersion: s.oldDependencyVersion,
      currentDependencyVersion: s.currentDependencyVersion,
      dependencyFingerprintSha256: s.dependencyFingerprintSha256,
      staleReason: s.staleReason,
      status: s.status as 'STALE' | 'CLEARED',
      reEvaluationId: s.reEvaluationId || undefined,
      staleAt: s.staleAt.toISOString(),
      clearedAt: s.clearedAt ? s.clearedAt.toISOString() : undefined,
    }));
  }
}
