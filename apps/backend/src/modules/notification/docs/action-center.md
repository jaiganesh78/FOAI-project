# Action Center Document

## Formal 9-State Transition Matrix
- States: `PENDING`, `VIEWED`, `ACKNOWLEDGED`, `ACTION_REQUIRED`, `COMPLETED`, `DISMISSAL_REQUESTED`, `DISMISSED`, `EXPIRED`, `SUPERSEDED`.
- Terminal & Immune States (4): `COMPLETED`, `DISMISSED`, `EXPIRED`, `SUPERSEDED`.
- Non-terminal ActionItems linked to a superseded notification transition to `SUPERSEDED`.
- Enforces CAS `expectedVersion` optimistic concurrency protection.
