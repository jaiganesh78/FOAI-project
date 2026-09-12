# Sprint 12.2 Concurrency & Optimistic CAS Audit

## 1. Concurrency Control Architecture
All mutable state operations in Sprint 12 enforce **Optimistic Concurrency Control** through integer `version` tracking and CAS `expectedVersion` assertions:

```typescript
if (expectedVersion !== undefined && existing.version !== expectedVersion) {
  throw new ConflictException(
    `CAS Concurrency Conflict: Expected version ${expectedVersion}, but current is ${existing.version} on Entity '${id}'.`
  );
}
```

---

## 2. Race Condition Matrix & Safety Verification

| Scenario | Trigger / Race Condition | Handling Mechanism | Outcome | Verified |
|---|---|---|---|---|
| **RACE-01** | Two outbox workers attempt to claim the same `NotificationDelivery` record simultaneously | SQL Compare-and-Swap UPDATE query with `leaseOwner` and `leaseExpiresAt` check | Only 1 worker succeeds; 2nd worker receives 0 updated rows and skips cleanly | **PASS** |
| **RACE-02** | Two identical `decision.state_changed` domain events arrive concurrently | Database `@@unique([sourceEventId, notificationType, userId])` constraint | 1st event persists notification; 2nd event triggers persistent deduplication and returns cleanly | **PASS** |
| **RACE-03** | Citizen acknowledges action item while worker attempts action item supersession | Optimistic CAS version update on `CitizenActionItem` | Whichever transaction commits 1st advances version; 2nd transaction receives CAS conflict exception without data corruption | **PASS** |
| **RACE-04** | Worker crashes after sending outbound message but before DB status update | Lease duration (30s) expires; secondary worker re-claims delivery intent using `deliveryIdempotencyKey` | Provider accepts idempotency key or provider-neutral mock adapter deduplicates; delivery completes safely | **PASS** |
| **RACE-05** | Citizen updates channel preference to `DISABLED` while delivery is queued | Outbox worker re-queries `findPreference` during channel delivery execution | Delivery check detects preference opt-out and suppresses delivery intent cleanly | **PASS** |
