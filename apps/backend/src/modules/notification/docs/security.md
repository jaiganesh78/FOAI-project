# Security Document

## RBAC & Data Minimization
- Identity derived strictly from `@CurrentUser()`. Mismatched `userId` in request body throws `403 Forbidden`.
- Administrative endpoints require `GOVERNMENT_OFFICER` or `ADMIN` role.
- Payloads omit raw Aadhaar, full bank account numbers, or secret tokens.
