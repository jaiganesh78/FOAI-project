import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY, NOTIFICATION_RENDERER_SERVICE } from '../../../core/tokens/injection-tokens';
import { INotificationRepository } from '../repositories/notification.repository.interface';
import { NotificationRendererService } from './notification-renderer.service';
import { ReplayNotificationDto } from '@gpios/shared';

@Injectable()
export class NotificationReplayService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository,
    @Inject(NOTIFICATION_RENDERER_SERVICE) private readonly renderer: NotificationRendererService,
  ) {}

  async replayNotification(notificationId: string): Promise<ReplayNotificationDto> {
    const notif = await this.repo.findNotificationById(notificationId);
    if (!notif) {
      throw new BadRequestException(`Notification '${notificationId}' not found for replay.`);
    }

    // DEF-003 FIX: Snapshot-driven Replay uses the ORIGINAL template parameters that were
    // stored at notification creation time, NOT the already-rendered title/body text.
    //
    // Previous bug: `parameters: { title: notif.title, body: notif.body }`
    // This passed already-rendered values to a template expecting original variables like
    // {{policyTitle}} and {{newStatus}}, causing "Unresolved placeholders" errors.
    //
    // Fix: Use notif.templateParameters (stored at creation) when available.
    // If templateParameters is null (notifications created before this fix), fall back to
    // an empty parameters map and let the renderer raise an appropriate error rather than
    // silently producing incorrect output.
    const templateParameters = (notif as unknown as { templateParameters?: Record<string, unknown> }).templateParameters
      ?? {};

    // Snapshot-driven Replay: Use stored template version and checksums strictly
    const rendered = await this.renderer.renderTemplate({
      templateId: notif.templateId,
      version: notif.templateVersion,
      parameters: templateParameters,
    });

    if (rendered.checksumSha256 !== notif.checksumSha256) {
      throw new BadRequestException(
        `LOUD HISTORICAL CHECKSUM REPLAY FAILURE: Checksum mismatch for Notification '${notificationId}'! Stored: ${notif.checksumSha256}, Calculated: ${rendered.checksumSha256}. Template or historical state integrity corrupted.`,
      );
    }

    return {
      isVerified: true,
      originalChecksum: notif.checksumSha256,
      replayChecksum: rendered.checksumSha256,
      isMatch: true,
      renderedTitle: rendered.title,
      renderedBody: rendered.body,
      renderedActionUrl: rendered.actionUrl,
      templateVersion: notif.templateVersion,
      policyVersion: notif.policyVersion,
    };
  }
}
