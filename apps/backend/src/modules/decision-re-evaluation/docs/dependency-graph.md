# Dependency Resolution & Fingerprint Service

The `DependencyResolutionService` maintains the platform's deterministic dependency Directed Acyclic Graph (DAG):

```text
Citizen Fact / Policy Change
             ↓
        Eligibility
             ↓
       Recommendation
             ↓
    Application Journey
```

## Safeguards & Fingerprints
- **Cascade Depth Safeguard**: Enforces `propagationDepth <= 5`.
- **Canonical Fingerprint (`dependencyFingerprintSha256`)**:
  - Computes SHA-256 hash across `factVersions`, `policyVersions`, `eligibilitySnapshotVersion`, `recommendationSnapshotVersion`, `journeyVersion`, and `configurationVersion`.
