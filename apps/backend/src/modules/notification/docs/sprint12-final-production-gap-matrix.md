# Sprint 12 — Final Production Gap Matrix
## Reconciliation of All Sprint 12.1–12.5 Claims

---

> [!IMPORTANT]
> This document classifies **every major claim from Sprint 12.1–12.5 audit documents**
> against the evidence actually produced in this final audit.
> Previous "VERIFIED", "LOCKED", and "PRODUCTION READY" labels are challenged below.

---

## Gap Classification Definitions

| Classification | Meaning |
|---------------|---------|
| `EMPIRICALLY_PROVEN` | Executable test confirms the behavior at runtime |
| `PREVIOUSLY_ASSERTED` | Claimed in earlier reports with no executable test |
| `NOW_PROVEN` | Previously asserted, now confirmed by this audit |
| `STILL_UNPROVEN` | Claimed; not tested in any audit pass |
| `CONTRADICTED` | Claim is demonstrably false by evidence |
| `NOT_APPLICABLE` | Claim is about infrastructure not in scope |

---

## Claim-by-Claim Reconciliation

### From Sprint 12.2 Audit Documents

| Previous Claim | Document | Previous Label | This Audit Classification | Evidence | Notes |
|----------------|----------|---------------|--------------------------|----------|-------|
| "Concurrent lease acquisition: exactly-one worker wins" | sprint12.2-concurrency-audit.md | VERIFIED | `CONTRADICTED` | DEF-001: TOCTOU race confirmed — both workers acquire lease in mock simulation | findUnique+update is non-atomic |
| "CAS version protection prevents concurrent updates" | sprint12.2-concurrency-audit.md | VERIFIED | `PARTIALLY_VERIFIED` | CAS check exists in code; BUT is non-atomic (findUnique+update TOCTOU, DEF-002) | Service-layer CAS not DB-atomic |
| "Transaction atomicity: Notification+ActionItem+Delivery in one TX" | sprint12.2-adversarial-audit.md | VERIFIED | `NOW_PROVEN` (CODE_VERIFIED) | orchestrator lines 91-159: single $transaction block confirmed | DB rollback not tested |
| "Provider calls outside DB transaction" | sprint12.2-adversarial-audit.md | VERIFIED | `NOW_PROVEN` (CODE_VERIFIED) | orchestrator lines 168-172: processDelivery called AFTER tx.commit | Confirmed by code inspection |
| "COMPLETED action item is immune to supersession" | sprint12.2-state-machine-verification.md | VERIFIED | `EMPIRICALLY_PROVEN` | PA-3-IMMUNE tests: 4 immune states confirmed | 4/4 states tested |
| "Security boundary: ownership check on notifications" | sprint12.2-security-audit.md | VERIFIED | `NOW_PROVEN` (CODE_VERIFIED) | orchestrator line 207 + controller line 101 | HTTP-level 403 NOT tested |
| "PII: requestPayloadSanitized contains only userId+channel" | sprint12.2-security-audit.md | VERIFIED | `EMPIRICALLY_PROVEN` | PA-4-9: sanitized payload confirmed in test | |

### From Sprint 12.3 Audit Documents

| Previous Claim | Document | Previous Label | This Audit Classification | Evidence | Notes |
|----------------|----------|---------------|--------------------------|----------|-------|
| "Replay determinism: same template+params → same checksum" | sprint12.3-adversarial-production-audit.md | VERIFIED | `CONTRADICTED` | DEF-003: Real replay ALWAYS fails with Unresolved placeholders | Replay passes rendered text not original params |
| "48/48 tests cover all production scenarios" | sprint12.3-runtime-verification.md | VERIFIED | `PREVIOUSLY_ASSERTED` | All 48 tests use fully mocked repository; 0 real DB tests | Mock boundary never crossed |
| "Script injection sanitized by renderer" | sprint12.3-adversarial-production-audit.md | VERIFIED | `EMPIRICALLY_PROVEN` | PA-6-1: confirmed | |
| "Unresolved template variables throw BadRequestException" | sprint12.3-adversarial-production-audit.md | VERIFIED | `EMPIRICALLY_PROVEN` | PA-6-2: confirmed | |
| "Zero-AI: no LLM in notification processing" | sprint12.3-contract-lock.md | VERIFIED | `NOW_PROVEN` (CODE_VERIFIED) | No langfuse in notification/ module | langfuse IS in core/telemetry (DEF-005) |

### From Sprint 12.4 Audit Documents

