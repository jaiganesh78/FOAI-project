import { Injectable } from '@nestjs/common';
import { ReconciliationStatus } from '@gpios/shared';

@Injectable()
export class FactReconciliationWorkflowService {
  private readonly validTransitions: Record<ReconciliationStatus, ReconciliationStatus[]> = {
    [ReconciliationStatus.DETECTED]: [ReconciliationStatus.CLASSIFIED],
    [ReconciliationStatus.CLASSIFIED]: [ReconciliationStatus.EVIDENCE_VALIDATED],
    [ReconciliationStatus.EVIDENCE_VALIDATED]: [ReconciliationStatus.POLICY_EVALUATED],
    [ReconciliationStatus.POLICY_EVALUATED]: [ReconciliationStatus.RESOLUTION_SELECTED],
    [ReconciliationStatus.RESOLUTION_SELECTED]: [ReconciliationStatus.CANONICAL_FACT_UPDATED],
    [ReconciliationStatus.CANONICAL_FACT_UPDATED]: [ReconciliationStatus.IMPACT_CALCULATED],
    [ReconciliationStatus.IMPACT_CALCULATED]: [ReconciliationStatus.SNAPSHOT_CREATED],
    [ReconciliationStatus.SNAPSHOT_CREATED]: [ReconciliationStatus.EVENT_OUTBOX_COMMITTED],
    [ReconciliationStatus.EVENT_OUTBOX_COMMITTED]: [],
  };

  validateTransition(from: ReconciliationStatus, to: ReconciliationStatus): boolean {
    const allowed = this.validTransitions[from] || [];
    return allowed.includes(to);
  }
}
