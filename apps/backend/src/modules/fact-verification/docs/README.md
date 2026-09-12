# Sprint 10 — Enterprise Fact Verification, Evidence Reconciliation & Citizen Truth Engine

## System Purpose & Objectives
Sprint 10 introduces the **Enterprise Fact Verification, Evidence Reconciliation & Citizen Truth Engine** for the AI-Powered Government Policy Intelligence Platform (GPIOS).

This module transforms existing citizen facts (Sprint 9), verified document evidence (Sprint 8), and policy requirements (Sprint 5) into a **continuously verified, conflict-aware, provenance-backed canonical citizen fact state** suitable for downstream eligibility, recommendation, and application-journey re-evaluation.

## Core Architectural Guarantees
1. **Single Source of Truth (`CitizenFact`)**: Sprint 9 `CitizenFact` remains the single canonical fact store. `FactVerificationResolution` serves as the immutable audit/decision log. All canonical updates modify `CitizenFact` and create a corresponding `CitizenFactVersion`.
2. **Historical Policy Version Replay Isolation**: Every verification run persists `policyId`, `policyVersion`, `policyConfiguration`, and `policyChecksumSha256`. Replay evaluates against the exact historical policy version used in the original run. Checksum mismatch fails loudly.
3. **Policy Overrides Automatic Source Precedence**: High source precedence alone does NOT guarantee automatic acceptance. If evidence is expired or policy requires officer review, policy overrides source precedence and routes item to manual review/reverification.
4. **Deterministic 10-Condition Decision Matrix**: Zero LLM, zero probabilistic selection. All outcomes are rule-based, reproducible, and explainable.
5. **Durable Transactional Outbox**: Database mutations and `FactVerificationEvent` outbox record commits occur atomically inside a single Prisma `$transaction`.
6. **Compare-and-Swap Optimistic Concurrency**: Optimistic concurrency control using integer `version` fields prevents lost updates.
7. **Strict Manual Review Security Boundaries**: Role-based access control enforces that citizens cannot assign officers, complete officer reviews, or modify policies.

## Module Structure
```
apps/backend/src/modules/fact-verification/
├── controllers/
│   └── fact-verification.controller.ts
├── repositories/
│   ├── fact-verification.repository.interface.ts
│   └── prisma-fact-verification.repository.ts
├── services/
│   ├── fact-verification-policy-engine.service.ts
│   ├── fact-conflict-engine.service.ts
│   ├── evidence-chain-validation.service.ts
│   ├── fact-freshness-revalidation.service.ts
│   ├── canonical-fact-resolution.service.ts
│   ├── fact-verification-review.service.ts
│   ├── fact-verification-replay.service.ts
│   ├── fact-verification-impact-engine.service.ts
│   ├── fact-reconciliation-workflow.service.ts
│   └── fact-verification.orchestrator.ts
├── docs/
└── fact-verification.module.ts
```
