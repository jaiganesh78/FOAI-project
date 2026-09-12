# Outbox Worker Document

## CAS Leasing Query
```sql
UPDATE notification_deliveries
SET status = 'LEASED', leaseOwner = $workerId, leaseExpiresAt = $expiresAt, version = version + 1
WHERE status IN ('PENDING', 'RETRY_SCHEDULED')
  AND (leaseExpiresAt IS NULL OR leaseExpiresAt < NOW())
```

- Worker lease duration: 30 seconds.
- Outbound API calls executed strictly **OUTSIDE** database transactions.
- Failure classification: `TRANSIENT`, `PERMANENT`, `RATE_LIMITED`, `INVALID_DESTINATION`, `PROVIDER_UNAVAILABLE`, `AUTHENTICATION_FAILURE`, `POLICY_REJECTED`.
- Exponential Backoff (5 retries max): 5s, 15s, 45s, 135s, 405s.
