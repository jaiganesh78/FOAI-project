# Historical Replay & Snapshot Checksum Validation

## Replay Architecture
`FactVerificationReplayService` allows reconstructing any historical verification run exactly as it evaluated at execution time.

## Verification Integrity Protocol
1. Load `FactVerificationRun` and `FactVerificationSnapshot` by run ID.
2. Load historical `FactVerificationPolicy` by `(attributeKey, run.policyVersion)`.
3. Check policy SHA-256 checksum against `run.policyChecksumSha256`. Throw loud exception if tampered.
4. Recalculate snapshot SHA-256 checksum. Throw loud exception if corrupted.
5. Return deterministic replayed verification state.
