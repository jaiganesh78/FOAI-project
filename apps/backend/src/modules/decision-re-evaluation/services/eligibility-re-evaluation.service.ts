import { Inject, Injectable } from '@nestjs/common';
import { ELIGIBILITY_EVALUATION_ORCHESTRATOR, ELIGIBILITY_QUERY_SERVICE } from '../../../core/tokens/injection-tokens';
import { EligibilityEvaluationOrchestrator } from '../../eligibility/services/eligibility-evaluation.orchestrator';
import { EligibilityQueryService } from '../../eligibility/services/eligibility-query.service';
import { EligibilitySnapshotDto } from '@gpios/shared';

@Injectable()
export class EligibilityReEvaluationService {
  constructor(
    @Inject(ELIGIBILITY_EVALUATION_ORCHESTRATOR) private readonly orchestrator: EligibilityEvaluationOrchestrator,
    @Inject(ELIGIBILITY_QUERY_SERVICE) private readonly queryService: EligibilityQueryService,
  ) {}

  async getLatestState(userId: string): Promise<Record<string, unknown> | null> {
    const snap = await this.queryService.getLatestSnapshot(userId);
    return snap ? (snap as unknown as Record<string, unknown>) : null;
  }

  async execute(userId: string): Promise<EligibilitySnapshotDto> {
    return this.orchestrator.evaluateEligibility(userId);
  }
}
