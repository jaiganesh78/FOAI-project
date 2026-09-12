import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Inject, ForbiddenException, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/security/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/security/decorators/current-user.decorator';
import {
  NOTIFICATION_ORCHESTRATOR_SERVICE,
  NOTIFICATION_REPOSITORY,
  NOTIFICATION_REPLAY_SERVICE,
  NOTIFICATION_ANALYTICS_SERVICE,
  NOTIFICATION_POLICY_SERVICE,
} from '../../../core/tokens/injection-tokens';
import { NotificationOrchestratorService } from '../services/notification-orchestrator.service';
import { INotificationRepository } from '../repositories/notification.repository.interface';
import { NotificationReplayService } from '../services/notification-replay.service';
import { NotificationAnalyticsService } from '../services/notification-analytics.service';
import { NotificationPolicyService } from '../services/notification-policy.service';

export interface UpdateNotificationPreferenceDto {
  channel: string;
  status: string;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
}

export interface CreateTemplateVersionDto {
  templateId: string;
  version: number;
  locale?: string;
  titleTemplate: string;
  bodyTemplate: string;
  actionUrlTemplate?: string;
}

export interface CreatePolicyVersionDto {
  policyId: string;
  version: number;
  minMaterialityLevel: string;
  cooldownWindowSeconds: number;
  maxPerWindow: number;
  allowedChannels: string[];
  fallbackPrecedence: string[];
}

interface AuthenticatedUser {
  id: string;
  roles?: string[];
}

interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}

@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    @Inject(NOTIFICATION_ORCHESTRATOR_SERVICE) private readonly orchestrator: NotificationOrchestratorService,
    @Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository,
    @Inject(NOTIFICATION_REPLAY_SERVICE) private readonly replayService: NotificationReplayService,
    @Inject(NOTIFICATION_ANALYTICS_SERVICE) private readonly analyticsService: NotificationAnalyticsService,
    @Inject(NOTIFICATION_POLICY_SERVICE) private readonly policyService: NotificationPolicyService,
  ) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.repo.findNotificationsByUserId(user.id, { cursor, limit: limit ? Number(limit) : 20, status });
  }

  @Get('preferences')
  async getPreferences(@CurrentUser() user: AuthenticatedUser) {
    const channels = ['IN_APP', 'EMAIL', 'SMS', 'PUSH'];
    const list = [];
    for (const ch of channels) {
      const p = await this.repo.findPreference(user.id, ch);
      if (p) list.push(p);
    }
    return list;
  }

  @Put('preferences')
  async updatePreference(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateNotificationPreferenceDto) {
    return this.repo.upsertPreference({
      userId: user.id,
      channel: dto.channel,
      status: dto.status,
      quietHoursStart: dto.quietHoursStart,
      quietHoursEnd: dto.quietHoursEnd,
      timezone: dto.timezone,
    });
  }

  @Get(':id')
  async getNotificationById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const notif = await this.repo.findNotificationById(id);
    if (!notif) throw new ForbiddenException('Notification not found or access denied.');
    if (notif.userId !== user.id && !user.roles?.includes('ADMIN')) {
      throw new ForbiddenException('Security Boundary Rejection: Cross-citizen notification access denied.');
    }
    return notif;
  }

  @Post(':id/read')
  async markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body('expectedVersion') expectedVersion: number) {
    return this.orchestrator.markNotificationAsRead(id, user.id, expectedVersion || 1);
  }

  @Get(':id/replay')
  async replayNotification(@CurrentUser() _user: AuthenticatedUser, @Param('id') id: string) {
    return this.replayService.replayNotification(id);
  }

  @Get('operations/analytics')
  async getAnalytics(@CurrentUser() user: AuthenticatedUser, @Req() req: AuthenticatedRequest) {
    const roles = req.user?.roles || ['CITIZEN'];
    if (!roles.includes('GOVERNMENT_OFFICER') && !roles.includes('ADMIN')) {
      throw new ForbiddenException('Security Boundary Rejection: Operational analytics require Officer or Admin role.');
    }
    return this.analyticsService.getAnalytics(user.id);
  }

  @Post('templates')
  async createTemplateVersion(@Body() dto: CreateTemplateVersionDto, @Req() req: AuthenticatedRequest) {
    const roles = req.user?.roles || ['CITIZEN'];
    if (!roles.includes('GOVERNMENT_OFFICER') && !roles.includes('ADMIN')) {
      throw new ForbiddenException('Security Boundary Rejection: Template management requires Officer or Admin role.');
    }
    const adminId = req.user?.id || 'admin-1';
    const payload = { ...dto, locale: dto.locale || 'en-IN', createdBy: adminId };
    const checksumSha256 = this.policyService.isQuietHoursActive('22:00', '07:00') ? 'sample-template-checksum' : 'tmpl-checksum';
    return this.repo.createTemplateVersion({ ...payload, checksumSha256 });
  }

  @Post('policies')
  async createPolicyVersion(@Body() dto: CreatePolicyVersionDto, @Req() req: AuthenticatedRequest) {
    const roles = req.user?.roles || ['CITIZEN'];
    if (!roles.includes('GOVERNMENT_OFFICER') && !roles.includes('ADMIN')) {
      throw new ForbiddenException('Security Boundary Rejection: Policy management requires Officer or Admin role.');
    }
    const adminId = req.user?.id || 'admin-1';
    return this.repo.createPolicyVersion({
      policyId: dto.policyId,
      version: dto.version,
      minMaterialityLevel: dto.minMaterialityLevel,
      cooldownWindowSeconds: dto.cooldownWindowSeconds,
      maxPerWindow: dto.maxPerWindow,
      allowedChannels: dto.allowedChannels,
      fallbackPrecedence: dto.fallbackPrecedence,
      checksumSha256: 'policy-checksum-sha',
      activatedBy: adminId,
    });
  }

  @Get('health')
  async getHealth() {
    return { status: 'HEALTHY', engine: 'NotificationOrchestratorService', timestamp: new Date().toISOString() };
  }
}
