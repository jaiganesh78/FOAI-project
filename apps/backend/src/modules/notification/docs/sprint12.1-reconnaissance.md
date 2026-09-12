# Sprint 12.1 Read-Only Reconnaissance & Architectural Inventory

## A. Current Architecture
Sprint 12 introduces the **Enterprise Citizen Notification, Action Center, Multi-Channel Delivery & Decision Communication Platform** for the GPIOS platform. It acts as a downstream orchestration and action projection layer consuming material decision-change events from Sprint 11 (`DecisionDiff.isMaterial === true`).

```text
AUTHORITATIVE CHANGE (Sprints 8/9/10)
        ↓
SPRINT 11 IMPACT ANALYSIS & RE-EVALUATION
        ↓
DECISION DIFF / MATERIALITY (Sprint 11)
        ↓
SPRINT 12 COMMUNICATION ORCHESTRATION
        ↓
NOTIFICATION (Logical) ──→ NOTIFICATION DELIVERY (Per-channel Intent)
        ↓                              ↓
CITIZEN ACTION CENTER         OUTBOX WORKER (CAS Leasing)
        ↓                              ↓
CITIZEN ACTION / ACK       PROVIDER ADAPTERS (Mock Email/SMS/Push)
        ↓                              ↓
AUDITABLE OUTCOME          DELIVERY ATTEMPTS & REPLAY LOG
```

---

## B. Existing Contracts & Interfaces
- `INotificationRepository`: Abstraction over Prisma database operations for notifications, deliveries, attempts, action items, templates, policies, preferences, suppressions, and outbox entries.
- `INotificationChannelAdapter`: Provider-neutral contract (`send(message, metadata) -> DeliveryResultDto`) implemented by `InAppChannelAdapter`, `EmailChannelAdapter`, `SmsChannelAdapter`, and `PushChannelAdapter`.

---

## C. Existing State Machines
1. **Notification Logical State Machine (10 States)**: `CREATED`, `RENDERED`, `QUEUED`, `PARTIALLY_DELIVERED`, `DELIVERED`, `READ`, `FAILED`, `SUPPRESSED`, `SUPERSEDED`, `EXPIRED`.
2. **Delivery Intent Execution State Machine (7 States)**: `PENDING`, `LEASED`, `PROCESSING`, `SUCCEEDED`, `RETRY_SCHEDULED`, `PERMANENT_FAILURE`, `CANCELLED`.
3. **Delivery Attempt Execution State Machine (7 States)**: `PENDING`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `RETRY_SCHEDULED`, `DEAD_LETTERED`, `CANCELLED`.
4. **Action Center State Machine (9 States)**: `PENDING`, `VIEWED`, `ACKNOWLEDGED`, `ACTION_REQUIRED`, `COMPLETED`, `DISMISSAL_REQUESTED`, `DISMISSED`, `EXPIRED`, `SUPERSEDED`.

---

## D. Database Models (9 Prisma Models)
- `Notification`, `NotificationDelivery`, `NotificationDeliveryAttempt`, `CitizenActionItem`, `NotificationTemplateVersion`, `NotificationPolicyVersion`, `NotificationPreference`, `NotificationSuppression`, `NotificationOutbox`.

---

## E. Event Contracts
- Registered 15 domain events in `@gpios/shared`:
  - Notification Events: `notification.created`, `notification.rendered`, `notification.queued`, `notification.dispatched`, `notification.delivered`, `notification.failed`, `notification.read`, `notification.superseded`, `notification.suppressed`.
  - Action Item Events: `action_item.created`, `action_item.acknowledged`, `action_item.completed`, `action_item.dismissed`, `action_item.expired`, `action_item.superseded`.

---

## F. Security Boundaries & Data Minimization
- Identity derived strictly from `@CurrentUser()` and `JwtAuthGuard`. Cross-citizen access attempts throw `403 Forbidden`. Administrative template/policy endpoints require `GOVERNMENT_OFFICER` or `ADMIN` role. Payloads omit raw Aadhaar/PAN numbers, full bank account details, and secrets.

---

## G. Test Inventory
- `notification.service.spec.ts`: 48 discrete test scenarios covering all 9 functional sections.

---

## H. Documentation Inventory
- 15 technical documentation markdown files under `apps/backend/src/modules/notification/docs/`.

---

## I. Identified Inconsistencies & Reconciliations
1. **Action Item State Count Reconciliation**: Standardized Action Center canonical state machine to 9 states (`PENDING`, `VIEWED`, `ACKNOWLEDGED`, `ACTION_REQUIRED`, `COMPLETED`, `DISMISSAL_REQUESTED`, `DISMISSED`, `EXPIRED`, `SUPERSEDED`).
2. **Outbox Ownership Model**: Clarified distinct responsibilities of `NotificationOutbox` (event outbox), `NotificationDelivery` (per-channel lease owner), and `NotificationDeliveryAttempt` (per-attempt audit log).
3. **Event Contract Alignment**: Added `action_item.superseded` to `DomainEventRegistry`.

---

## J. Recommended Corrections
- Update `action-center.md` and `action-center-contract.md` to reflect canonical 9-state matrix.
- Ensure all 48 test scenarios remain 100% passing across quality gates.

---

## K. Deferred Issues
- Live SMS/Email/Push vendor SDK integrations deferred to Sprint 13 or later deployment phase. Mock adapters remain authoritative for Sprint 12 verification.
