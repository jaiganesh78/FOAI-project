import { Controller, Get, Post, Body, Param, Query, UseGuards, Inject, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/security/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/security/decorators/current-user.decorator';
import { ACTION_CENTER_SERVICE, NOTIFICATION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { ActionCenterService } from '../services/action-center.service';
import { INotificationRepository } from '../repositories/notification.repository.interface';
import { ActionItemStatus, ActionItemTransitionSchema } from '@gpios/shared';

interface AuthenticatedUser {
  id: string;
  roles?: string[];
}

@Controller('api/v1/action-center')
@UseGuards(JwtAuthGuard)
export class ActionCenterController {
  constructor(
    @Inject(ACTION_CENTER_SERVICE) private readonly actionCenterService: ActionCenterService,
    @Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository,
  ) {}

  @Get()
  async getActionItems(
    @CurrentUser() user: AuthenticatedUser,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.actionCenterService.getActionItems(user.id, cursor, limit ? Number(limit) : 20, status);
  }

  @Get(':id')
  async getActionItemById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const item = await this.repo.findActionItemById(id);
    if (!item) throw new ForbiddenException('Action Item not found or access denied.');
    if (item.userId !== user.id && !user.roles?.includes('ADMIN')) {
      throw new ForbiddenException('Security Boundary Rejection: Cross-citizen action item access denied.');
    }
    return item;
  }

  @Post(':id/acknowledge')
  async acknowledgeActionItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { expectedVersion: number },
  ) {
    ActionItemTransitionSchema.parse(body);
    return this.actionCenterService.transitionState({
      actionId: id,
      userId: user.id,
      targetStatus: ActionItemStatus.ACKNOWLEDGED,
      expectedVersion: body.expectedVersion,
    });
  }

  @Post(':id/complete')
  async completeActionItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { expectedVersion: number },
  ) {
    ActionItemTransitionSchema.parse(body);
    return this.actionCenterService.transitionState({
      actionId: id,
      userId: user.id,
      targetStatus: ActionItemStatus.COMPLETED,
      expectedVersion: body.expectedVersion,
    });
  }

  @Post(':id/dismiss')
  async dismissActionItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { expectedVersion: number },
  ) {
    ActionItemTransitionSchema.parse(body);
    return this.actionCenterService.transitionState({
      actionId: id,
      userId: user.id,
      targetStatus: ActionItemStatus.DISMISSED,
      expectedVersion: body.expectedVersion,
    });
  }
}
