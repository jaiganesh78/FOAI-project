import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { INotificationRepository } from '../repositories/notification.repository.interface';
import { NotificationStatus, ActionItemStatus } from '@gpios/shared';

@Injectable()
export class SupersessionService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository,
  ) {}

  async processSupersession(params: {
    userId: string;
    sourceReEvaluationId: string;
    newNotificationId: string;
  }): Promise<{ notificationSupersededCount: number; actionItemSupersededCount: number }> {
    const active = await this.repo.findActiveNotificationsForSupersession(params.userId, params.sourceReEvaluationId);
    let notificationSupersededCount = 0;
    let actionItemSupersededCount = 0;

    for (const notif of active) {
      if (notif.id !== params.newNotificationId) {
        // 1. Supersede obsolete Notification
        await this.repo.updateNotificationStatus(notif.id, NotificationStatus.SUPERSEDED, notif.version, {
          supersededByNotificationId: params.newNotificationId,
        });
        notificationSupersededCount++;

        // 2. Action Item Supersession Policy:
        // Completed (COMPLETED), Dismissed (DISMISSED), and Expired (EXPIRED) action items are 100% IMMUNE.
        // Non-terminal action items (PENDING, VIEWED, ACKNOWLEDGED, ACTION_REQUIRED, DISMISSAL_REQUESTED) transition to SUPERSEDED.
        if (notif.actionItemId) {
          const actionItem = await this.repo.findActionItemById(notif.actionItemId);
          if (
            actionItem &&
            actionItem.status !== ActionItemStatus.COMPLETED &&
            actionItem.status !== ActionItemStatus.DISMISSED &&
            actionItem.status !== ActionItemStatus.EXPIRED &&
            actionItem.status !== ActionItemStatus.SUPERSEDED
          ) {
            await this.repo.updateActionItemStatus(actionItem.id, ActionItemStatus.SUPERSEDED, actionItem.version);
            actionItemSupersededCount++;
          }
        }
      }
    }

    return { notificationSupersededCount, actionItemSupersededCount };
  }
}
