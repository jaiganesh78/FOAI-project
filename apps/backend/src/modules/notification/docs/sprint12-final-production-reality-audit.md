# Sprint 12 — Final Production-Reality Audit Report

## Audit Metadata

| Field | Value |
|-------|-------|
| **Audit Date** | 2026-08-12 |
| **Audit Phase** | Final Independent Empirical Production Audit |
| **System Under Audit** | Sprint 12 — Enterprise Citizen Notification, Action Center, Multi-Channel Delivery & Decision Communication Platform |
| **Repository** | `D:/FOAI_PROJECT` |
| **Auditor Roles** | Principal Backend Engineer, Production Reliability Engineer, Database Engineer, Security Auditor, Adversarial Test Engineer |
| **Mandate** | DO NOT TRUST previous audits. Reproduce evidence independently. |

---

## 1. Executive Verdict

> **C. RELEASE CANDIDATE — EMPIRICAL GAPS REMAIN**
>
> Sprint 12 contains **3 unresolved confirmed defects** (DEF-001, DEF-003, DEF-006) and
> **8 critical production behaviours** that remain unproven due to the absence of real database
> integration tests. The system logic is substantially correct, but previous "PRODUCTION READY"
> claims were overstated relative to the actual evidence tier of mock-only testing.

---

## 2. Audit Objective

Convert Sprint 12 from:

> *"We have documented that the system should work."*

to:

> *"We have executable evidence showing which production contracts actually work, which are only
> partially verified, and which remain unproven."*

---

## 3. Audit Scope

All files under `apps/backend/src/modules/notification/`, including:
- 9 services: Orchestrator, Policy, Channel, Renderer, Supersession, ActionCenter, Outbox, Replay, Analytics
- 1 repository (PrismaNotificationRepository)
- 2 controllers (notification, action-center)
- 4 channel adapters (IN_APP, EMAIL, SMS, PUSH)
- 9 Prisma models
- 37 documentation files

Also inspected: `packages/shared/`, `apps/backend/prisma/schema.prisma`, Sprint 11 integration boundary.

---

## 4. Environment

| Component | Version |
|-----------|---------|
| Node.js | As per workspace |
| Vitest | 3.2.7 |
| TypeScript | 5.7.3 |
| @prisma/client | ^6.3.0 |
| NestJS | ^11.0.6 |
| **Database** | **NOT CONNECTED** (all tests use mock repository) |
| **External Providers** | **NOT CONNECTED** (adapters are stubs) |

---

## 5. Exact Commands Executed

```bash
# Build shared package
npx pnpm --filter @gpios/shared build
# → PASS (0 errors)

# TypeScript typecheck
npx pnpm --filter @gpios/backend typecheck
# → PASS (0 errors, after fixing unused imports in audit spec)

# Original 48-test suite
npx vitest run src/modules/notification/services/notification.service.spec.ts
# → PASS 48/48

# New production-reality audit suite (this audit)
npx vitest run src/modules/notification/services/sprint12.production-reality.spec.ts
# → PASS 78/78
```

---

## 6. Test Infrastructure

| Test Type | Harness | DB Connected | External Providers |
|-----------|---------|--------------|-------------------|
| Existing 48 tests | Vitest + mock `INotificationRepository` | ❌ No | ❌ No |
| New 78 audit tests | Vitest + mock `INotificationRepository` | ❌ No | ❌ No (stubs only) |
| DB Integration | **NONE** | ❌ No | ❌ No |
| HTTP/API (supertest) | **NONE** | ❌ No | ❌ No |
| Process crash simulation | **NONE** | ❌ No | ❌ No |

**Critical gap**: No test suite in this repository exercises real database operations. All 126 tests (48 + 78) cross the mock boundary.

---

## 7. Evidence Standards Applied

| Standard | Applied |
|---------|---------|
| No claim without executable evidence | ✅ Yes — all 89 claims classified by tier |
| Code inspection ≠ runtime verification | ✅ Yes — explicitly distinguished |
| Mock-only test ≠ production verification | ✅ Yes — explicitly classified as MOCK_ONLY |
| Defects not hidden | ✅ Yes — 5 defects reported, DEF-004 downgraded after investigation |

