# Verification Engine Architecture

## Overview
`FactVerificationOrchestrator` is the primary entry point for executing fact verification runs.

## Execution Pipeline
1. **Idempotency Check**: Look up existing `FactVerificationRun` by `(userId, idempotencyKey)`. Return cached result if already executed.
2. **Fetch Canonical Fact**: Load `CitizenFact` from Sprint 9 store.
3. **Load Active Verification Policy**: Fetch versioned `FactVerificationPolicy` and compute SHA-256 checksum.
4. **Evidence Chain & Freshness Validation**: Execute 5-tier evidence chain validation and calculate freshness status (`FRESH`, `STALE`).
5. **Canonical Fact Resolution**: Apply 10-condition deterministic decision matrix.
6. **Atomic Transaction**: Execute atomic Prisma `$transaction`:
   - Create `FactVerificationRun`
   - Create `FactVerificationResolution`
   - Update canonical `CitizenFact` & create `CitizenFactVersion`
   - Create `FactVerificationReview` (if manual review required)
   - Create `FactVerificationSnapshot`
   - Insert `FactVerificationEvent` into transactional outbox
