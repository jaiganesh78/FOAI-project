import { Module } from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY,
  NOTIFICATION_INGESTION_SERVICE,
  NOTIFICATION_POLICY_SERVICE,
  CHANNEL_RESOLUTION_SERVICE,
  NOTIFICATION_RENDERER_SERVICE,
  NOTIFICATION_SUPERSESSION_SERVICE,
  ACTION_CENTER_SERVICE,
  NOTIFICATION_OUTBOX_SERVICE,
  NOTIFICATION_REPLAY_SERVICE,
  NOTIFICATION_ANALYTICS_SERVICE,
  NOTIFICATION_ORCHESTRATOR_SERVICE,
  IN_APP_CHANNEL_ADAPTER,
  EMAIL_CHANNEL_ADAPTER,
  SMS_CHANNEL_ADAPTER,
  PUSH_CHANNEL_ADAPTER,
} from '../../core/tokens/injection-tokens';
import { PrismaNotificationRepository } from './repositories/prisma-notification.repository';
import { NotificationIngestionService } from './services/notification-ingestion.service';
import { NotificationPolicyService } from './services/notification-policy.service';
import { ChannelResolutionService } from './services/channel-resolution.service';
import { NotificationRendererService } from './services/notification-renderer.service';
import { SupersessionService } from './services/supersession.service';
import { ActionCenterService } from './services/action-center.service';
import { NotificationOutboxService } from './services/notification-outbox.service';
import { NotificationReplayService } from './services/notification-replay.service';
import { NotificationAnalyticsService } from './services/notification-analytics.service';
import { NotificationOrchestratorService } from './services/notification-orchestrator.service';
import { InAppChannelAdapter } from './services/adapters/in-app-channel.adapter';
import { EmailChannelAdapter } from './services/adapters/email-channel.adapter';
import { SmsChannelAdapter } from './services/adapters/sms-channel.adapter';
import { PushChannelAdapter } from './services/adapters/push-channel.adapter';

import { NotificationController } from './controllers/notification.controller';
import { ActionCenterController } from './controllers/action-center.controller';

import { DatabaseModule } from '../../core/database/database.module';
import { EventBusModule } from '../../core/event-bus/event-bus.module';
import { ClockModule } from '../../core/clock/clock.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, EventBusModule, ClockModule, AuthModule],
  controllers: [NotificationController, ActionCenterController],
  providers: [
    NotificationIngestionService,
    NotificationPolicyService,
    ChannelResolutionService,
    NotificationRendererService,
    SupersessionService,
    ActionCenterService,
    NotificationOutboxService,
    NotificationReplayService,
    NotificationAnalyticsService,
    NotificationOrchestratorService,
    InAppChannelAdapter,
    EmailChannelAdapter,
    SmsChannelAdapter,
    PushChannelAdapter,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
    {
      provide: NOTIFICATION_INGESTION_SERVICE,
      useClass: NotificationIngestionService,
    },
    {
      provide: NOTIFICATION_POLICY_SERVICE,
      useClass: NotificationPolicyService,
    },
    {
      provide: CHANNEL_RESOLUTION_SERVICE,
      useClass: ChannelResolutionService,
    },
    {
      provide: NOTIFICATION_RENDERER_SERVICE,
      useClass: NotificationRendererService,
    },
    {
      provide: NOTIFICATION_SUPERSESSION_SERVICE,
      useClass: SupersessionService,
    },
    {
      provide: ACTION_CENTER_SERVICE,
      useClass: ActionCenterService,
    },
    {
      provide: NOTIFICATION_OUTBOX_SERVICE,
      useClass: NotificationOutboxService,
    },
    {
      provide: NOTIFICATION_REPLAY_SERVICE,
      useClass: NotificationReplayService,
    },
    {
      provide: NOTIFICATION_ANALYTICS_SERVICE,
      useClass: NotificationAnalyticsService,
    },
    {
      provide: NOTIFICATION_ORCHESTRATOR_SERVICE,
      useClass: NotificationOrchestratorService,
    },
    {
      provide: IN_APP_CHANNEL_ADAPTER,
      useClass: InAppChannelAdapter,
    },
    {
      provide: EMAIL_CHANNEL_ADAPTER,
      useClass: EmailChannelAdapter,
    },
    {
      provide: SMS_CHANNEL_ADAPTER,
      useClass: SmsChannelAdapter,
    },
    {
      provide: PUSH_CHANNEL_ADAPTER,
      useClass: PushChannelAdapter,
    },
  ],
  exports: [
    NOTIFICATION_ORCHESTRATOR_SERVICE,
    ACTION_CENTER_SERVICE,
    NOTIFICATION_REPLAY_SERVICE,
    NOTIFICATION_ANALYTICS_SERVICE,
  ],
})
export class NotificationModule {}
