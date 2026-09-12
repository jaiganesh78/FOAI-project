# Journey Snapshot & Dual Replay Engine Architecture

## Overview
Stores immutable point-in-time `JourneySnapshot` records with SHA-256 context checksums.

## Dual Replay Engine
- **Snapshot Replay**: Reconstructs complete historical journey states strictly using snapshot payloads without live DB queries.
- **Event Replay**: Replays chronological domain events (`JourneyCreated`, `StepCompleted`, `StepBlocked`, `StatusChanged`) for deep auditing.
