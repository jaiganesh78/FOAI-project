export enum RecommendationStatus {
  ACTIVE = 'ACTIVE',
  SUPERSEDED = 'SUPERSEDED',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
}

export enum RecommendationPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum RecommendationLifecycleStatus {
  GENERATED = 'GENERATED',
  RECOMMENDED = 'RECOMMENDED',
  VIEWED = 'VIEWED',
  SAVED = 'SAVED',
  IN_PROGRESS = 'IN_PROGRESS',
  APPLIED = 'APPLIED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
}

export enum ApplicationReadinessStatus {
  READY = 'READY',
  PARTIALLY_READY = 'PARTIALLY_READY',
  MISSING_DOCUMENTS = 'MISSING_DOCUMENTS',
  NOT_READY = 'NOT_READY',
}

export enum RecommendationChangeType {
  ADDED = 'ADDED',
  REMOVED = 'REMOVED',
  MOVED = 'MOVED',
  UPDATED = 'UPDATED',
  EXPIRED = 'EXPIRED',
}

export enum RecommendationFeedbackAction {
  VIEWED = 'VIEWED',
  IGNORED = 'IGNORED',
  SAVED = 'SAVED',
  DISMISSED = 'DISMISSED',
  APPLIED = 'APPLIED',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  HIDDEN = 'HIDDEN',
}
