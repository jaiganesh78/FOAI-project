import {
  NotificationStatus,
  DeliveryStatus,
  DeliveryAttemptStatus,
  ActionItemStatus,
  NotificationPriority,
  NotificationChannel,
  NotificationPreferenceStatus,
  NotificationType,
  ActionType,
  SuppressionReason,
  FailureCategory,
} from '../enums';

export interface NotificationDto {
  notificationId: string;
  userId: string;
  notificationType: NotificationType;
  title: string;
  body: string;
  priority: NotificationPriority;
  status: NotificationStatus;
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
  supersededByNotificationId?: string;
  idempotencyKey: string;
  readAt?: string;
  version: number;
  createdAt: string;
  deliveries?: NotificationDeliveryDto[];
}

export interface NotificationDeliveryDto {
  deliveryId: string;
  notificationId: string;
  userId: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  providerName?: string;
  deliveryIdempotencyKey: string;
  scheduledAt: string;
  deliveredAt?: string;
  retryCount: number;
  maxRetries: number;
  failureReason?: string;
  failureCategory?: FailureCategory;
  version: number;
  createdAt: string;
}

export interface NotificationDeliveryAttemptDto {
  attemptId: string;
  deliveryId: string;
  notificationId: string;
  channel: NotificationChannel;
  providerName: string;
  status: DeliveryAttemptStatus;
  attemptNumber: number;
  errorMessage?: string;
  errorCode?: string;
  failureCategory?: FailureCategory;
  durationMs: number;
  providerMessageId?: string;
  createdAt: string;
}

export interface CitizenActionItemDto {
  actionId: string;
  userId: string;
  actionType: ActionType;
  title: string;
  description: string;
  status: ActionItemStatus;
  priority: NotificationPriority;
  targetUrl: string;
  deadline?: string;
  sourceEntityId: string;
  idempotencyKey: string;
  version: number;
  completedAt?: string;
  dismissedAt?: string;
  createdAt: string;
}

export interface NotificationTemplateVersionDto {
  templateId: string;
  version: number;
  locale: string;
  titleTemplate: string;
  bodyTemplate: string;
  actionUrlTemplate?: string;
  checksumSha256: string;
  createdBy: string;
  createdAt: string;
}

export interface NotificationPolicyVersionDto {
  policyId: string;
  version: number;
  minMaterialityLevel: string;
  cooldownWindowSeconds: number;
  maxPerWindow: number;
  allowedChannels: NotificationChannel[];
  fallbackPrecedence: NotificationChannel[];
  checksumSha256: string;
  activatedBy: string;
  activatedAt: string;
}

export interface NotificationPreferenceDto {
  userId: string;
  channel: NotificationChannel;
  status: NotificationPreferenceStatus;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone: string;
  categoryOverrides?: Record<string, boolean>;
  version: number;
  updatedAt: string;
}

export interface NotificationSuppressionDto {
  suppressionId: string;
  userId: string;
  sourceEventId: string;
  sourceDecisionDiffId: string;
  notificationType: string;
  suppressionReason: SuppressionReason;
  policyId: string;
  policyVersion: number;
  policyChecksumSha256: string;
  originalEvaluationTime: string;
  nextEligibleDeliveryTime?: string;
  createdAt: string;
}

export interface OutboundMessageDto {
  notificationId: string;
  deliveryId: string;
  recipientUserId: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  actionUrl?: string;
  priority: NotificationPriority;
  deliveryIdempotencyKey: string;
}

export interface OutboundMetadataDto {
  sourceEventId: string;
  correlationId?: string;
  causationId?: string;
  rootEventId?: string;
}

export interface DeliveryResultDto {
  success: boolean;
  providerMessageId?: string;
  providerStatus: string;
  acceptedAt: Date;
  failureCategory?: FailureCategory;
  retryable: boolean;
  providerResponseCode?: string;
  providerResponseMetadataSanitized?: Record<string, unknown>;
  durationMs: number;
  providerName: string;
}

export interface ReplayNotificationDto {
  isVerified: boolean;
  originalChecksum: string;
  replayChecksum: string;
  isMatch: boolean;
  mismatchReason?: string;
  renderedTitle: string;
  renderedBody: string;
  renderedActionUrl?: string;
  templateVersion: number;
  policyVersion: number;
}