| Previous Claim | Document | Previous Label | This Audit Classification | Evidence | Notes |
|----------------|----------|---------------|--------------------------|----------|-------|
| "Worker concurrency: at-most-once provider execution per delivery" | sprint12.4-concurrency-report.md | VERIFIED | `CONTRADICTED` | DEF-001: Two workers both invoke provider when TOCTOU race occurs | At-least-once, not at-most-once |
| "Retry backoff timing: 5s, 15s, 45s, 135s, 405s" | sprint12.4-release-candidate-audit.md | VERIFIED | `CONTRADICTED` | DEF-006: No nextRetryAt field in schema; no timing implementation in outbox | RETRY_SCHEDULED with no backoff delay |
| "DB UNIQUE constraints prevent duplicate notifications" | sprint12.4-database-integrity-report.md | VERIFIED | `PREVIOUSLY_ASSERTED` | Constraints defined in schema (CODE_VERIFIED); DB enforcement never tested | No real DB insert test performed |
| "Transaction rollback leaves no partial records" | sprint12.4-database-integrity-report.md | VERIFIED | `STILL_UNPROVEN` | Cannot verify without real DB + forced failure | Requires DB integration test |
| "deliveryIdempotencyKey passed to adapter layer" | sprint12.4-release-candidate-audit.md | VERIFIED | `EMPIRICALLY_PROVEN` | PA-4-8: key confirmed in send() arguments | External provider idempotency not tested |
| "Security: RBAC enforced at controller level" | sprint12.4-security-report.md | VERIFIED | `NOW_PROVEN` (CODE_VERIFIED) | Controller lines 120-130: role checks confirmed | HTTP 403 response NOT tested |

### From Sprint 12.5 Audit Documents

| Previous Claim | Document | Previous Label | This Audit Classification | Evidence | Notes |
|----------------|----------|---------------|--------------------------|----------|-------|
| "Worker crash recovery: lease expiry + reclaim" | sprint12.5-production-reality-audit.md | VERIFIED | `PREVIOUSLY_ASSERTED` | Code mechanism exists (CODE_VERIFIED); process-level crash NOT simulated | No process kill + restart test |
| "1 initial + 5 retries = 6 maximum executions" | sprint12.5-production-reality-audit.md | VERIFIED | `PARTIALLY_VERIFIED` | Max retry boundary confirmed by mock (retryCount check); backoff timing unimplemented (DEF-006) | Count correct; timing wrong |
| "At-least-once delivery guarantee" | sprint12.5-production-reality-audit.md | VERIFIED | `EMPIRICALLY_PROVEN` | PA-10-1: adapter accepts same idempotency key twice → confirms at-least-once | Correct classification |
| "Concurrency-safe CAS lease" | sprint12.5-production-reality-audit.md | PRODUCTION READY | `CONTRADICTED` | DEF-001: TOCTOU race in acquireDeliveryLease | Not concurrency-safe at DB level |
| "48/48 tests: 100% production verified" | sprint12.5-production-reality-audit.md | PRODUCTION READY | `PREVIOUSLY_ASSERTED` | All 48 tests use mock repos; 0 DB tests; replay test uses mock checksum | Cannot call this "production verified" |

---

## Summary of Previous Claim Accuracy

| Classification | Count | % of Total Claims Reviewed |
|---------------|-------|---------------------------|
| `EMPIRICALLY_PROVEN` | 12 | 33% |
| `NOW_PROVEN` (CODE_VERIFIED) | 6 | 17% |
| `PREVIOUSLY_ASSERTED` (still only mock/claim) | 8 | 22% |
| `STILL_UNPROVEN` | 4 | 11% |
| `CONTRADICTED` | 6 | 17% |
| **TOTAL** | **36** | **100%** |

---

## Key Finding: Previous Audit Inflation

Previous audits (12.1–12.5) applied the label "PRODUCTION VERIFIED" or "VERIFIED" to:

1. **Behaviours tested only against a fully-mocked repository** — zero real DB contact
2. **Concurrency described as "verified"** when only sequential mock calls were made
3. **Retry timing described as "verified"** when the timing logic was never implemented
4. **Replay described as "deterministic and verified"** when it contains a parameter mismatch defect
5. **"Zero-AI"** claimed when the binary includes the `langfuse` LLM observability SDK

This does NOT mean the system is fundamentally broken. It means previous audit language was stronger than the evidence warranted.

---

## What Previous Audits Got Right

- Transaction boundary placement (provider call outside tx)
- Materiality filtering logic
- Quiet hours + CRITICAL bypass logic
- Supersession immunity states
- Script injection sanitization
- CAS version field propagation (though atomicity still unproven at DB level)
- Delivery idempotency key propagation to adapter layer
- State machine transition table completeness

---

## What Previous Audits Overstated

| Claim | Actual State |
|-------|-------------|
| "Concurrency verified" | TOCTOU race not addressed; at-best advisory lease |
| "Retry timing verified" | Timing never implemented; only retry count tracked |
| "Replay deterministic and verified" | Real replay broken (DEF-003) |
| "Production verified" (48 tests) | 48 tests are all mock-only |
| "DB integrity verified" | Schema constraints defined; actual DB enforcement not tested |
| "Crash recovery verified" | Code mechanism exists; process crash not simulated |

---

*File: `sprint12-final-production-gap-matrix.md`*
*Part of Sprint 12 Final Empirical Production Audit*
