import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { INotificationRepository } from '../repositories/notification.repository.interface';
import { StandardDomainEventEnvelope } from '@gpios/shared';

export interface MaterialDecisionChangeEventPayload {
  userId: string;
  sourceReEvaluationId: string;
  sourceDecisionDiffId: string;
  sourceEventId: string;
  isMaterial: boolean;
  targetType: string;
  changeType: string;
  changedFields: Record<string, unknown>;
  dependencyFingerprintSha256: string;
  policyId?: string;
  policyVersion?: number;
}

@Injectable()
export class NotificationIngestionService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository,
  ) {}

  async processIngestion(
    event: StandardDomainEventEnvelope<MaterialDecisionChangeEventPayload>,
  ): Promise<{ shouldProcess: boolean; reason?: string }> {
    const payload = event.payload;

    if (!payload.isMaterial) {
      return { shouldProcess: false, reason: 'Decision change is immaterial.' };
    }

    // Persistent Event Deduplication: UNIQUE(sourceEventId, notificationType, userId)
    const existing = await this.repo.findNotificationBySourceEvent(event.eventId, payload.changeType, payload.userId);

    if (existing) {
      return { shouldProcess: false, reason: `Persistent Deduplication: Event '${event.eventId}' already processed.` };
    }

    return { shouldProcess: true };
  }
}
