import { Inject, Injectable } from '@nestjs/common';
import { DECISION_RE_EVALUATION_REPOSITORY, DECISION_DEPENDENCY_RESOLUTION_SERVICE } from '../../../core/tokens/injection-tokens';
import { IDecisionReEvaluationRepository } from '../repositories/decision-re-evaluation.repository.interface';
import { DependencyResolutionService } from './dependency-resolution.service';
import { ImpactType, ReEvaluationTarget, DecisionImpactDto } from '@gpios/shared';

@Injectable()
export class ImpactAnalysisService {
  constructor(
    @Inject(DECISION_RE_EVALUATION_REPOSITORY) private readonly repo: IDecisionReEvaluationRepository,
    @Inject(DECISION_DEPENDENCY_RESOLUTION_SERVICE) private readonly dependencyService: DependencyResolutionService,
  ) {}

  async analyzeAndPersistImpact(params: {
    reEvaluationId: string;
    userId: string;
    triggerType: string;
    triggerEntityId: string;
    triggerEntityVersion: number;
    sourceEventId: string;
    attributeKey?: string;
    fingerprintSha256: string;
  }): Promise<{ impacts: DecisionImpactDto[]; hasImpact: boolean }> {
    const targets = this.dependencyService.getDownstreamTargets(params.triggerType, params.attributeKey);

    if (targets.length === 0) {
      return { impacts: [], hasImpact: false };
    }

    const impacts: DecisionImpactDto[] = [];
    for (const target of targets) {
      // DB Hardening Constraint B: UNIQUE(sourceEventId, targetType, targetEntityId)
      let existing = await this.repo.findImpactBySourceEvent(params.sourceEventId, target, params.userId);
      if (!existing) {
        existing = await this.repo.createImpact({
          reEvaluationId: params.reEvaluationId,
          userId: params.userId,
          targetType: target,
          targetEntityId: params.userId,
          impactType: params.triggerType === 'POLICY_CHANGED' ? ImpactType.POLICY_CHANGED : ImpactType.FACT_CHANGED,
          severity: 'HIGH',
          sourceFactId: params.triggerEntityId,
          sourceFactVersion: params.triggerEntityVersion,
          sourceEventId: params.sourceEventId,
          dependencyFingerprintSha256: params.fingerprintSha256,
          reason: `Authoritative change in '${params.attributeKey || params.triggerEntityId}' impacts ${target}.`,
          requiresReEvaluation: true,
        });
      }

      impacts.push({
        impactId: existing.id,
        reEvaluationId: existing.reEvaluationId,
        userId: existing.userId,
        targetType: existing.targetType as ReEvaluationTarget,
        targetEntityId: existing.targetEntityId,
        impactType: existing.impactType as ImpactType,
        severity: existing.severity,
        sourceFactId: existing.sourceFactId || undefined,
        sourceFactVersion: existing.sourceFactVersion || undefined,
        sourceEventId: existing.sourceEventId,
        oldDependencyVersion: existing.oldDependencyVersion || undefined,
        newDependencyVersion: existing.newDependencyVersion || undefined,
        dependencyFingerprintSha256: existing.dependencyFingerprintSha256,
        reason: existing.reason,
        requiresReEvaluation: existing.requiresReEvaluation,
        isEvaluated: existing.isEvaluated,
        createdAt: existing.createdAt.toISOString(),
      });
    }

    return { impacts, hasImpact: impacts.length > 0 };
  }
}
