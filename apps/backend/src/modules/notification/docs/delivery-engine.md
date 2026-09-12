# Delivery Engine Document

## Delivery Guarantees
Guarantees **at-least-once processing with idempotent delivery attempts and duplicate-resistant notification creation**.

- Delivery Idempotency Key: `deliveryIdempotencyKey = notificationId + '_' + channel + '_gen' + attemptGeneration`.
- Separates logical Notification lifecycle from per-channel `NotificationDelivery` and `NotificationDeliveryAttempt` records.
