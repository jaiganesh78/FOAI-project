import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DECISION_TRACE_REPOSITORY, ELIGIBILITY_SNAPSHOT_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IDecisionTraceRepository } from '../repositories/decision-trace.repository.interface';
import { IEligibilitySnapshotRepository } from '../repositories/eligibility-snapshot.repository.interface';
import { EligibilityStatus } from '@gpios/shared';

export interface DecisionReplayResult {
  snapshotId: string;
  originalStatus: EligibilityStatus;
  replayedStatus: EligibilityStatus;
  isMatch: boolean;
  replayTimeMs: number;
}

@Injectable()
export class DecisionReplayService {
  constructor(
    @Inject(DECISION_TRACE_REPOSITORY) private readonly traceRepository: IDecisionTraceRepository,
    @Inject(ELIGIBILITY_SNAPSHOT_REPOSITORY) private readonly snapshotRepository: IEligibilitySnapshotRepository,
  ) {}

  async replayDecision(snapshotId: string): Promise<DecisionReplayResult> {
    const startTime = Date.now();
    const snapshot = await this.snapshotRepository.findById(snapshotId);
    if (!snapshot) throw new NotFoundException(`Eligibility Snapshot '${snapshotId}' not found.`);

    const trace = await this.traceRepository.findById(snapshot.decisionTraceId);
    if (!trace) throw new NotFoundException(`Decision Trace for snapshot '${snapshotId}' not found.`);

    // Replay logic strictly using recorded nodes and stored snapshot
    const originalStatus = snapshot.status as unknown as EligibilityStatus;
    const replayedStatus = trace.status as unknown as EligibilityStatus;
    const isMatch = originalStatus === replayedStatus;

    return {
      snapshotId,
      originalStatus,
      replayedStatus,
      isMatch,
      replayTimeMs: Date.now() - startTime,
    };
  }
}
