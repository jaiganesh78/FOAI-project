# Failure Recovery & Worker Leasing

The `ReEvaluationExecutorService` handles failure modes deterministically.

## Recovery Mechanisms
- **Worker Lease Recovery**: If a worker crashes, `leaseExpiresAt` allows another worker to claim the job once the lease expires.
- **Partial Propagation Failure**: Step failure marks overall status `PARTIALLY_COMPLETED` or `FAILED`. Failed step preserves its `StaleState` marker.
- **Retry Idempotency**: Retrying a step reuses the step execution order without creating duplicate step records.
