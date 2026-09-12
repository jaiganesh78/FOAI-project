# Sprint 12 — Enterprise Citizen Notification, Action Center, Multi-Channel Delivery & Decision Communication Platform

## Overview
Sprint 12 acts as a downstream **communication orchestration and action projection layer** for the GPIOS platform. It converts material decision changes, policy activations, prerequisite updates, and deadline changes into durable, auditable citizen notifications and actionable tasks.

The system operates under a **STRICT ZERO AI CONSTRAINT**:
- **0 LLM / 0 RAG / 0 Embeddings / 0 ML / 0 Probabilistic Generation / 0 Conversational AI** in notification processing.
- All notification evaluation, channel routing, template rendering, delivery retries, action lifecycle transitions, and suppression rules are **100% deterministic, rule-based, versioned, explainable, and auditable**.
- `langfuse` (LLM observability tracing SDK) is present in `core/telemetry/` for general backend tracing. It is **NOT imported by any notification module service**. Zero-AI processing constraint is **SATISFIED**.

---

## Final Audit Status

> **VERDICT: B. RELEASE READY WITH OPERATIONAL PREREQUISITES**
> Audited: 2026-08-12 | See [Master Production-Reality Audit](./sprint12-master-production-reality-audit.md)

| Metric | Result |
|--------|--------|
| **Test suites** | 2 suites (48 original + 106 audit/remediation) |
| **Total tests** | 154 |
| **Passing** | 154 / 154 |
| **TypeScript errors** | 0 |
| **Prisma client** | v6.19.3 regenerated |
| **P0 defects open** | 0 |
| **P1 defects open** | 0 |
| **Delivery guarantee** | **At-least-once** (provider idempotency key passed; external enforcement NOT verified) |

### Defect Remediation Status

| ID | Sev | Description | Status |
|----|-----|-------------|--------|
| **DEF-001** | P0 | `acquireDeliveryLease` TOCTOU race | ✅ **VERIFIED_FIXED** — atomic `updateMany` WHERE |
| **DEF-002** | P1 | CAS `updateNotificationStatus/DeliveryStatus/ActionItemStatus` TOCTOU | ✅ **VERIFIED_FIXED** — atomic `updateMany` with version guard |
| **DEF-003** | P1 | Replay passes rendered text as template params | ✅ **VERIFIED_FIXED** — `templateParameters` field added; replay uses original vars |
| **DEF-004** | — | CAS version mismatch in outbox | ✅ **CLOSED** (not a defect) |
| **DEF-005** | P2 | `langfuse` in binary — Zero-AI scope | ✅ **CLOSED** — not a processing violation; tracing SDK only |
| **DEF-006** | P1 | Retry backoff timing not implemented | ✅ **VERIFIED_FIXED** — `nextRetryAt` field + `RETRY_BACKOFF_MS` + scheduling guard |

### Operational Prerequisites (Required Before Production Deployment)

1. Configure `DATABASE_URL` pointing to PostgreSQL with pgvector
2. Apply Prisma migration: `npx prisma migrate dev --name add-template-params-and-next-retry-at`
3. Configure channel provider credentials (SES, Twilio, FCM)
4. Run DB integration test suite (requires live PostgreSQL)
5. Run HTTP security test suite (requires live NestJS)

---

## Core Components
1. **NotificationIngestionService**: Ingests material decision changes with persistent deduplication (`sourceEventId`, `notificationType`, `userId`). *(UNIT_BEHAVIORAL verified)*
2. **NotificationPolicyService**: Evaluates policy rules (`NotificationPolicyVersion`), timezone-aware quiet hours, cooldowns, and suppression persistence. *(UNIT_BEHAVIORAL verified — 7 scenarios)*
3. **ChannelResolutionService**: Resolves allowed channels (`IN_APP`, `EMAIL`, `SMS`, `PUSH`) based on priority, policy precedence, and citizen preferences. *(CODE_VERIFIED)*
4. **NotificationRendererService**: Validates template variables, escapes text, and renders localized title/body/actionUrl with SHA-256 checksum generation. *(UNIT_BEHAVIORAL verified — deterministic, Zero-AI)*
5. **SupersessionService**: Supersedes active unread notifications matching semantic identity `(userId, sourceReEvaluationId)`. *(All 9 action item states UNIT_BEHAVIORAL verified)*
6. **ActionCenterService**: Manages citizen action items (`CitizenActionItem`) with strict 9-state machine. *(15 legal + 9 illegal transitions UNIT_BEHAVIORAL verified)*
7. **NotificationOutboxService**: Outbox processing with atomic worker leasing (30s), exponential retry backoff (5/15/45/135/405s), outbound adapter execution. *(DEF-001 FIXED, DEF-006 FIXED)*
8. **NotificationReplayService**: Reconstructs past notifications from stored original `templateParameters` + template version checksums. *(DEF-003 FIXED — UNIT_BEHAVIORAL verified)*
9. **NotificationAnalyticsService**: Provides operational metrics. *(CODE_VERIFIED)*
10. **NotificationOrchestratorService**: Master facade managing atomic `$transaction`, domain event generation, endpoint execution. *(Transaction structure CODE_VERIFIED)*

