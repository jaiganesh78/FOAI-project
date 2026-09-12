# Replay Engine Document

## Snapshot-Driven Checksum Verification
- Reconstructs notifications using stored parameters, template version checksums, and policy checksums.
- Calculates SHA-256 hash and fails loudly on mismatch without reading live state.