---

## 8. Previous Claim Reconciliation

See [sprint12-final-production-gap-matrix.md](./sprint12-final-production-gap-matrix.md) for full table.

**Summary**: Of 36 major prior claims:
- 12 (33%): EMPIRICALLY_PROVEN by this audit
- 6 (17%): NOW_PROVEN by code verification
- 8 (22%): PREVIOUSLY_ASSERTED (mock-only, not upgraded)
- 4 (11%): STILL_UNPROVEN
- **6 (17%): CONTRADICTED** by evidence

---

## 9. Database Verification

**Evidence tier: CODE_VERIFIED only — NOT DB_VERIFIED**

### Schema Constraints (CODE_VERIFIED)

| Constraint | Schema Location | Verified |
|-----------|----------------|---------|
| `notifications.@@unique([userId, idempotencyKey])` | line 2874 | CODE_VERIFIED |
| `notifications.@@unique([sourceEventId, notificationType, userId])` | line 2875 | CODE_VERIFIED |
| `notification_deliveries.@@unique([notificationId, channel])` | line 2906 | CODE_VERIFIED |
| `notification_deliveries.@@unique([deliveryIdempotencyKey])` | line 2907 | CODE_VERIFIED |
| `citizen_action_items.@@unique([userId, idempotencyKey])` | line 2956 | CODE_VERIFIED |
| `notification_deliveries.notification (onDelete: Cascade)` | line 2903 | CODE_VERIFIED |

**Limitation**: Whether these constraints actually enforce uniqueness under concurrent inserts has NOT been tested with a real database. The Prisma schema defines them; SQLite/PostgreSQL behavior under load is unverified.

---

## 10. Transaction Verification

**Evidence tier: CODE_VERIFIED — NOT DB_VERIFIED**

The orchestrator uses a single `prisma.$transaction()` block (lines 91-159) containing:
- `tx.citizenActionItem.create()`
- `tx.notification.create()`
- `tx.notificationDelivery.create()` (per channel)
- `tx.factVerificationEvent.create()`

Provider API calls are invoked AFTER the transaction commits (lines 168-172): **CODE_VERIFIED CORRECT**.

**Not verified**: Whether a partial failure inside the transaction correctly rolls back all records. Requires real DB + injected failure.

---

## 11. Idempotency Verification

| Layer | Mechanism | Evidence | Limitation |
|-------|-----------|----------|-----------|
| Event ingestion | `findNotificationBySourceEvent` check | `TEST_VERIFIED` (PA-5-1) | DB UNIQUE not tested |
| Notification creation | `userId_idempotencyKey` UNIQUE | `CODE_VERIFIED` | DB enforcement not tested |
| Delivery creation | `deliveryIdempotencyKey` UNIQUE | `CODE_VERIFIED` | DB enforcement not tested |
| Adapter-level | `deliveryIdempotencyKey` passed | `TEST_VERIFIED` (PA-4-8) | External provider enforcement NOT verified |

**Idempotency boundary**: The system provides application-level deduplication. The idempotency key reaches the adapter but whether external providers de-duplicate on it is **NOT VERIFIED**.

---

## 12. Concurrency Verification

### DEFECT DEF-001 — TOCTOU Race in `acquireDeliveryLease`

**Status: OPEN P0 DEFECT**

```
Repository: prisma-notification.repository.ts (lines 156-178)

CURRENT CODE:
  const delivery = await this.prisma.notificationDelivery.findUnique(...)  // Step 1: READ
  if (delivery.status !== 'PENDING' ...) return null;                       // Step 2: CHECK
  return this.prisma.notificationDelivery.update(...)                       // Step 3: WRITE

PROBLEM:
  Between Step 1 and Step 3, another worker can also complete Step 1 and Step 2.
  Both workers pass the guard. Both write LEASED. Both proceed to invoke the provider.
  This is a classic TOCTOU (Time-Of-Check-Time-Of-Use) race condition.

CONFIRMED BY: Test DEF-001 in sprint12.production-reality.spec.ts — both workers
              invoked the provider when concurrent acquisition was simulated.

CORRECT FIX WOULD BE:
  this.prisma.notificationDelivery.updateMany({
    where: {
      id: deliveryId,
      status: { in: ['PENDING', 'RETRY_SCHEDULED'] },
      OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lte: now } }],
    },
    data: { status: 'LEASED', leaseOwner: workerId, leaseExpiresAt: expiresAt, ... }
  })
  // Then check: if (result.count === 0) return null;
```