---

## Delivery Guarantee

The system provides **at-least-once delivery at the external provider boundary**:
- Worker lease acquisition: **atomic** (DEF-001 FIXED — single `UPDATE WHERE` at DB level)
- `deliveryIdempotencyKey` passed to all channel adapters (TEST_VERIFIED)
- Retry scheduling: **exponential backoff** (DEF-006 FIXED — `nextRetryAt` persisted)
- External provider idempotency: **NOT_VERIFIED** — depends on provider (SES/Twilio/FCM) accepting the idempotency key

---

## Technical Documentation Catalog

### Final Audit Documents (Authoritative)
- **[Sprint 12 Master Production-Reality Audit](./sprint12-master-production-reality-audit.md)** ← Authoritative verdict — supersedes all prior audits
- **[Sprint 12 Final Evidence Ledger](./sprint12-final-evidence-ledger.md)** ← 89 claims classified by evidence tier
- **[Sprint 12 Final Production Gap Matrix](./sprint12-final-production-gap-matrix.md)** ← Prior claim reconciliation

### Architecture & Design
- [Architecture](./architecture.md)
- [Notification State Machine](./notification-state-machine.md)
- [Delivery Engine](./delivery-engine.md)
- [Outbox Worker](./outbox-worker.md)
- [Policy Engine](./policy-engine.md)
- [Template Rendering](./template-rendering.md)
- [Channel Resolution](./channel-resolution.md)
- [Supersession](./supersession.md)
- [Action Center](./action-center.md)
- [Replay Engine](./replay-engine.md)
- [Security Model](./security.md)
- [Failure Recovery](./failure-recovery.md)
- [Sequence Diagram](./sequence-diagram.md)
- [Test Strategy](./test-strategy.md)

### Historical Audit Documents (Preserved as Historical Evidence — NOT Authoritative)
> [!WARNING]
> The following documents contain claims that were overstated relative to the evidence tier
> at the time. They are preserved as historical records. The Master Audit above is authoritative.

- [Sprint 12.1 Reconnaissance](./sprint12.1-reconnaissance.md)
- [Contract Matrix](./sprint12-contract-matrix.md)
- [Sprint 12.2 Adversarial Audit](./sprint12.2-adversarial-audit.md)
- [Sprint 12.2 Runtime Integrity Matrix](./sprint12.2-runtime-integrity-matrix.md)
- [Sprint 12.2 Contract Lock](./sprint12.2-contract-lock.md)
- [Sprint 12.3 Adversarial Production Audit](./sprint12.3-adversarial-production-audit.md)
- [Sprint 12.3 Runtime Verification](./sprint12.3-runtime-verification.md)
- [Sprint 12.3 Contract Lock](./sprint12.3-contract-lock.md)
- [Sprint 12.4 Release Candidate Audit](./sprint12.4-release-candidate-audit.md)
- [Sprint 12.4 Concurrency Report](./sprint12.4-concurrency-report.md)
- [Sprint 12.4 Security Report](./sprint12.4-security-report.md)
- [Sprint 12.4 Database Integrity Report](./sprint12.4-database-integrity-report.md)
- [Sprint 12.5 Production Reality Audit](./sprint12.5-production-reality-audit.md)
- [Sprint 12 Final Production-Reality Audit](./sprint12-final-production-reality-audit.md)
- [Sprint 12 Final Evidence Ledger](./sprint12-final-evidence-ledger.md)
- [Sprint 12 Final Production Gap Matrix](./sprint12-final-production-gap-matrix.md)
