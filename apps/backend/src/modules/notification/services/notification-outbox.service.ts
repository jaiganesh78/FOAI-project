import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY,
  IN_APP_CHANNEL_ADAPTER,
  EMAIL_CHANNEL_ADAPTER,
  SMS_CHANNEL_ADAPTER,
  PUSH_CHANNEL_ADAPTER,
} from '../../../core/tokens/injection-tokens';
import { INotificationRepository } from '../repositories/notification.repository.interface';
import { InAppChannelAdapter } from './adapters/in-app-channel.adapter';
import { EmailChannelAdapter } from './adapters/email-channel.adapter';
import { SmsChannelAdapter } from './adapters/sms-channel.adapter';
import { PushChannelAdapter } from './adapters/push-channel.adapter';
import { DeliveryStatus, DeliveryAttemptStatus, FailureCategory, NotificationChannel, NotificationPriority } from '@gpios/shared';

/**
 * DEF-006 FIX: Exponential backoff schedule for delivery retries.
 *
 * Backoff delays in milliseconds indexed by retryCount (0-indexed: first retry uses index 0).
 * retryCount 0 → attempt 1 (initial) → if fails → nextRetryAt +5s
 * retryCount 1 → attempt 2          → if fails → nextRetryAt +15s
 * retryCount 2 → attempt 3          → if fails → nextRetryAt +45s
 * retryCount 3 → attempt 4          → if fails → nextRetryAt +135s
 * retryCount 4 → attempt 5          → if fails → nextRetryAt +405s
 * retryCount 5 → maxRetries reached → PERMANENT_FAILURE (no nextRetryAt)
 */
export const RETRY_BACKOFF_MS: readonly number[] = [5_000, 15_000, 45_000, 135_000, 405_000];

/**
 * Calculate the next retry timestamp based on the current retry count.
 * Returns null when maxRetries would be exceeded (permanent failure territory).
 */
export function calculateNextRetryAt(retryCount: number, maxRetries: number): Date | null {
  if (retryCount >= maxRetries) return null; // No more retries // No more retries
  const delayMs = RETRY_BACKOFF_MS[retryCount] ?? RETRY_BACKOFF_MS[RETRY_BACKOFF_MS.length - 1];
  return new Date(Date.now() + delayMs);
}

@Injectable()
export class NotificationOutboxService {
  private readonly logger = new Logger(NotificationOutboxService.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository,
    @Inject(IN_APP_CHANNEL_ADAPTER) private readonly inAppAdapter: InAppChannelAdapter,
    @Inject(EMAIL_CHANNEL_ADAPTER) private readonly emailAdapter: EmailChannelAdapter,
    @Inject(SMS_CHANNEL_ADAPTER) private readonly smsAdapter: SmsChannelAdapter,
    @Inject(PUSH_CHANNEL_ADAPTER) private readonly pushAdapter: PushChannelAdapter,
  ) {}

