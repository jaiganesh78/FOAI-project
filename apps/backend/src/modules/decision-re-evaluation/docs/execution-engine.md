# Re-evaluation Executor Engine

The `ReEvaluationExecutorService` manages step-by-step execution.

## Architectural Rules
- **Outside Database Transactions**: Engine invocations run outside DB transactions to prevent connection pool exhaustion and timeouts.
- **Before-Snapshot Timing**: Captures BEFORE snapshot prior to invoking downstream engines.
- **Worker Lease Management**: Uses `leaseOwner` and `leaseExpiresAt` for worker concurrency control.
- **Step-Level Statuses**: `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`, `STALE`, `SKIPPED`, `SUPERSEDED`, `NOT_EXECUTED`.
- **Overall Status**: `SUCCEEDED`, `PARTIALLY_COMPLETED`, or `FAILED`.
