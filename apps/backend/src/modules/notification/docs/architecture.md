# Architecture Document — Sprint 12 Notification Platform

## Bounded Context Boundaries
Sprint 12 is strictly a downstream communication and action projection layer. It consumes material decision changes from Sprint 11 (`DecisionDiff.isMaterial === true`) and projects them into durable, auditable citizen notifications and action items.

```text
AUTHORITATIVE CHANGE (Sprints 8/9/10)
        ↓
SPRINT 11 IMPACT ANALYSIS & RE-EVALUATION
        ↓
DECISION DIFF / MATERIALITY (Sprint 11)
        ↓
SPRINT 12 COMMUNICATION ORCHESTRATION
        ↓
NOTIFICATION (Logical) ──→ NOTIFICATION DELIVERY (Per-channel Intent)
        ↓                              ↓
CITIZEN ACTION CENTER         OUTBOX WORKER (CAS Leasing)
        ↓                              ↓
CITIZEN ACTION / ACK       PROVIDER ADAPTERS (Mock Email/SMS/Push)
        ↓                              ↓
AUDITABLE OUTCOME          DELIVERY ATTEMPTS & REPLAY LOG
```

Zero duplication invariant:
- Never recalculates eligibility, recommendation scores, or decision materiality.
- Derives all citizen actions from downstream re-evaluation state changes.