  async processDelivery(deliveryId: string, workerId = 'outbox-worker-1'): Promise<DeliveryStatus> {
    const delivery = await this.repo.acquireDeliveryLease(deliveryId, workerId, 30000); // 30s lease
    if (!delivery) {
      this.logger.warn(`Could not acquire lease for Delivery '${deliveryId}'. Skipped or leased by another worker.`);
      return DeliveryStatus.LEASED;
    }

    // DEF-006 FIX: Check nextRetryAt — do not process if scheduled retry time has not elapsed.
    // A worker polling RETRY_SCHEDULED deliveries must honour the nextRetryAt timestamp.
    const nextRetryAt = (delivery as unknown as { nextRetryAt?: Date | null }).nextRetryAt;
    if (nextRetryAt && nextRetryAt > new Date()) {
      this.logger.log(
        `Delivery '${deliveryId}' retry scheduled at ${nextRetryAt.toISOString()}, skipping (not yet eligible).`,
      );
      // Release the lease back to RETRY_SCHEDULED (revert lease) so another worker can reclaim after expiry
      await this.repo.updateDeliveryStatus(deliveryId, DeliveryStatus.RETRY_SCHEDULED, delivery.version, {
        nextRetryAt,
        retryCount: delivery.retryCount,
      });
      return DeliveryStatus.RETRY_SCHEDULED;
    }

    const notification = await this.repo.findNotificationById(delivery.notificationId);
    if (!notification) {
      await this.repo.updateDeliveryStatus(deliveryId, DeliveryStatus.PERMANENT_FAILURE, delivery.version, {
        failureReason: 'Parent Notification record missing.',
        failureCategory: FailureCategory.PERMANENT,
      });
      return DeliveryStatus.PERMANENT_FAILURE;
    }

    const attemptNumber = delivery.retryCount + 1;
    const channel = delivery.channel as NotificationChannel;

    // Outbound API calls run strictly OUTSIDE database transactions!
    let adapterResult;
    try {
      const msgPayload = {
        notificationId: notification.id,
        deliveryId: delivery.id,
        recipientUserId: notification.userId,
        channel,
        title: notification.title,
        body: notification.body,
        priority: notification.priority as NotificationPriority,
        deliveryIdempotencyKey: delivery.deliveryIdempotencyKey,
      };
      const metadata = { sourceEventId: notification.sourceEventId };

      if (channel === NotificationChannel.IN_APP) {
        adapterResult = await this.inAppAdapter.send(msgPayload, metadata);
      } else if (channel === NotificationChannel.EMAIL) {
        adapterResult = await this.emailAdapter.send(msgPayload, metadata);
      } else if (channel === NotificationChannel.SMS) {
        adapterResult = await this.smsAdapter.send(msgPayload, metadata);
      } else {
        adapterResult = await this.pushAdapter.send(msgPayload, metadata);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      adapterResult = {
        success: false,
        providerStatus: 'FAILED',
        acceptedAt: new Date(),
        retryable: true,
        failureCategory: FailureCategory.TRANSIENT,
        errorMessage: errorMsg,
        durationMs: 50,
        providerName: `${channel}Adapter`,
      };
    }

    // Persist delivery attempt log
    await this.repo.createDeliveryAttempt({
      deliveryId: delivery.id,
      notificationId: notification.id,
      channel: delivery.channel,
      providerName: adapterResult.providerName,
      status: adapterResult.success ? DeliveryAttemptStatus.SUCCEEDED : DeliveryAttemptStatus.FAILED,
      attemptNumber,
      errorMessage: adapterResult.failureCategory ? adapterResult.providerStatus : undefined,
      failureCategory: adapterResult.failureCategory,
      durationMs: adapterResult.durationMs,
      providerMessageId: adapterResult.providerMessageId,
      requestPayloadSanitized: { recipient: notification.userId, channel },
      responsePayloadSanitized: adapterResult.providerResponseMetadataSanitized,
    });

    if (adapterResult.success) {
      await this.repo.updateDeliveryStatus(delivery.id, DeliveryStatus.SUCCEEDED, delivery.version, {
        providerName: adapterResult.providerName,
        deliveredAt: new Date(),
      });
      return DeliveryStatus.SUCCEEDED;
    } else {
      const isRetryable = adapterResult.retryable && delivery.retryCount < delivery.maxRetries;
      const nextStatus = isRetryable ? DeliveryStatus.RETRY_SCHEDULED : DeliveryStatus.PERMANENT_FAILURE;

      // DEF-006 FIX: Calculate and persist nextRetryAt for exponential backoff scheduling
      const computedNextRetryAt = isRetryable
        ? calculateNextRetryAt(delivery.retryCount, delivery.maxRetries)
        : null;

      await this.repo.updateDeliveryStatus(delivery.id, nextStatus, delivery.version, {
        failureReason: adapterResult.failureCategory || 'Outbound provider error',
        failureCategory: adapterResult.failureCategory,
        retryCount: delivery.retryCount + 1,
        ...(computedNextRetryAt ? { nextRetryAt: computedNextRetryAt } : {}),
      });

      if (isRetryable && computedNextRetryAt) {
        this.logger.log(
          `Delivery '${deliveryId}' scheduled for retry ${delivery.retryCount + 1}/${delivery.maxRetries} ` +
          `at ${computedNextRetryAt.toISOString()} (backoff: ${RETRY_BACKOFF_MS[delivery.retryCount]}ms).`,
        );
      }

      return nextStatus;
    }
  }
}
