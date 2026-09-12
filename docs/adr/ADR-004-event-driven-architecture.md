# ADR-004: Abstracted Event-Driven Architecture Decoupled from Message Queue Providers

## Status
Accepted

## Context
Modules in GPIOS need to react asynchronously to domain events (e.g., Policy ingested, Eligibility computed, Notification dispatched) without creating tight coupling between domain logic and underlying message queue technologies (such as BullMQ, RabbitMQ, or AWS SQS).

## Decision
We introduce abstract interfaces (`IDomainEvent`, `IEventPublisher`, `IEventSubscriber`, `IEventDispatcher`) and central injection tokens (`EVENT_PUBLISHER`, `EVENT_SUBSCRIBER`, `EVENT_DISPATCHER`). BullMQ is implemented strictly as an infrastructure adapter.

## Consequences
- **Positive**: Complete independence of domain modules from queue vendor APIs.
- **Positive**: Ease of unit testing through in-memory event publisher mocks.
- **Negative**: Adds an abstraction layer over raw BullMQ queue APIs.
