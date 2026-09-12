# Technical Architecture Overview — GPIOS

## System Topology
GPIOS is architected as an enterprise-grade modular monolith adhering to Clean Architecture principles:

- **Presentation Layer**: Controllers, Interceptors, DTO validation pipes, Swagger decorators.
- **Application Layer**: Use case orchestrators, event handlers, DTO mappings.
- **Domain Layer**: Core domain models, domain events, business error contracts, provider interfaces.
- **Infrastructure Layer**: Prisma ORM, Redis client, BullMQ event adapter, AWS S3 storage provider, Langfuse telemetry adapter, Pino logging adapter.

---

## Shared Foundation (`packages/shared`)
The `@gpios/shared` workspace acts as the universal contracts library used by both frontend and backend:
- `constants`: System limits, pagination defaults.
- `enums`: Policy types, eligibility status values.
- `events`: Domain event payload interfaces.
- `interfaces`: Core entity schemas.
- `dtos`: Cross-network data transfer objects.
- `schemas`: Zod runtime schemas.
- `validators`: Universal validation rules.
- `custom-errors`: Domain exception definitions.
- `utils`: Immutable functional helpers.