### DEFECT DEF-002 — TOCTOU in CAS Updates

`updateNotificationStatus`, `updateDeliveryStatus`, `updateActionItemStatus` all use the same two-step pattern. The CAS version check is not atomic.

**Status: OPEN P1 DEFECT**

---

## 13. Worker Crash Verification

**Evidence tier: CODE_VERIFIED — NOT EMPIRICALLY VERIFIED**

The lease expiry mechanism is correctly implemented in code:
```typescript
// prisma-notification.repository.ts line 165
if (delivery.leaseExpiresAt && delivery.leaseExpiresAt > now && delivery.leaseOwner !== workerId) {
  return null; // Lease held by active worker
}
// If expired (leaseExpiresAt <= now), re-acquisition proceeds
```

**NOT VERIFIED**: Actual process-level crash followed by lease expiry and worker B re-acquisition has NOT been empirically simulated. No process kill + time advance test was performed.

---

## 14. Retry Verification

### DEFECT DEF-006 — Retry Backoff Timing Not Implemented

**Status: OPEN P1 DEFECT**

Previous documentation claimed: `5s → 15s → 45s → 135s → 405s` exponential backoff.

**Reality**:
- `NotificationDelivery` schema has **no `nextRetryAt` field**
- `NotificationOutboxService` sets `status: RETRY_SCHEDULED` with no scheduled time
- Workers polling `RETRY_SCHEDULED` deliveries pick them up **immediately** — no delay

**What IS verified** (`TEST_VERIFIED`):
- `retryCount` increments correctly
- `retryCount >= maxRetries` → `PERMANENT_FAILURE` (correct boundary)
- `retryable: false` → `PERMANENT_FAILURE` immediately (correct)

---

## 15. State Machine Verification

**Evidence tier: TEST_VERIFIED**

| Machine | States Tested | Legal Transitions | Illegal Transitions | Terminal Immunity |
|---------|--------------|-------------------|--------------------|--------------------|
| Action Item | 9 states | 15 legal transitions tested | 9 illegal transitions tested | 4 terminal states immune ✅ |
| Notification | 10 states | Partial (CREATED→DELIVERED→READ chain via mocks) | Partial | Not fully exercised |
| Delivery | 7 states | Partial (PENDING→LEASED→SUCCEEDED and PENDING→RETRY_SCHEDULED→PERMANENT_FAILURE) | Partial | Not fully exercised |

---

## 16. Supersession Verification

**Evidence tier: TEST_VERIFIED (all 9 Action Item states)**

| State | Behaviour | Test | Status |
|-------|-----------|------|--------|
| PENDING | SUPERSEDED | PA-3-SUPERSEDE | ✅ PASS |
| VIEWED | SUPERSEDED | PA-3-SUPERSEDE | ✅ PASS |
| ACKNOWLEDGED | SUPERSEDED | PA-3-SUPERSEDE | ✅ PASS |
| ACTION_REQUIRED | SUPERSEDED | PA-3-SUPERSEDE | ✅ PASS |
| DISMISSAL_REQUESTED | SUPERSEDED | PA-3-SUPERSEDE | ✅ PASS |
| COMPLETED | IMMUNE | PA-3-IMMUNE | ✅ PASS |
| DISMISSED | IMMUNE | PA-3-IMMUNE | ✅ PASS |
| EXPIRED | IMMUNE | PA-3-IMMUNE | ✅ PASS |
| SUPERSEDED | IMMUNE | PA-3-IMMUNE | ✅ PASS |
| New notification | Not self-superseded | PA-3-NEW-NOTIF | ✅ PASS |

---

## 17. Outbox Verification

**Evidence tier: CODE_VERIFIED**

