# Authoritative Change Detection Service

The `ChangeDetectionService` detects authoritative mutations across citizen facts, evidence verification updates, document expiry, and policy version activations.

## Responsibilities
- Receives domain change payloads and enriches them with causality tracing headers:
  - `rootEventId`: Top-level origin of the change cascade
  - `correlationId`: Identifier grouping related event steps
  - `causationId`: Immediate cause of the current step
  - `propagationDepth`: Safeguard depth counter
- Computes SHA-256 change fingerprints to prevent duplicate processing.
