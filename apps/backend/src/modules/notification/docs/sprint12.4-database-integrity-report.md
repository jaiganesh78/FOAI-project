# Sprint 12.4 Database Migration & Schema Integrity Report

## 1. Prisma Model Inventory & Constraints
Sprint 12 introduces 9 Prisma models with DB-enforced uniqueness:
1. `Notification`: Primary logical notification aggregate (`@@unique([userId, idempotencyKey])`, `@@unique([sourceEventId, notificationType, userId])`).
2. `NotificationDelivery`: Per-channel delivery intent (`@@unique([deliveryIdempotencyKey])`, `@@index([status, leaseExpiresAt])`).
3. `NotificationDeliveryAttempt`: Execution attempt log (`@@index([deliveryId, createdAt])`).
4. `CitizenActionItem`: Action item tasks (`@@index([userId, status])`).
5. `NotificationTemplateVersion`: Immutable templates (`@@unique([templateId, version, locale])`).
6. `NotificationPolicyVersion`: Immutable policies (`@@unique([policyId, version])`).
7. `NotificationPreference`: Citizen channel preferences (`@@unique([userId, category])`).
8. `NotificationSuppression`: Suppression record (`@@index([userId, createdAt])`).
9. `NotificationOutbox`: Transactional outbox (`@@index([status, createdAt])`).

---

## 2. Foreign Key Cascades & Cascade Rules
- Foreign key relations from `Notification` to `NotificationDelivery` and `NotificationDeliveryAttempt` are configured with `onDelete: Cascade` to ensure database integrity upon record cleanup.
