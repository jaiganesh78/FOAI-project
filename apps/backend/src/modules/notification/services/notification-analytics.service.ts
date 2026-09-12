import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { INotificationRepository } from '../repositories/notification.repository.interface';

@Injectable()
export class NotificationAnalyticsService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository,
  ) {}

  async getAnalytics(userId: string): Promise<Record<string, unknown>> {
    const notifications = await this.repo.findNotificationsByUserId(userId, { limit: 100 });
    const actionItems = await this.repo.findActionItemsByUserId(userId, { limit: 100 });

    const totalCreated = notifications.length;
    const totalDelivered = notifications.filter((n) => n.status === 'DELIVERED' || n.status === 'READ').length;
    const totalSuppressed = notifications.filter((n) => n.status === 'SUPPRESSED').length;
    const totalSuperseded = notifications.filter((n) => n.status === 'SUPERSEDED').length;

    const actionsCompleted = actionItems.filter((a) => a.status === 'COMPLETED').length;
    const actionsPending = actionItems.filter((a) => a.status === 'PENDING' || a.status === 'ACTION_REQUIRED').length;

    return {
      totalCreated,
      totalDelivered,
      totalSuppressed,
      totalSuperseded,
      actionsCompleted,
      actionsPending,
      deliverySuccessRate: totalCreated > 0 ? (totalDelivered / totalCreated) * 100 : 100,
    };
  }
}
