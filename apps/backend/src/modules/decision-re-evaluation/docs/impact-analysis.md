# Decision Impact Analysis Engine

The `ImpactAnalysisService` determines direct, indirect, or no impact across downstream target contexts (`ELIGIBILITY`, `RECOMMENDATION`, `JOURNEY`).

## Database-Level Hardening
- Enforces DB constraint `UNIQUE(sourceEventId, targetType, targetEntityId)`.
- Prevents concurrent duplicate impact record generation.
- Flags whether a target requires re-evaluation or can be safely skipped.
