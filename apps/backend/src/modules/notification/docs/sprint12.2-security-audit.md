# Sprint 12.2 Security & PII Minimization Audit

## 1. Identity Derivation & Ownership Enforcement
- **Authentication**: All citizen-facing REST endpoints in `NotificationController` and `ActionCenterController` enforce NestJS `JwtAuthGuard`.
- **Identity Source**: Citizen identity is derived **strictly** from `@CurrentUser()` extracted from the validated JWT token.
- **Ownership Assertion**:
  ```typescript
  if (entity.userId !== user.id && !user.roles?.includes('ADMIN')) {
    throw new ForbiddenException('Security Boundary Rejection: Cross-citizen access denied.');
  }
  ```
- **Cross-Access Rejection**: Client-supplied `userId` query/body parameters are ignored or validated server-side. Mismatched citizen access attempts throw `403 Forbidden`.

---

## 2. Administrative Role Enforcement (RBAC)
- Template modification (`POST /api/v1/notifications/templates`), policy modification (`POST /api/v1/notifications/policies`), and operational analytics (`GET /api/v1/notifications/operations/analytics`) require `GOVERNMENT_OFFICER` or `ADMIN` role. Requests from regular citizens (`CITIZEN`) throw `403 Forbidden`.

---

## 3. Data Minimization & PII Protection
- **Outbound Payloads**: Notification rendering parameters omit raw Aadhaar numbers, full PAN identifiers, bank account numbers, or secret tokens.
- **Log Sanitization**: Request and response objects logged in `NotificationDeliveryAttempt` sanitize `Authorization`, `Cookie`, `Bearer` tokens, and provider secrets.
