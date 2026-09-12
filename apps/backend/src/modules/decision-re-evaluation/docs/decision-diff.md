# Decision Diff & Materiality Engine

The `DecisionDiffService` calculates field-level state deltas between BEFORE and AFTER decision snapshots.

## Materiality Versioning
- Versioned materiality rules (`materialityRuleVersion = 1`).
- Hashes materiality configuration into `materialityConfigurationChecksumSha256`.
- Classifies changes as `MATERIAL` (e.g. status flip INELIGIBLE -> ELIGIBLE) or `IMMATERIAL`.
