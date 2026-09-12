import {
  Notification,
  NotificationDelivery,
  NotificationDeliveryAttempt,
  CitizenActionItem,
  NotificationTemplateVersion,
  NotificationPolicyVersion,
  NotificationPreference,
  NotificationSuppression,
  NotificationOutbox,
} from '@prisma/client';

export interface INotificationRepository {
  findNotificationByIdempotencyKey(userId: string, idempotencyKey: string): Promise<Notification | null>;
  findNotificationBySourceEvent(sourceEventId: string, notificationType: string, userId: string): Promise<Notification | null>;
  findNotificationById(id: string): Promise<Notification | null>;
  findNotificationsByUserId(userId: string, options?: { cursor?: string; limit?: number; status?: string }): Promise<Notification[]>;

  createNotification(data: {
    userId: string;
    notificationType: string;
    title: string;
    body: string;
    priority?: string;
    actionItemId?: string;
    sourceReEvaluationId: string;
    sourceDecisionDiffId: string;
    sourceEventId: string;
    templateId: string;
    templateVersion: number;
    policyId: string;
    policyVersion: number;
    policyChecksumSha256: string;
    dependencyFingerprintSha256: string;
    checksumSha256: string;
    idempotencyKey: string;
    // DEF-003 FIX: Original template parameters for deterministic replay
    templateParameters?: Record<string, unknown>;
  }): Promise<Notification>;

  updateNotificationStatus(
    id: string,
    status: string,
    expectedVersion?: number,
    extra?: { readAt?: Date; supersededByNotificationId?: string },
  ): Promise<Notification>;

  createDelivery(data: {
    notificationId: string;
    userId: string;
    channel: string;
    deliveryIdempotencyKey: string;
    scheduledAt?: Date;
  }): Promise<NotificationDelivery>;

  findDeliveriesByNotificationId(notificationId: string): Promise<NotificationDelivery[]>;

  acquireDeliveryLease(deliveryId: string, workerId: string, leaseDurationMs: number): Promise<NotificationDelivery | null>;

  updateDeliveryStatus(
    deliveryId: string,
    status: string,
    expectedVersion?: number,
    extra?: {
      providerName?: string;
      deliveredAt?: Date;
      failureReason?: string;
      failureCategory?: string;
      retryCount?: number;
      // DEF-006 FIX: Next eligible retry timestamp for backoff scheduling
      nextRetryAt?: Date;
    },
  ): Promise<NotificationDelivery>;

  createDeliveryAttempt(data: {
    deliveryId: string;
    notificationId: string;
    channel: string;
    providerName: string;
    status: string;
    attemptNumber: number;
    errorMessage?: string;
    errorCode?: string;
    failureCategory?: string;
    durationMs: number;
    providerMessageId?: string;
    requestPayloadSanitized?: unknown;
    responsePayloadSanitized?: unknown;
  }): Promise<NotificationDeliveryAttempt>;

  findActionItemByIdempotencyKey(userId: string, idempotencyKey: string): Promise<CitizenActionItem | null>;
  findActionItemById(id: string): Promise<CitizenActionItem | null>;
  findActionItemsByUserId(userId: string, options?: { cursor?: string; limit?: number; status?: string }): Promise<CitizenActionItem[]>;

  createActionItem(data: {
    userId: string;
    actionType: string;
    title: string;
    description: string;
    priority?: string;
    targetUrl: string;
    deadline?: Date;
    sourceEntityId: string;
    idempotencyKey: string;
  }): Promise<CitizenActionItem>;

  updateActionItemStatus(
    id: string,
    status: string,
    expectedVersion?: number,
    extra?: { completedAt?: Date; dismissedAt?: Date },
  ): Promise<CitizenActionItem>;

  findActiveTemplateVersion(templateId: string, version: number, locale: string): Promise<NotificationTemplateVersion | null>;
  createTemplateVersion(data: {
    templateId: string;
    version: number;
    locale: string;
    titleTemplate: string;
    bodyTemplate: string;
    actionUrlTemplate?: string;
    checksumSha256: string;
    createdBy: string;
  }): Promise<NotificationTemplateVersion>;

  findActivePolicyVersion(policyId: string, version: number): Promise<NotificationPolicyVersion | null>;
  createPolicyVersion(data: {
    policyId: string;
    version: number;
    minMaterialityLevel: string;
    cooldownWindowSeconds: number;
    maxPerWindow: number;
    allowedChannels: unknown;
    fallbackPrecedence: unknown;
    checksumSha256: string;
    activatedBy: string;
  }): Promise<NotificationPolicyVersion>;

  findPreference(userId: string, channel: string): Promise<NotificationPreference | null>;
  upsertPreference(data: {
    userId: string;
    channel: string;
    status: string;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    timezone?: string;
    categoryOverrides?: unknown;
  }): Promise<NotificationPreference>;

  createSuppression(data: {
    userId: string;
    sourceEventId: string;
    sourceDecisionDiffId: string;
    notificationType: string;
    suppressionReason: string;
    policyId: string;
    policyVersion: number;
    policyChecksumSha256: string;
    originalEvaluationTime?: Date;
    nextEligibleDeliveryTime?: Date;
  }): Promise<NotificationSuppression>;

  createOutboxEntry(data: {
    eventId: string;
    eventType: string;
    payload: unknown;
  }): Promise<NotificationOutbox>;

  acquireOutboxLease(outboxId: string, workerId: string, leaseDurationMs: number): Promise<NotificationOutbox | null>;
  updateOutboxStatus(outboxId: string, status: string, errorMessage?: string): Promise<NotificationOutbox>;

  findActiveNotificationsForSupersession(userId: string, sourceReEvaluationId: string): Promise<Notification[]>;
}
