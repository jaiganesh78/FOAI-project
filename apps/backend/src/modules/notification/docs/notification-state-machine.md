# Notification State Machine Document

## Logical Notification States (10 States)
- `CREATED`: Logical notification record persisted in DB.
- `RENDERED`: Template rendered with localized parameters.
- `QUEUED`: Per-channel delivery intents created in `NotificationDelivery`.
- `PARTIALLY_DELIVERED`: At least 1 channel delivered, but not all active channels completed.
- `DELIVERED`: Confirmed delivered by provider (or rendered in-app for `IN_APP`).
- `READ`: Citizen viewed notification in-app.
- `FAILED`: Delivery failed on all channels without recovery.
- `SUPPRESSED`: Notification suppressed by policy/cooldown/quiet hours.
- `SUPERSEDED`: Replaced by a newer decision snapshot.
- `EXPIRED`: Time-to-live expired before read/acknowledgement.
