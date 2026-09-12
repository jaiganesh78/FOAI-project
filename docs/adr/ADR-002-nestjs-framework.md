# ADR-002: Selection of NestJS Framework for Backend Infrastructure

## Status
Accepted

## Context
GPIOS requires a scalable backend architecture with enterprise-grade Dependency Injection (DI), robust module boundaries, built-in validation pipes, interceptors, exception filters, and OpenAPI auto-generation.

## Decision
We select **NestJS** (v11+) with TypeScript as the primary backend framework.

## Consequences
- **Positive**: Native support for Clean Architecture, Decorators, Dependency Injection Tokens, lifecycle management (`onModuleInit`, `onModuleDestroy`), and module encapsulation.
- **Positive**: Seamless integration with Pino logging, Prisma ORM, BullMQ, and OpenAPI / Swagger.
- **Negative**: Strict framework conventions require team adherence to NestJS design patterns.
