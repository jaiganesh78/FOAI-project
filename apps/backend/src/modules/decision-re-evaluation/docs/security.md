# Security & Boundary Enforcement

The `DecisionReEvaluationModule` enforces strict ownership and RBAC access controls.

## Boundaries
1. **Citizen Ownership Boundary**: Citizens can only trigger and view re-evaluation jobs for their own account (`job.userId === user.id`). Cross-citizen queries throw `403 Forbidden`.
2. **Administrative Policy Activation Boundary**: Triggering policy activations and population discovery requires `GOVERNMENT_OFFICER` or `ADMIN` role.
3. **Operational Analytics Boundary**: Viewing system-wide re-evaluation analytics requires `GOVERNMENT_OFFICER` or `ADMIN` role.
