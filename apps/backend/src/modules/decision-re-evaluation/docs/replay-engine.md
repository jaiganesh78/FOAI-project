# Historical Re-evaluation Replay Engine

The `ReEvaluationReplayService` reconstructs and verifies past re-evaluation runs.

## Snapshot-Driven Verification
- Reconstructs state exclusively from stored BEFORE and AFTER state snapshots (`DecisionStateSnapshot`).
- Ignores live mutable database tables.
- Computes SHA-256 checksums on snapshot payloads and asserts exact match against stored `checksumSha256`.
- Loud failure on checksum mismatch.
