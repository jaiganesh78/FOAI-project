import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { INotificationRepository } from '../repositories/notification.repository.interface';
import { ActionItemStatus, CitizenActionItemDto, NotificationPriority, ActionType } from '@gpios/shared';

@Injectable()
export class ActionCenterService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly repo: INotificationRepository,
  ) {}

  private validateStateTransition(current: ActionItemStatus, next: ActionItemStatus): void {
    const legalTransitions: Record<ActionItemStatus, ActionItemStatus[]> = {
      [ActionItemStatus.PENDING]: [
        ActionItemStatus.VIEWED,
        ActionItemStatus.ACKNOWLEDGED,
        ActionItemStatus.ACTION_REQUIRED,
        ActionItemStatus.COMPLETED,
        ActionItemStatus.DISMISSAL_REQUESTED,
        ActionItemStatus.DISMISSED,
        ActionItemStatus.EXPIRED,
        ActionItemStatus.SUPERSEDED,
      ],
      [ActionItemStatus.VIEWED]: [
        ActionItemStatus.ACKNOWLEDGED,
        ActionItemStatus.ACTION_REQUIRED,
        ActionItemStatus.COMPLETED,
        ActionItemStatus.DISMISSAL_REQUESTED,
        ActionItemStatus.DISMISSED,
        ActionItemStatus.EXPIRED,
        ActionItemStatus.SUPERSEDED,
      ],
      [ActionItemStatus.ACKNOWLEDGED]: [
        ActionItemStatus.ACTION_REQUIRED,
        ActionItemStatus.COMPLETED,
        ActionItemStatus.DISMISSAL_REQUESTED,
        ActionItemStatus.DISMISSED,
        ActionItemStatus.EXPIRED,
        ActionItemStatus.SUPERSEDED,
      ],
      [ActionItemStatus.ACTION_REQUIRED]: [
        ActionItemStatus.COMPLETED,
        ActionItemStatus.DISMISSAL_REQUESTED,
        ActionItemStatus.DISMISSED,
        ActionItemStatus.EXPIRED,
        ActionItemStatus.SUPERSEDED,
      ],
      [ActionItemStatus.DISMISSAL_REQUESTED]: [
        ActionItemStatus.DISMISSED,
        ActionItemStatus.COMPLETED,
        ActionItemStatus.SUPERSEDED,
      ],
      [ActionItemStatus.COMPLETED]: [], // Terminal State (IMMUNE)
      [ActionItemStatus.DISMISSED]: [], // Terminal State
      [ActionItemStatus.EXPIRED]: [], // Terminal State
      [ActionItemStatus.SUPERSEDED]: [], // Terminal State
    };

    if (!legalTransitions[current].includes(next)) {
      throw new BadRequestException(
        `Illegal State Transition Error: Action Item transition from '${current}' to '${next}' is prohibited. Terminal states are immutable.`,
      );
    }
  }

  async getActionItems(userId: string, cursor?: string, limit?: number, status?: string): Promise<CitizenActionItemDto[]> {
    const list = await this.repo.findActionItemsByUserId(userId, { cursor, limit, status });
    return list.map((item) => ({
      actionId: item.id,
      userId: item.userId,
      actionType: item.actionType as ActionType,
      title: item.title,
      description: item.description,
      status: item.status as ActionItemStatus,
      priority: item.priority as NotificationPriority,
      targetUrl: item.targetUrl,
      deadline: item.deadline ? item.deadline.toISOString() : undefined,
      sourceEntityId: item.sourceEntityId,
      idempotencyKey: item.idempotencyKey,
      version: item.version,
      completedAt: item.completedAt ? item.completedAt.toISOString() : undefined,
      dismissedAt: item.dismissedAt ? item.dismissedAt.toISOString() : undefined,
      createdAt: item.createdAt.toISOString(),
    }));
  }

  async transitionState(params: {
    actionId: string;
    userId: string;
    targetStatus: ActionItemStatus;
    expectedVersion: number;
  }): Promise<CitizenActionItemDto> {
    const existing = await this.repo.findActionItemById(params.actionId);
    if (!existing) {
      throw new BadRequestException(`Action Item '${params.actionId}' not found.`);
    }

    if (existing.userId !== params.userId) {
      throw new BadRequestException(`Security Boundary Rejection: User '${params.userId}' does not own Action Item '${params.actionId}'.`);
    }

    this.validateStateTransition(existing.status as ActionItemStatus, params.targetStatus);

    const extra: { completedAt?: Date; dismissedAt?: Date } = {};
    if (params.targetStatus === ActionItemStatus.COMPLETED) {
      extra.completedAt = new Date();
    } else if (params.targetStatus === ActionItemStatus.DISMISSED) {
      extra.dismissedAt = new Date();
    }

    const updated = await this.repo.updateActionItemStatus(params.actionId, params.targetStatus, params.expectedVersion, extra);

    return {
      actionId: updated.id,
      userId: updated.userId,
      actionType: updated.actionType as ActionType,
      title: updated.title,
      description: updated.description,
      status: updated.status as ActionItemStatus,
      priority: updated.priority as NotificationPriority,
      targetUrl: updated.targetUrl,
      deadline: updated.deadline ? updated.deadline.toISOString() : undefined,
      sourceEntityId: updated.sourceEntityId,
      idempotencyKey: updated.idempotencyKey,
      version: updated.version,
      completedAt: updated.completedAt ? updated.completedAt.toISOString() : undefined,
      dismissedAt: updated.dismissedAt ? updated.dismissedAt.toISOString() : undefined,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
