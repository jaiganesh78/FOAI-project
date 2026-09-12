import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { DECISION_RE_EVALUATION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IDecisionReEvaluationRepository } from '../repositories/decision-re-evaluation.repository.interface';
import { ReEvaluationReplayDto } from '@gpios/shared';
import { createHash } from 'crypto';

@Injectable()
export class ReEvaluationReplayService {
  constructor(
    @Inject(DECISION_RE_EVALUATION_REPOSITORY) private readonly repo: IDecisionReEvaluationRepository,
  ) {}

  computeSnapshotChecksum(data: unknown): string {
    return createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  async replayRun(reEvaluationId: string): Promise<ReEvaluationReplayDto> {
    const job = await this.repo.findJobById(reEvaluationId);
    if (!job) {
      throw new BadRequestException(`Re-evaluation Job '${reEvaluationId}' not found.`);
    }

    const snapshots = await this.repo.findSnapshotsByJob(reEvaluationId);
    if (!snapshots || snapshots.length === 0) {
      throw new BadRequestException(`No state snapshots found for re-evaluation job '${reEvaluationId}'.`);
    }

    const beforeSnap = snapshots.find((s) => s.snapshotType === 'BEFORE');
    const afterSnap = snapshots.find((s) => s.snapshotType === 'AFTER');

    if (!afterSnap) {
      throw new BadRequestException(`No AFTER snapshot found for re-evaluation job '${reEvaluationId}'.`);
    }

    // Replay Hardening Rule 11: Validate SHA-256 checksums on stored snapshot data strictly (ignoring live state)
    const calculatedChecksum = this.computeSnapshotChecksum(afterSnap.snapshotData);

    if (calculatedChecksum !== afterSnap.checksumSha256) {
      throw new BadRequestException(
        `LOUD REPLAY CHECKSUM FAILURE: Snapshot SHA-256 mismatch for job '${reEvaluationId}'! Stored: ${afterSnap.checksumSha256}, Calculated: ${calculatedChecksum}. Snapshot integrity corrupted.`,
      );
    }

    return {
      isVerified: true,
      originalChecksum: afterSnap.checksumSha256,
      replayChecksum: calculatedChecksum,
      isMatch: true,
      snapshot: {
        reEvaluationId: job.id,
        status: job.status,
        triggerType: job.triggerType,
        dependencyFingerprintSha256: job.dependencyFingerprintSha256,
        beforeState: beforeSnap ? beforeSnap.snapshotData : null,
        afterState: afterSnap.snapshotData,
      },
    };
  }
}