Outbox pattern implementation:
- Provider calls happen outside the DB transaction: **CODE_VERIFIED ✅**
- Delivery attempt log created for every attempt: **TEST_VERIFIED ✅**
- `acquireDeliveryLease` is non-atomic (TOCTOU): **DEFECT DEF-001 ❌**
- `acquireOutboxLease` has same TOCTOU pattern: **CODE_VERIFIED defect ❌**

---

## 18. Template Security Verification

**Evidence tier: TEST_VERIFIED**

| Scenario | Test | Result |
|---------|------|--------|
| Script injection stripped | PA-6-1 | ✅ PASS |
| Missing variable → BadRequestException | PA-6-2 | ✅ PASS |
| Oversized body → BadRequestException | PA-6-3 | ✅ PASS |
| Unknown template version → BadRequestException | PA-6-4 | ✅ PASS |
| Deterministic SHA-256 | PA-6-5 | ✅ PASS |
| Different params → different checksums | PA-6-6 | ✅ PASS |

---

## 19. Replay Verification

### DEFECT DEF-003 — Replay Service Parameter Mismatch

**Status: OPEN P1 DEFECT**

```typescript
// notification-replay.service.ts (line 21-25):
const rendered = await this.renderer.renderTemplate({
  templateId: notif.templateId,
  version: notif.templateVersion,
  parameters: { title: notif.title, body: notif.body },  // ← BUG
});

// Template expects: {{policyTitle}}, {{newStatus}}
// Replay provides:  { title: "Eligibility Update for Gov Policy", body: "..." }
// Result: {{policyTitle}} unresolved → BadRequestException in real execution
```

**Test evidence**: `DEF-003 EXPOSED: real replay produces Unresolved Placeholders error`
The test `PA-7-4` demonstrates that non-mocked replay always throws.

---

## 20. Policy Verification

**Evidence tier: TEST_VERIFIED (7 scenarios)**

| Check | Test | Status |
|-------|------|--------|
| Material event allowed | PA-1-1 | ✅ PASS |
| Immaterial event suppressed + audit log | PA-1-2 | ✅ PASS |
| Quiet hours defer MEDIUM | PA-1-3 | ✅ PASS |
| CRITICAL bypasses quiet hours | PA-1-4 | ✅ PASS |
| policyId/version/checksum preserved | PA-1-1, PA-1-5 | ✅ PASS |
| Boundary: 22:00 = quiet (midnight-crossing) | PA-1-5 | ✅ PASS |
| Boundary: 08:00 = not quiet | PA-1-6 | ✅ PASS |
| Boundary: 07:00 = not quiet (exclusive) | PA-1-7 | ✅ PASS |

---

## 21. API Security Verification

**Evidence tier: CODE_VERIFIED — NOT HTTP_VERIFIED**

| Security Check | Code Location | Evidence | HTTP Tested |
|---------------|--------------|---------|-------------|
| JWT guard on all notification endpoints | `@UseGuards(JwtAuthGuard)` on `NotificationController` | CODE_VERIFIED | ❌ No |
| JWT guard on action center | `@UseGuards(JwtAuthGuard)` on `ActionCenterController` | CODE_VERIFIED | ❌ No |
| Notification ownership: userId check | orchestrator.ts line 207 | CODE_VERIFIED | ❌ No |
| Action item ownership: userId check | action-center.service.ts line 98-99 | TEST_VERIFIED (PA-8-2) | ❌ No |
| Analytics: OFFICER/ADMIN role | controller.ts line 120-122 | CODE_VERIFIED | ❌ No |
| Template creation: OFFICER/ADMIN | controller.ts line 128-130 | CODE_VERIFIED | ❌ No |
| Policy creation: OFFICER/ADMIN | controller.ts line 140-141 | CODE_VERIFIED | ❌ No |

---

## 22. PII Verification

**Evidence tier: PARTIALLY_VERIFIED**

| Check | Evidence | Status |
|-------|----------|--------|
| requestPayloadSanitized contains only userId+channel | TEST_VERIFIED (PA-4-9) | ✅ PASS |
| No body/title in sanitized payload | TEST_VERIFIED (PA-4-9) | ✅ PASS |
| Log output contains no Aadhaar/PAN/JWT | NOT_VERIFIED — log output not captured | ❌ NOT VERIFIED |
| sanitizeText strips script tags | TEST_VERIFIED (PA-6-1) | ✅ PASS |

