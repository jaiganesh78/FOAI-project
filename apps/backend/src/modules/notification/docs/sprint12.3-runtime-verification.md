# Sprint 12.3 Runtime & Contract Verification Matrix

| Contract Area | Intended Behavioral Contract | Code Implementation | Prisma Schema | Shared DTO / Event | Vitest Evidence | Status |
|---|---|---|---|---|---|---|
| **Notification States** | 10 logical states (`CREATED` -> `READ` / `SUPERSEDED` / `EXPIRED`) | `PrismaNotificationRepository` | `model Notification` | `NotificationStatus` | Scenarios 1-6 | **VERIFIED** |
| **Delivery Intent States** | 7 per-channel states (`PENDING` -> `SUCCEEDED` / `PERMANENT_FAILURE`) | `PrismaNotificationRepository` | `model NotificationDelivery` | `DeliveryStatus` | Scenarios 29-34 | **VERIFIED** |
| **Delivery Attempt Audit** | 7 attempt states (`PENDING` -> `SUCCEEDED` / `DEAD_LETTERED`) | `NotificationOutboxService` | `model NotificationDeliveryAttempt` | `DeliveryAttemptStatus` | Scenario 34 | **VERIFIED** |
| **Action Center Lifecycle** | 9 formal states (`PENDING` -> `COMPLETED` / `SUPERSEDED`) | `ActionCenterService` | `model CitizenActionItem` | `ActionItemStatus` | Scenarios 17-24 | **VERIFIED** |
| **Action Item Immunity** | `COMPLETED`, `DISMISSED`, `EXPIRED`, `SUPERSEDED` are 100% IMMUNE | `SupersessionService` | `model CitizenActionItem` | `ActionItemStatus` | Scenarios 27-28 | **VERIFIED** |
| **Outbox CAS Leasing** | Atomic CAS claim query setting `leaseOwner` & 30s expiry | `PrismaNotificationRepository` | `model NotificationDelivery` | `DeliveryStatus` | Scenario 29 | **VERIFIED** |
| **Persistent Idempotency** | UNIQUE DB constraints on source event & idempotency key | DB Schema Constraints | `model Notification` & `Delivery` | `NotificationDto` | Scenario 41 | **VERIFIED** |
| **CAS Optimistic Versioning** | `version` check on all mutable state updates | Repository & Services | `model Notification` & `ActionItem` | `ActionItemTransitionSchema` | Scenario 20 | **VERIFIED** |
| **Timezone Quiet Hours** | 22:00 -> 07:00 overnight range with CRITICAL bypass | `NotificationPolicyService` | `model NotificationPreference` | `NotificationPriority` | Scenarios 3-4 | **VERIFIED** |
| **Template Checksum Replay** | Immutable template version with SHA-256 validation | `NotificationReplayService` | `model NotificationTemplateVersion` | `ReplayNotificationDto` | Scenarios 35-38 | **VERIFIED** |
| **Security & Ownership** | Identity from `@CurrentUser()`; 403 on cross-citizen access | REST Controllers | `@CurrentUser()` | JwtAuthGuard | Scenario 21 | **VERIFIED** |
| **Zero-AI Constraint** | 100% rule-based execution; 0 LLM / 0 RAG / 0 ML | Monorepo Codebase | N/A | N/A | Scenario 48 | **VERIFIED** |
