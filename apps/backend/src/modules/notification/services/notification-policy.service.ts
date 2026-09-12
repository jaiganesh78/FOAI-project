import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { INotificationRepository } from '../repositories/notification.repository.interface';
import { NotificationPriority, NotificationChannel, SuppressionReason } from '@gpios/shared';

@Injectable()
export class NotificationPolicyService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository,
  ) {}

  isQuietHoursActive(quietStart?: string | null, quietEnd?: string | null, _timezone = 'Asia/Kolkata'): boolean {
    if (!quietStart || !quietEnd) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = quietStart.split(':').map(Number);
    const [endH, endM] = quietEnd.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes > endMinutes) {
      // Overnight interval (e.g. 22:00 to 07:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  async evaluatePolicy(params: {
    userId: string;
    notificationType: string;
    isMaterial: boolean;
    priority?: NotificationPriority;
    policyId?: string;
    policyVersion?: number;
    sourceEventId: string;
    sourceDecisionDiffId: string;
  }): Promise<{
    allowed: boolean;
    suppressionReason?: SuppressionReason;
    policyId: string;
    policyVersion: number;
    policyChecksumSha256: string;
    allowedChannels: NotificationChannel[];
    fallbackPrecedence: NotificationChannel[];
    nextEligibleDeliveryTime?: Date;
  }> {
    const policyId = params.policyId || 'pol-notification-default';
    const version = params.policyVersion || 1;

    const pol = await this.repo.findActivePolicyVersion(policyId, version);
    const polChecksum = pol ? pol.checksumSha256 : 'default-policy-checksum-sha';

    // Check 1: Materiality Sufficiency Check
    if (!params.isMaterial) {
      await this.repo.createSuppression({
        userId: params.userId,
        sourceEventId: params.sourceEventId,
        sourceDecisionDiffId: params.sourceDecisionDiffId,
        notificationType: params.notificationType,
        suppressionReason: SuppressionReason.IMMATERIAL_CHANGE,
        policyId,
        policyVersion: version,
        policyChecksumSha256: polChecksum,
      });
      return {
        allowed: false,
        suppressionReason: SuppressionReason.IMMATERIAL_CHANGE,
        policyId,
        policyVersion: version,
        policyChecksumSha256: polChecksum,
        allowedChannels: [],
        fallbackPrecedence: [],
      };
    }

    // Check 2: Timezone Quiet Hours Check (Non-critical bypass)
    const priority = params.priority || NotificationPriority.MEDIUM;
    const pref = await this.repo.findPreference(params.userId, 'IN_APP');
    const isQuiet = this.isQuietHoursActive(pref?.quietHoursStart, pref?.quietHoursEnd, pref?.timezone);

    if (isQuiet && priority !== NotificationPriority.CRITICAL) {
      const nextEligible = new Date();
      nextEligible.setHours(7, 1, 0, 0); // Rescheduled to 07:01 next morning

      await this.repo.createSuppression({
        userId: params.userId,
        sourceEventId: params.sourceEventId,
        sourceDecisionDiffId: params.sourceDecisionDiffId,
        notificationType: params.notificationType,
        suppressionReason: SuppressionReason.QUIET_HOURS_ACTIVE,
        policyId,
        policyVersion: version,
        policyChecksumSha256: polChecksum,
        originalEvaluationTime: new Date(),
        nextEligibleDeliveryTime: nextEligible,
      });

      return {
        allowed: false,
        suppressionReason: SuppressionReason.QUIET_HOURS_ACTIVE,
        policyId,
        policyVersion: version,
        policyChecksumSha256: polChecksum,
        allowedChannels: [],
        fallbackPrecedence: [],
        nextEligibleDeliveryTime: nextEligible,
      };
    }

    const allowedChannels = pol
      ? (pol.allowedChannels as NotificationChannel[])
      : [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.EMAIL];
    const fallbackPrecedence = pol
      ? (pol.fallbackPrecedence as NotificationChannel[])
      : [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.EMAIL, NotificationChannel.SMS];

    return {
      allowed: true,
      policyId,
      policyVersion: version,
      policyChecksumSha256: polChecksum,
      allowedChannels,
      fallbackPrecedence,
    };
  }
}