---

## 23. Domain Event Verification

**Evidence tier: CODE_VERIFIED**

- 15 domain events registered in `domain-event.registry.ts` including `action_item.superseded`
- `factVerificationEvent.create()` inside the notification transaction: CODE_VERIFIED
- Events emitted inside DB transaction → they roll back if transaction fails: CODE_VERIFIED (by design)
- Whether events fire on external event bus NOT verified — FactVerificationEvent is an audit log table, not an outbound bus event

---

## 24. Startup/Shutdown Verification

**Evidence tier: NOT_VERIFIED**

| Scenario | Status |
|---------|--------|
| Fail-fast on missing DATABASE_URL | NOT_VERIFIED |
| Fail-fast on missing JWT secret | NOT_VERIFIED |
| Graceful shutdown / in-flight lease handling | NOT_VERIFIED |

These scenarios require starting the actual NestJS application, which is not performed in this audit.

---

## 25. Observability Verification

**Evidence tier: CODE_VERIFIED (partial)**

Logger calls present in orchestrator and outbox service. Structured log fields (notificationId, deliveryId, workerId) appear in selected log calls. Log format and absence of PII in actual log output NOT tested.

---

## 26. Zero-AI Verification

**Evidence tier: CODE_VERIFIED + TEST_VERIFIED**

| Component | Finding | Status |
|-----------|---------|--------|
| Notification module source | No LLM/ML imports | CODE_VERIFIED ✅ |
| Channel adapters | Pure HTTP stubs, no ML | TEST_VERIFIED ✅ |
| NotificationRendererService | SHA-256 + string ops only | TEST_VERIFIED ✅ |
| Backend binary (package.json) | `langfuse` (LLM SDK) present and initialized | ⚠️ PARTIALLY_VERIFIED |

**DEF-005 Clarification required**: `langfuse` is an LLM observability/tracing SDK from core/telemetry. If Zero-AI means "no AI inference in notification processing" → **SATISFIED**. If it means "no AI packages in the binary" → **VIOLATED** (langfuse is initialized at startup).

---

## 27. Failure-Injection Results

| Injection | Test | Result |
|-----------|------|--------|
| Provider network timeout → RETRY_SCHEDULED | PA-4-6 | ✅ PASS |
| Invalid destination (non-retryable) → PERMANENT_FAILURE | PA-4-5 | ✅ PASS |
| Max retries exhausted → PERMANENT_FAILURE | PA-4-4 | ✅ PASS |
| Missing parent notification → PERMANENT_FAILURE | PA-4-7 | ✅ PASS |
| Lease acquisition fails → skip without provider call | PA-4-2 | ✅ PASS |
| Stale CAS version → CAS Conflict | PA-2-CAS | ✅ PASS |
| Cross-user ownership violation → rejected | PA-8-2 | ✅ PASS |
| Duplicate event → ingestion skipped | PA-5-1 | ✅ PASS |
| Tampered replay checksum → LOUD exception | PA-7-2 | ✅ PASS |
| Script injection → stripped | PA-6-1 | ✅ PASS |
| Concurrent workers (TOCTOU) → BOTH succeed | DEF-001 | ❌ DEFECT CONFIRMED |

---

## 28. Test Results

| Suite | Tests | Passed | Failed | Evidence Tier |
|-------|-------|--------|--------|---------------|
| notification.service.spec.ts (original) | 48 | 48 | 0 | MOCK_ONLY |
| sprint12.production-reality.spec.ts (this audit) | 78 | 78 | 0 | UNIT_BEHAVIORAL + CODE_VERIFIED |
| TypeScript typecheck | — | PASS | 0 errors | BUILD_VERIFIED |
| DB integration | **NOT RUN** | — | — | NOT_VERIFIED |
| HTTP/supertest | **NOT RUN** | — | — | NOT_VERIFIED |
| **TOTAL** | **126** | **126** | **0** | |

---

## 29. Defects Found

