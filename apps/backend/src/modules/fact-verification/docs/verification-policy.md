# Verification Policy & Immutability Engine

## Immutability Rules
- Verification policies are versioned incrementally (`version: 1`, `version: 2`, ...).
- Published/Active policy versions MUST NEVER be mutated.
- Any change to policy rules, threshold scores, or acceptable sources creates a new immutable `FactVerificationPolicy` version.
- Every policy records a SHA-256 payload checksum (`checksumSha256`).

## Historical Replay Isolation
Historical verification runs record `policyId`, `policyVersion`, `policyConfiguration`, and `policyChecksumSha256`. Replay always evaluates against the exact recorded `policyVersion`, preserving absolute historical reproducibility even when active policies evolve.
