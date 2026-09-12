# ADR-001: Adoption of Modular Monolith Architecture

## Status
Accepted

## Context
The AI-Powered Government Policy Intelligence Platform (GPIOS) requires strict domain boundaries between policy indexing, eligibility engines, AI copilot workflows, and citizen companion agents. While microservices offer independent deployment, they introduce premature operational overhead, network latency, distributed transaction complexity, and synchronization challenges for an enterprise platform under initial construction.

## Decision
We will adopt a **Modular Monolith** architecture implemented via NestJS modules and Clean Architecture / Domain-Driven Design (DDD) layers (`domain/`, `application/`, `infrastructure/`, `presentation/`).

## Consequences
- **Positive**: High developer velocity, single repository refactoring ease, strongly typed cross-module contracts, direct in-memory calls with zero network serialization overhead.
- **Positive**: Strict ESLint boundary rules prevent illegal cross-module internal imports.
- **Negative**: Requires discipline to prevent modular boundaries from decaying over time.
