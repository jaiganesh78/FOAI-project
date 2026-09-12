import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { INotificationRepository } from '../repositories/notification.repository.interface';
import { NotificationChannel, NotificationPriority } from '@gpios/shared';

@Injectable()
export class ChannelResolutionService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository,
  ) {}

  async resolveChannels(params: {
    userId: string;
    priority: NotificationPriority;
    allowedChannels: NotificationChannel[];
    fallbackPrecedence: NotificationChannel[];
  }): Promise<NotificationChannel[]> {
    const activeChannels: NotificationChannel[] = [];

    // Precedence: Priority -> Policy Allowed Channels -> Citizen Preference Status
    const candidateChannels =
      params.priority === NotificationPriority.CRITICAL
        ? [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.SMS, NotificationChannel.EMAIL]
        : params.allowedChannels.length > 0
        ? params.allowedChannels
        : params.fallbackPrecedence;

    for (const channel of candidateChannels) {
      const pref = await this.repo.findPreference(params.userId, channel);
      if (!pref || pref.status !== 'DISABLED') {
        activeChannels.push(channel);
      }
    }

    // Always ensure IN_APP is present as default fallback
    if (!activeChannels.includes(NotificationChannel.IN_APP)) {
      activeChannels.unshift(NotificationChannel.IN_APP);
    }

    return activeChannels;
  }
}
