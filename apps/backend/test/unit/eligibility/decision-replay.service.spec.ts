import { describe, it, expect } from 'vitest';
import { DecisionReplayService } from '../../../src/modules/eligibility/services/decision-replay.service';
import { EligibilityStatus } from '@gpios/shared';

describe('DecisionReplayService', () => {
  const mockSnapshotRepo = {
    findById: async () => ({
      id: 'snap-1',
      status: EligibilityStatus.ELIGIBLE,
      decisionTraceId: 'trace-1',
    }),
  };

  const mockTraceRepo = {
    findById: async () => ({
      id: 'trace-1',
      status: EligibilityStatus.ELIGIBLE,
    }),
  };

  const service = new DecisionReplayService(mockTraceRepo as any, mockSnapshotRepo as any);

  it('should replay historical decision and confirm 100% precision match', async () => {
    const replay = await service.replayDecision('snap-1');

    expect(replay.isMatch).toBe(true);
    expect(replay.originalStatus).toBe(EligibilityStatus.ELIGIBLE);
    expect(replay.replayedStatus).toBe(EligibilityStatus.ELIGIBLE);
  });
});
