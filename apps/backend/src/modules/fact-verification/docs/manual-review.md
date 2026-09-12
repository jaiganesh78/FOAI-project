# Officer Manual Review Queue & Security Boundaries

## Review Queue Operations
- **Creation**: Triggered automatically when policy rules require manual review (e.g. expired government evidence, unresolved conflicts).
- **SLA Enforcement**: Computes 48-hour SLA deadline (`slaDeadline`).
- **Assignment**: Officers select items from the queue or admins assign officers (`POST /reviews/:id/assign`).
- **Completion**: Officer approves or rejects verification (`POST /reviews/:id/complete`).

## Security Boundary
- Citizens CANNOT access officer review queues (`GET /reviews` returns 403 Forbidden for citizens).
- Citizens CANNOT assign officers or complete manual reviews.
- All officer actions log officer identity, timestamp, decision, and resulting state.