| ID | Severity | Title | Status |
|----|----------|-------|--------|
| DEF-001 | **P0** | TOCTOU race in `acquireDeliveryLease` — concurrent workers can both execute provider | 🔴 OPEN |
| DEF-002 | **P1** | TOCTOU in CAS updates (`updateNotificationStatus`, `updateDeliveryStatus`, `updateActionItemStatus`) | 🔴 OPEN |
| DEF-003 | **P1** | Replay service passes rendered text as template params → always fails in real execution | 🔴 OPEN |
| DEF-005 | **P2** | `langfuse` (LLM SDK) in backend binary — Zero-AI constraint clarification needed | 🟡 OPEN (needs clarification) |
| DEF-006 | **P1** | Retry backoff timing (5s/15s/45s/135s/405s) documented but NOT implemented | 🔴 OPEN |

---

## 30. Fixed Defects

| ID | Previously Suspected | Finding | Status |
|----|--------------------|---------|----|
| DEF-004 | Outbox service passes pre-lease version to `updateDeliveryStatus` | Investigation shows `delivery.version` returned by `acquireDeliveryLease` IS the post-lease version. CAS is correct. | ✅ NOT A DEFECT |

---

## 31. Remaining Defects

4 open defects remain (DEF-001, DEF-002, DEF-003, DEF-006) plus DEF-005 awaiting scope clarification.

---

## 32. Residual Risks

| Risk | Severity | Mitigation Needed |
|------|----------|------------------|
| Duplicate provider delivery under concurrent workers | HIGH | Atomic conditional update in `acquireDeliveryLease` |
| Lost CAS update under concurrent state changes | MEDIUM | Atomic DB update or explicit WHERE-clause guard |
| Replay always broken in production | HIGH | Fix replay to store original parameters, not rendered text |
| No retry backoff timing | MEDIUM | Add `nextRetryAt` field to schema and scheduled retry polling |
| No DB integration tests | HIGH | Add Prisma test environment with real SQLite/Postgres |
| No HTTP security tests | MEDIUM | Add NestJS supertest for 401/403 boundary verification |

---

## 33. Operational Prerequisites (Before Production Deployment)

1. **Fix DEF-001**: Make `acquireDeliveryLease` atomic using conditional `updateMany`
2. **Fix DEF-002**: Apply same atomic pattern to CAS update methods
3. **Fix DEF-003**: Fix replay service to store and reuse original template parameters
4. **Fix DEF-006**: Add `nextRetryAt` field to schema and implement retry backoff scheduling
5. **Resolve DEF-005**: Clarify Zero-AI scope with product owner
6. **Add DB integration tests**: At minimum — UNIQUE constraint enforcement, transaction rollback, concurrent insert
7. **Add HTTP security tests**: At minimum — JWT missing, wrong userId, wrong role
8. **Configure external provider credentials** for live deployment
9. **Run load test** to validate lease behavior under concurrent workers against real DB

---

## 34. Evidence Ledger Reference

See [sprint12-final-evidence-ledger.md](./sprint12-final-evidence-ledger.md) — 89 claims, each classified.

---

## 35. Production Readiness Decision

**VERDICT:**

```
C. RELEASE CANDIDATE — EMPIRICAL GAPS REMAIN
```

**Reasoning**:

- The notification system has correct logic for the cases that are tested (policy, state machine, supersession, template security, ingestion deduplication).
- 126 tests pass with 0 TypeScript errors.
- However, **3 confirmed P0/P1 defects remain open** (TOCTOU race, broken replay, no retry timing) that represent real production failure scenarios.
- **All 126 tests use a fully-mocked repository**. Real database behavior (constraint enforcement, transaction rollback, concurrent insert deduplication) has ZERO empirical verification.
- Previous audit labels of "PRODUCTION READY — EMPIRICALLY VERIFIED" were not supported by the evidence tier of mock-only tests.

**Sprint 13 authorization**:
Sprint 13 MAY begin for planning purposes. Production deployment of Sprint 12 in isolation requires DEF-001, DEF-003, and DEF-006 to be resolved first.

---

*Document: `sprint12-final-production-reality-audit.md`*
*Created: 2026-08-12 | Sprint 12 Final Empirical Production Audit*
