# Stale State Management & CAS Clearing

The `StaleStateService` manages explicit decision freshness markers (`StaleState`).

## CAS Conditional Clearing Rule
When a decision is marked `STALE` due to an authoritative change (e.g. v11), an older evaluation job (running against v10) **CANNOT** clear the stale marker created by v11!
Clearing requires `expectedDependencyFingerprintSha256` matching the active `StaleState.dependencyFingerprintSha256`.
