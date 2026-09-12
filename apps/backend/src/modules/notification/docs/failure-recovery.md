# Failure Recovery Document

## Recovery Strategy
- Transient errors retry with exponential backoff (`maxRetries = 5`).
- Non-retryable errors move to `DEAD_LETTERED`.
- Outbox worker lease recovery ensures crashing workers lose lease after 30 seconds.
