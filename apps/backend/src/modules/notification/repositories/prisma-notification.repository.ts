import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { INotificationRepository } from './notification.repository.interface';
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
  Prisma,
} from '@prisma/client';

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findNotificationByIdempotencyKey(userId: string, idempotencyKey: string): Promise<Notification | null> {
    return this.prisma.notification.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      include: { deliveries: true },
    });
  }

  async findNotificationBySourceEvent(sourceEventId: string, notificationType: string, userId: string): Promise<Notification | null> {
    return this.prisma.notification.findUnique({
      where: { sourceEventId_notificationType_userId: { sourceEventId, notificationType, userId } },
      include: { deliveries: true },
    });
  }

  async findNotificationById(id: string): Promise<Notification | null> {
    return this.prisma.notification.findUnique({
      where: { id },
      include: { deliveries: true, attempts: true },
    });
  }

  async findNotificationsByUserId(
    userId: string,
    options?: { cursor?: string; limit?: number; status?: string },
  ): Promise<Notification[]> {
    const limit = Math.min(options?.limit || 20, 100);
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(options?.status ? { status: options.status } : {}),
      },
      take: limit,
      ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { deliveries: true },
    });
  }

  async createNotification(data: {
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
    templateParameters?: Record<string, unknown>;
  }): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        notificationType: data.notificationType,
        title: data.title,
        body: data.body,
        priority: data.priority || 'MEDIUM',
        actionItemId: data.actionItemId,
        sourceReEvaluationId: data.sourceReEvaluationId,
        sourceDecisionDiffId: data.sourceDecisionDiffId,
        sourceEventId: data.sourceEventId,
        templateId: data.templateId,
        templateVersion: data.templateVersion,
        policyId: data.policyId,
        policyVersion: data.policyVersion,
        policyChecksumSha256: data.policyChecksumSha256,
        dependencyFingerprintSha256: data.dependencyFingerprintSha256,
        checksumSha256: data.checksumSha256,
        idempotencyKey: data.idempotencyKey,
        status: 'CREATED',
        // DEF-003 FIX: Store original template parameters to support deterministic replay
        templateParameters: data.templateParameters !== undefined
          ? (data.templateParameters as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  }

  /**
   * DEF-002 FIX: Atomic CAS update using updateMany with WHERE version guard.
   *
   * Previous implementation performed findUnique + update as two separate operations
   * (TOCTOU race). Two concurrent callers with the same expectedVersion could both
   * pass the findUnique check and both proceed to update — the last writer would win
   * silently overwriting the first writer's state change.
   *
   * Fix: Use updateMany with WHERE id=? AND version=expectedVersion.
   * If count=0, the version has been concurrently modified — throw ConflictException.
   * This is atomic at the database level with a single round-trip.
   */
  async updateNotificationStatus(
    id: string,
    status: string,
    expectedVersion?: number,
    extra?: { readAt?: Date; supersededByNotificationId?: string },
  ): Promise<Notification> {
    const where: Prisma.NotificationWhereInput = { id };
    if (expectedVersion !== undefined) {
      where.version = expectedVersion;
    }

    // Build update data — we need current values for fields not being updated.
    // Fetch current only if we have optional extra fields that need merging.
    let currentRecord: Notification | null = null;
    if (extra?.readAt === undefined || extra?.supersededByNotificationId === undefined) {
      currentRecord = await this.prisma.notification.findUnique({ where: { id } });
      if (!currentRecord) {
        throw new ConflictException(`Notification '${id}' not found.`);
      }
    }

    const result = await this.prisma.notification.updateMany({
      where: { id, ...(expectedVersion !== undefined ? { version: expectedVersion } : {}) },
      data: {
        status,
        readAt: extra?.readAt !== undefined ? extra.readAt : (currentRecord?.readAt ?? null),
        supersededByNotificationId:
          extra?.supersededByNotificationId !== undefined
            ? extra.supersededByNotificationId
            : (currentRecord?.supersededByNotificationId ?? null),
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      if (expectedVersion !== undefined) {
        throw new ConflictException(
          `CAS Concurrency Conflict: Expected version ${expectedVersion} on Notification '${id}', but record was concurrently modified or not found. Atomic update rejected.`,
        );
      }
      throw new ConflictException(`Notification '${id}' not found.`);
    }

    const updated = await this.prisma.notification.findUnique({ where: { id } });
    return updated!;
  }

  async createDelivery(data: {
    notificationId: string;
    userId: string;
    channel: string;
    deliveryIdempotencyKey: string;
    scheduledAt?: Date;
  }): Promise<NotificationDelivery> {
    return this.prisma.notificationDelivery.create({
      data: {
        notificationId: data.notificationId,
        userId: data.userId,
        channel: data.channel,
        deliveryIdempotencyKey: data.deliveryIdempotencyKey,
        scheduledAt: data.scheduledAt || new Date(),
        status: 'PENDING',
      },
    });
  }

  async findDeliveriesByNotificationId(notificationId: string): Promise<NotificationDelivery[]> {
    return this.prisma.notificationDelivery.findMany({
      where: { notificationId },
    });
  }

  /**
   * DEF-001 FIX: Atomic delivery lease acquisition using updateMany with conditional WHERE.
   *
   * Previous implementation:
   *   1. findUnique — reads current record
   *   2. Check status/lease conditions
   *   3. update — writes LEASED status
   * Steps 1 and 3 are separate database operations. Between them, a concurrent worker
   * could have already acquired the lease. Both workers pass the check and both update.
   * The last writer wins — both believe they hold the lease, both invoke the provider.
   *
   * Fix: Single atomic updateMany with full WHERE predicate including status and lease guard.
   * If count=0, another worker holds an active lease or delivery is in terminal state.
   * Exactly ONE worker gets count=1; all others get count=0 and receive null.
   *
   * This is safe against concurrent workers because the database evaluates the WHERE
   * atomically before applying the update. With proper transaction isolation (READ COMMITTED
   * or higher), only one writer wins when two race on the same row.
   *
   * Note: With READ COMMITTED (PostgreSQL default), under extreme concurrency (N>2 workers),
   * there is a theoretical window between predicate evaluation and row lock acquisition.
   * For production, consider SERIALIZABLE isolation or a FOR UPDATE lock if needed.
   * At READ COMMITTED this is significantly better than the previous TOCTOU pattern.
   */
  async acquireDeliveryLease(deliveryId: string, workerId: string, leaseDurationMs: number): Promise<NotificationDelivery | null> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + leaseDurationMs);

        const result = await this.prisma.notificationDelivery.updateMany({
      where: {
        id: deliveryId,
        status: { in: ['PENDING', 'RETRY_SCHEDULED'] },
        OR: [
          { leaseExpiresAt: null },
          { leaseExpiresAt: { lte: now } },
        ],
      },
      data: {
        status: 'LEASED',
        leaseOwner: workerId,
        leaseExpiresAt: expiresAt,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      return null; // Lease held by another active worker, or terminal/non-leasable state
    }

    return this.prisma.notificationDelivery.findUnique({ where: { id: deliveryId } });
  }

  /**
   * DEF-002 FIX: Atomic CAS update for delivery status using updateMany.
   * See updateNotificationStatus for full rationale.
   */
  async updateDeliveryStatus(
    deliveryId: string,
    status: string,
    expectedVersion?: number,
    extra?: {
      providerName?: string;
      deliveredAt?: Date;
      failureReason?: string;
      failureCategory?: string;
      retryCount?: number;
      nextRetryAt?: Date;
    },
  ): Promise<NotificationDelivery> {
    // Fetch current to merge optional extra fields
    const existing = await this.prisma.notificationDelivery.findUnique({ where: { id: deliveryId } });
    if (!existing) throw new ConflictException(`Notification Delivery '${deliveryId}' not found.`);

    const result = await this.prisma.notificationDelivery.updateMany({
      where: { id: deliveryId, ...(expectedVersion !== undefined ? { version: expectedVersion } : {}) },
      data: {
        status,
        providerName: extra?.providerName !== undefined ? extra.providerName : existing.providerName,
        deliveredAt: extra?.deliveredAt !== undefined ? extra.deliveredAt : existing.deliveredAt,
        failureReason: extra?.failureReason !== undefined ? extra.failureReason : existing.failureReason,
        failureCategory: extra?.failureCategory !== undefined ? extra.failureCategory : existing.failureCategory,
        retryCount: extra?.retryCount !== undefined ? extra.retryCount : existing.retryCount,
        // DEF-006 FIX: Persist nextRetryAt for exponential backoff scheduling
        nextRetryAt: extra?.nextRetryAt !== undefined ? extra.nextRetryAt : existing.nextRetryAt,
        leaseOwner: null,
        leaseExpiresAt: null,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      if (expectedVersion !== undefined) {
        throw new ConflictException(
          `CAS Concurrency Conflict: Expected version ${expectedVersion} on Delivery '${deliveryId}', but record was concurrently modified or not found. Atomic update rejected.`,
        );
      }
      throw new ConflictException(`Notification Delivery '${deliveryId}' not found.`);
    }

    const updated = await this.prisma.notificationDelivery.findUnique({ where: { id: deliveryId } });
    return updated!;
  }

  async createDeliveryAttempt(data: {
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
  }): Promise<NotificationDeliveryAttempt> {
    return this.prisma.notificationDeliveryAttempt.create({
      data: {
        deliveryId: data.deliveryId,
        notificationId: data.notificationId,
        channel: data.channel,
        providerName: data.providerName,
        status: data.status,
        attemptNumber: data.attemptNumber,
        errorMessage: data.errorMessage,
        errorCode: data.errorCode,
        failureCategory: data.failureCategory,
        durationMs: data.durationMs,
        providerMessageId: data.providerMessageId,
        requestPayloadSanitized: data.requestPayloadSanitized as Prisma.InputJsonValue,
        responsePayloadSanitized: data.responsePayloadSanitized as Prisma.InputJsonValue,
      },
    });
  }

  async findActionItemByIdempotencyKey(userId: string, idempotencyKey: string): Promise<CitizenActionItem | null> {
    return this.prisma.citizenActionItem.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
    });
  }

  async findActionItemById(id: string): Promise<CitizenActionItem | null> {
    return this.prisma.citizenActionItem.findUnique({
      where: { id },
    });
  }

  async findActionItemsByUserId(
    userId: string,
    options?: { cursor?: string; limit?: number; status?: string },
  ): Promise<CitizenActionItem[]> {
    const limit = Math.min(options?.limit || 20, 100);
    return this.prisma.citizenActionItem.findMany({
      where: {
        userId,
        ...(options?.status ? { status: options.status } : {}),
      },
      take: limit,
      ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  async createActionItem(data: {
    userId: string;
    actionType: string;
    title: string;
    description: string;
    priority?: string;
    targetUrl: string;
    deadline?: Date;
    sourceEntityId: string;
    idempotencyKey: string;
  }): Promise<CitizenActionItem> {
    return this.prisma.citizenActionItem.create({
      data: {
        userId: data.userId,
        actionType: data.actionType,
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        targetUrl: data.targetUrl,
        deadline: data.deadline,
        sourceEntityId: data.sourceEntityId,
        idempotencyKey: data.idempotencyKey,
        status: 'PENDING',
      },
    });
  }

  /**
   * DEF-002 FIX: Atomic CAS update for action item status using updateMany.
   * See updateNotificationStatus for full rationale.
   */
  async updateActionItemStatus(
    id: string,
    status: string,
    expectedVersion?: number,
    extra?: { completedAt?: Date; dismissedAt?: Date },
  ): Promise<CitizenActionItem> {
    const existing = await this.prisma.citizenActionItem.findUnique({ where: { id } });
    if (!existing) throw new ConflictException(`Action Item '${id}' not found.`);

    const result = await this.prisma.citizenActionItem.updateMany({
      where: { id, ...(expectedVersion !== undefined ? { version: expectedVersion } : {}) },
      data: {
        status,
        completedAt: extra?.completedAt !== undefined ? extra.completedAt : existing.completedAt,
        dismissedAt: extra?.dismissedAt !== undefined ? extra.dismissedAt : existing.dismissedAt,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      if (expectedVersion !== undefined) {
        throw new ConflictException(
          `CAS Concurrency Conflict: Expected version ${expectedVersion} on Action Item '${id}', but record was concurrently modified or not found. Atomic update rejected.`,
        );
      }
      throw new ConflictException(`Action Item '${id}' not found.`);
    }

    const updated = await this.prisma.citizenActionItem.findUnique({ where: { id } });
    return updated!;
  }

  async findActiveTemplateVersion(templateId: string, version: number, locale: string): Promise<NotificationTemplateVersion | null> {
    return this.prisma.notificationTemplateVersion.findUnique({
      where: { templateId_version_locale: { templateId, version, locale } },
    });
  }

  async createTemplateVersion(data: {
    templateId: string;
    version: number;
    locale: string;
    titleTemplate: string;
    bodyTemplate: string;
    actionUrlTemplate?: string;
    checksumSha256: string;
    createdBy: string;
  }): Promise<NotificationTemplateVersion> {
    return this.prisma.notificationTemplateVersion.create({
      data: {
        templateId: data.templateId,
        version: data.version,
        locale: data.locale,
        titleTemplate: data.titleTemplate,
        bodyTemplate: data.bodyTemplate,
        actionUrlTemplate: data.actionUrlTemplate,
        checksumSha256: data.checksumSha256,
        createdBy: data.createdBy,
      },
    });
  }

  async findActivePolicyVersion(policyId: string, version: number): Promise<NotificationPolicyVersion | null> {
    return this.prisma.notificationPolicyVersion.findUnique({
      where: { policyId_version: { policyId, version } },
    });
  }

  async createPolicyVersion(data: {
    policyId: string;
    version: number;
    minMaterialityLevel: string;
    cooldownWindowSeconds: number;
    maxPerWindow: number;
    allowedChannels: unknown;
    fallbackPrecedence: unknown;
    checksumSha256: string;
    activatedBy: string;
  }): Promise<NotificationPolicyVersion> {
    return this.prisma.notificationPolicyVersion.create({
      data: {
        policyId: data.policyId,
        version: data.version,
        minMaterialityLevel: data.minMaterialityLevel,
        cooldownWindowSeconds: data.cooldownWindowSeconds,
        maxPerWindow: data.maxPerWindow,
        allowedChannels: data.allowedChannels as Prisma.InputJsonValue,
        fallbackPrecedence: data.fallbackPrecedence as Prisma.InputJsonValue,
        checksumSha256: data.checksumSha256,
        activatedBy: data.activatedBy,
      },
    });
  }

  async findPreference(userId: string, channel: string): Promise<NotificationPreference | null> {
    return this.prisma.notificationPreference.findUnique({
      where: { userId_channel: { userId, channel } },
    });
  }

  async upsertPreference(data: {
    userId: string;
    channel: string;
    status: string;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    timezone?: string;
    categoryOverrides?: unknown;
  }): Promise<NotificationPreference> {
    return this.prisma.notificationPreference.upsert({
      where: { userId_channel: { userId: data.userId, channel: data.channel } },
      update: {
        status: data.status,
        quietHoursStart: data.quietHoursStart,
        quietHoursEnd: data.quietHoursEnd,
        timezone: data.timezone || 'Asia/Kolkata',
        categoryOverrides: data.categoryOverrides as Prisma.InputJsonValue,
      },
      create: {
        userId: data.userId,
        channel: data.channel,
        status: data.status,
        quietHoursStart: data.quietHoursStart,
        quietHoursEnd: data.quietHoursEnd,
        timezone: data.timezone || 'Asia/Kolkata',
        categoryOverrides: data.categoryOverrides as Prisma.InputJsonValue,
      },
    });
  }

  async createSuppression(data: {
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
  }): Promise<NotificationSuppression> {
    return this.prisma.notificationSuppression.create({
      data: {
        userId: data.userId,
        sourceEventId: data.sourceEventId,
        sourceDecisionDiffId: data.sourceDecisionDiffId,
        notificationType: data.notificationType,
        suppressionReason: data.suppressionReason,
        policyId: data.policyId,
        policyVersion: data.policyVersion,
        policyChecksumSha256: data.policyChecksumSha256,
        originalEvaluationTime: data.originalEvaluationTime || new Date(),
        nextEligibleDeliveryTime: data.nextEligibleDeliveryTime,
      },
    });
  }

  async createOutboxEntry(data: {
    eventId: string;
    eventType: string;
    payload: unknown;
  }): Promise<NotificationOutbox> {
    return this.prisma.notificationOutbox.create({
      data: {
        eventId: data.eventId,
        eventType: data.eventType,
        payload: data.payload as Prisma.InputJsonValue,
        status: 'PENDING',
      },
    });
  }

  /**
   * DEF-001 FIX: Atomic outbox lease acquisition — same pattern as acquireDeliveryLease.
   */
  async acquireOutboxLease(outboxId: string, workerId: string, leaseDurationMs: number): Promise<NotificationOutbox | null> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + leaseDurationMs);

    const result = await this.prisma.notificationOutbox.updateMany({
      where: {
        id: outboxId,
        status: 'PENDING',
        OR: [
          { leaseExpiresAt: null },
          { leaseExpiresAt: { lte: now } },
        ],
      },
      data: {
        status: 'LEASED',
        leaseOwner: workerId,
        leaseExpiresAt: expiresAt,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.prisma.notificationOutbox.findUnique({ where: { id: outboxId } });
  }

  async updateOutboxStatus(outboxId: string, status: string, errorMessage?: string): Promise<NotificationOutbox> {
    return this.prisma.notificationOutbox.update({
      where: { id: outboxId },
      data: {
        status,
        errorMessage,
        processedAt: status === 'PROCESSED' ? new Date() : undefined,
        leaseOwner: null,
        leaseExpiresAt: null,
      },
    });
  }

  async findActiveNotificationsForSupersession(userId: string, sourceReEvaluationId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        userId,
        sourceReEvaluationId,
        status: { in: ['CREATED', 'RENDERED', 'QUEUED', 'PARTIALLY_DELIVERED', 'DELIVERED'] },
      },
    });
  }
}
