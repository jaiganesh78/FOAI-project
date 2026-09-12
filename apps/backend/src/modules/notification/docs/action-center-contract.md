# Action Center Formal State Machine Contract

## Canonical Action Center States (9 States)
1. `PENDING`: Initial state when an action item is created from a downstream decision event.
2. `VIEWED`: Citizen opened and viewed the action item in the UI.
3. `ACKNOWLEDGED`: Citizen explicitly confirmed receipt/acknowledgement.
4. `ACTION_REQUIRED`: High-priority or prerequisite step requiring citizen intervention.
5. `COMPLETED`: Terminal State (IMMUNE). Citizen completed the required action.
6. `DISMISSAL_REQUESTED`: Citizen requested dismissal of the action item.
7. `DISMISSED`: Terminal State (IMMUNE). Action item dismissed.
8. `EXPIRED`: Terminal State (IMMUNE). Deadline passed without completion.
9. `SUPERSEDED`: Terminal State. Replaced by a newer decision snapshot.

---

## Formal Legal State Transition Matrix

```text
PENDING
  ├─→ VIEWED
  ├─→ ACKNOWLEDGED
  ├─→ ACTION_REQUIRED
  ├─→ COMPLETED (Terminal)
  ├─→ DISMISSAL_REQUESTED
  ├─→ DISMISSED (Terminal)
  ├─→ EXPIRED (Terminal)
  └─→ SUPERSEDED (Terminal)

VIEWED
  ├─→ ACKNOWLEDGED
  ├─→ ACTION_REQUIRED
  ├─→ COMPLETED (Terminal)
  ├─→ DISMISSAL_REQUESTED
  ├─→ DISMISSED (Terminal)
  ├─→ EXPIRED (Terminal)
  └─→ SUPERSEDED (Terminal)

ACKNOWLEDGED
  ├─→ ACTION_REQUIRED
  ├─→ COMPLETED (Terminal)
  ├─→ DISMISSAL_REQUESTED
  ├─→ DISMISSED (Terminal)
  ├─→ EXPIRED (Terminal)
  └─→ SUPERSEDED (Terminal)

ACTION_REQUIRED
  ├─→ COMPLETED (Terminal)
  ├─→ DISMISSAL_REQUESTED
  ├─→ DISMISSED (Terminal)
  ├─→ EXPIRED (Terminal)
  └─→ SUPERSEDED (Terminal)

DISMISSAL_REQUESTED
  ├─→ COMPLETED (Terminal)
  ├─→ DISMISSED (Terminal)
  └─→ SUPERSEDED (Terminal)

Terminal States (IMMUNE to arbitrary transition or resurrection):
  - COMPLETED
  - DISMISSED
  - EXPIRED
  - SUPERSEDED
```

---

## Supersession Immunity Policy
- **Immune States**: `COMPLETED`, `DISMISSED`, `EXPIRED`, and `SUPERSEDED` are **100% IMMUNE** to supersession from subsequent decision snapshots. They can **NEVER** be overwritten or resurrected.
- **Supersedable States**: Non-terminal items (`PENDING`, `VIEWED`, `ACKNOWLEDGED`, `ACTION_REQUIRED`, `DISMISSAL_REQUESTED`) linked to a superseded notification transition to `SUPERSEDED` using optimistic CAS concurrency protection.
