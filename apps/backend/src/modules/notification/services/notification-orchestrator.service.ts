import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  NOTIFICATION_REPOSITORY,
  NOTIFICATION_INGESTION_SERVICE,
  NOTIFICATION_POLICY_SERVICE,
  CHANNEL_RESOLUTION_SERVICE,
  NOTIFICATION_RENDERER_SERVICE,
  NOTIFICATION_SUPERSESSION_SERVICE,
  NOTIFICATION_OUTBOX_SERVICE,
} from '../../../core/tokens/injection-tokens';
import { INotificationRepository } from '../repositories/notification.repository.interface';
import { NotificationIngestionService, MaterialDecisionChangeEventPayload } from './notification-ingestion.service';
import { NotificationPolicyService } from './notification-policy.service';
import { ChannelResolutionService } from './channel-resolution.service';
import { NotificationRendererService } from './notification-renderer.service';
import { SupersessionService } from './supersession.service';
import { NotificationOutboxService } from './notification-outbox.service';
import {
  StandardDomainEventEnvelope,
  NotificationDto,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
  ActionType,
  NotificationDeliveryDto,
} from '@gpios/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationOrchestratorService {
  private readonly logger = new Logger(NotificationOrchestratorService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository,
    @Inject(NOTIFICATION_INGESTION_SERVICE) private readonly ingestionService: NotificationIngestionService,
    @Inject(NOTIFICATION_POLICY_SERVICE) private readonly policyService: NotificationPolicyService,
    @Inject(CHANNEL_RESOLUTION_SERVICE) private readonly channelService: ChannelResolutionService,
    @Inject(NOTIFICATION_RENDERER_SERVICE) private readonly renderer: NotificationRendererService,
    @Inject(NOTIFICATION_SUPERSESSION_SERVICE) private readonly supersessionService: SupersessionService,
    @Inject(NOTIFICATION_OUTBOX_SERVICE) private readonly outboxService: NotificationOutboxService,
  ) {}

  async handleDecisionChangeEvent(
    event: StandardDomainEventEnvelope<MaterialDecisionChangeEventPayload>,
  ): Promise<NotificationDto | null> {
    const ingestion = await this.ingestionService.processIngestion(event);
    if (!ingestion.shouldProcess) {
      this.logger.log(`Ingestion Skipped: ${ingestion.reason}`);
      return null;
    }

    const payload = event.payload;
    const policyEval = await this.policyService.evaluatePolicy({
      userId: payload.userId,
      notificationType: payload.changeType,
      isMaterial: payload.isMaterial,
      priority: NotificationPriority.MEDIUM,
      policyId: payload.policyId,
      policyVersion: payload.policyVersion,
      sourceEventId: event.eventId,
      sourceDecisionDiffId: payload.sourceDecisionDiffId,
    });

    if (!policyEval.allowed) {
      this.logger.log(`Notification Suppressed: ${policyEval.suppressionReason}`);
      return null;
    }

    const channels = await this.channelService.resolveChannels({
      userId: payload.userId,
      priority: NotificationPriority.MEDIUM,
      allowedChannels: policyEval.allowedChannels,
      fallbackPrecedence: policyEval.fallbackPrecedence,
    });

    // DEF-003 FIX: Preserve original template parameters for deterministic replay
    const templateParameters = {
      policyTitle: 'Government Policy',
      newStatus: payload.changeType,
      reEvaluationId: payload.sourceReEvaluationId,
    };
    const rendered = await this.renderer.renderTemplate({
      templateId: 'tmpl-eligibility-change',
      version: 1,
      parameters: templateParameters,
    });

    const idempotencyKey = `notif_${event.eventId}_${payload.userId}`;

    // Atomic DB Transaction: Notification + ActionItem + Deliveries + Outbox + Event
    const notifRecord = await this.prisma.$transaction(async (tx) => {
      let actionItemId: string | undefined = undefined;

      // Action Item Creation if Actionable
      const actionItem = await tx.citizenActionItem.create({
        data: {
          userId: payload.userId,
          actionType: ActionType.REVIEW_ELIGIBILITY,
          title: `Action Required: Review ${rendered.title}`,
          description: rendered.body,
          priority: NotificationPriority.MEDIUM,
          targetUrl: rendered.actionUrl || `/action-center/review/${payload.sourceReEvaluationId}`,
          sourceEntityId: payload.sourceReEvaluationId,
          idempotencyKey: `action_${event.eventId}_${payload.userId}`,
          status: 'PENDING',
        },
      });
      actionItemId = actionItem.id;

      const createdNotif = await tx.notification.create({
        data: {
          userId: payload.userId,
          notificationType: payload.changeType,
          title: rendered.title,
          body: rendered.body,
          priority: NotificationPriority.MEDIUM,
          actionItemId,
          sourceReEvaluationId: payload.sourceReEvaluationId,
          sourceDecisionDiffId: payload.sourceDecisionDiffId,
          sourceEventId: event.eventId,
          templateId: 'tmpl-eligibility-change',
          templateVersion: 1,
          policyId: policyEval.policyId,
          policyVersion: policyEval.policyVersion,
          policyChecksumSha256: policyEval.policyChecksumSha256,
          dependencyFingerprintSha256: payload.dependencyFingerprintSha256,
          checksumSha256: rendered.checksumSha256,
          idempotencyKey,
          status: 'CREATED',
          // DEF-003 FIX: Persist original template parameters for replay determinism
          templateParameters: templateParameters as unknown as Prisma.InputJsonValue,
        },
      });

      // Channel Delivery Intent Records
      for (const ch of channels) {
        await tx.notificationDelivery.create({
          data: {
            notificationId: createdNotif.id,
            userId: payload.userId,
            channel: ch,
            deliveryIdempotencyKey: `${createdNotif.id}_${ch}_gen1`,
            status: 'PENDING',
          },
        });
      }

      await tx.factVerificationEvent.create({
        data: {
          eventId: `evt_notif_${idempotencyKey}`,
          eventType: 'notification.created',
          aggregateId: createdNotif.id,
          userId: payload.userId,
          correlationId: event.correlationId,
          causationId: event.eventId,
          payload: { notificationId: createdNotif.id, channels } as Prisma.InputJsonValue,
        },
      });

      return createdNotif;
    });

    // Semantic Supersession of Older Notifications
    await this.supersessionService.processSupersession({
      userId: payload.userId,
      sourceReEvaluationId: payload.sourceReEvaluationId,
      newNotificationId: notifRecord.id,
    });

    // Execute Outbox Delivery Workers outside DB Transaction
    const deliveries = await this.repo.findDeliveriesByNotificationId(notifRecord.id);
    for (const del of deliveries) {
      await this.outboxService.processDelivery(del.id);
    }

    const updatedNotif = await this.repo.findNotificationById(notifRecord.id);

    return {
      notificationId: updatedNotif!.id,
      userId: updatedNotif!.userId,
      notificationType: updatedNotif!.notificationType as NotificationType,
      title: updatedNotif!.title,
      body: updatedNotif!.body,
      priority: updatedNotif!.priority as NotificationPriority,
      status: updatedNotif!.status as NotificationStatus,
      actionItemId: updatedNotif!.actionItemId || undefined,
      sourceReEvaluationId: updatedNotif!.sourceReEvaluationId,
      sourceDecisionDiffId: updatedNotif!.sourceDecisionDiffId,
      sourceEventId: updatedNotif!.sourceEventId,
      templateId: updatedNotif!.templateId,
      templateVersion: updatedNotif!.templateVersion,
      policyId: updatedNotif!.policyId,
      policyVersion: updatedNotif!.policyVersion,
      policyChecksumSha256: updatedNotif!.policyChecksumSha256,
      dependencyFingerprintSha256: updatedNotif!.dependencyFingerprintSha256,
      checksumSha256: updatedNotif!.checksumSha256,
      idempotencyKey: updatedNotif!.idempotencyKey,
      readAt: updatedNotif!.readAt ? updatedNotif!.readAt.toISOString() : undefined,
      version: updatedNotif!.version,
      createdAt: updatedNotif!.createdAt.toISOString(),
      deliveries: (updatedNotif as unknown as { deliveries?: NotificationDeliveryDto[] }).deliveries || [],
    };
  }

  async markNotificationAsRead(notificationId: string, userId: string, expectedVersion: number): Promise<NotificationDto> {
    const notif = await this.repo.findNotificationById(notificationId);
    if (!notif) throw new Error(`Notification '${notificationId}' not found.`);

    if (notif.userId !== userId) {
      throw new Error(`Security Boundary Rejection: User '${userId}' does not own Notification '${notificationId}'.`);
    }

    const updated = await this.repo.updateNotificationStatus(notificationId, NotificationStatus.READ, expectedVersion, {
      readAt: new Date(),
    });

    return {
      notificationId: updated.id,
      userId: updated.userId,
      notificationType: updated.notificationType as NotificationType,
      title: updated.title,
      body: updated.body,
      priority: updated.priority as NotificationPriority,
      status: updated.status as NotificationStatus,
      actionItemId: updated.actionItemId || undefined,
      sourceReEvaluationId: updated.sourceReEvaluationId,
      sourceDecisionDiffId: updated.sourceDecisionDiffId,
      sourceEventId: updated.sourceEventId,
      templateId: updated.templateId,
      templateVersion: updated.templateVersion,
      policyId: updated.policyId,
      policyVersion: updated.policyVersion,
      policyChecksumSha256: updated.policyChecksumSha256,
      dependencyFingerprintSha256: updated.dependencyFingerprintSha256,
      checksumSha256: updated.checksumSha256,
      idempotencyKey: updated.idempotencyKey,
      readAt: updated.readAt ? updated.readAt.toISOString() : undefined,
      version: updated.version,
      createdAt: updated.createdAt.toISOString(),
      deliveries: (updated as unknown as { deliveries?: NotificationDeliveryDto[] }).deliveries || [],
    };
  }
}
