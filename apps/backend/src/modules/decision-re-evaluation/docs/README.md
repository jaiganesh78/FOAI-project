# Continuous Decision Re-evaluation Platform (`DecisionReEvaluationModule`)

## Architectural Purpose
The `DecisionReEvaluationModule` acts as the platform's continuous orchestration, dependency propagation, stale-state management, decision-diff, replay, and policy-change intelligence layer for GPIOS.

It connects authoritative changes in citizen facts, document evidence, verification status, and policy activations to downstream decision snapshots across:
- Sprint 5: Eligibility Evaluation Engine
- Sprint 6: Scheme Recommendation Platform
- Sprint 7: Application Journey Engine

## Zero AI Constraint
This module operates under a **Strict Zero-AI Constraint**:
- 0 LLM / 0 RAG / 0 Embeddings / 0 ML / 0 Probabilistic Selection
- All impact evaluations, dependency traversals, re-evaluations, diffs, and stale state transitions are 100% deterministic, rule-based, explainable, versioned, and auditable.

## Key Hardening Capabilities
1. **Multi-Key Idempotency**: DB-enforced constraints (`UNIQUE(userId, idempotencyKey)`, `UNIQUE(sourceEventId, targetType, targetEntityId)`, `UNIQUE(policyId, version)`, `UNIQUE(reEvaluationId, executionOrder)`).
2. **Canonical Dependency Fingerprint**: Computes SHA-256 hashes (`dependencyFingerprintSha256`) of fact, policy, and snapshot versions to validate canonical alignment before state mutations.
3. **CAS Stale State Ownership**: `StaleState` clearing is conditional. An older Job A (evaluating v10) cannot clear a stale marker created by a newer Job B (evaluating v11).
4. **Bounded Population Discovery**: Replayable policy population discovery via fact usage indexing without blind full-database scans.
5. **Snapshot-Driven Replay**: Replays historical runs strictly from stored BEFORE/AFTER state snapshots with SHA-256 integrity validation.
