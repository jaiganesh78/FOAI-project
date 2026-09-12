# Outbox & Delivery Architecture Contract

## Architectural Separation of Concerns
The communication execution layer maintains strict separation between event persistence, delivery intent, and execution attempt logs:

```text
Notification (Logical Citizen Communication)
     ↓ (1:N)
NotificationDelivery (Per-Channel Intent & CAS Lease Owner)
     ↓ (1:N)
NotificationDeliveryAttempt (Sanitized Per-Attempt Execution Audit)
```

In parallel, `NotificationOutbox` persists domain events transactionally for EventBus publication.

---

## Worker Lease Acquisition Protocol
1. **Source of Work**: `NotificationDelivery` records in `PENDING` or `RETRY_SCHEDULED` status whose lease has expired or was never acquired (`leaseExpiresAt IS NULL OR leaseExpiresAt < NOW()`).
2. **Atomic CAS Lease Query**:
   ```sql
   UPDATE notification_deliveries
   SET status = 'LEASED', leaseOwner = $workerId, leaseExpiresAt = $expiresAt, version = version + 1
   WHERE id = $deliveryId
     AND status IN ('PENDING', 'RETRY_SCHEDULED')
     AND (leaseExpiresAt IS NULL OR leaseExpiresAt < NOW())
   ```
3. **Lease Duration**: 30,000 ms (30 seconds).
4. **Execution Boundary**: Provider API calls execute **OUTSIDE** database transactions.
5. **Crash Recovery**: If Worker A crashes during provider execution, Worker B re-acquires the lease cleanly after 30 seconds without state corruption.
6. **Retry Schedule**: Exponential backoff up to 5 retries maximum: 5s, 15s, 45s, 135s, 405s.
