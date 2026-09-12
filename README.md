# AI-Powered Government Policy Intelligence Platform (GPIOS)

[![CI Pipeline](https://github.com/gpios/gpios/actions/workflows/ci.yml/badge.svg)](https://github.com/gpios/gpios/actions/workflows/ci.yml)
[![pnpm](https://img.shields.io/badge/package%20manager-pnpm%20v9-blue.svg)](https://pnpm.io/)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-green.svg)](https://nodejs.org/)

GPIOS is a production-grade, enterprise-scale platform designed for automated government policy intelligence, eligibility calculation, policy vector search, and conversational citizen AI companions.

---

## Technical Architecture Overview

- **Monorepo**: Managed via `pnpm` workspaces (`apps/frontend`, `apps/backend`, `packages/shared`).
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, ShadCN UI, Zustand, TanStack Query, React Flow, Framer Motion.
- **Backend**: NestJS, TypeScript, Prisma ORM, PostgreSQL + `pgvector`, Redis, BullMQ.
- **Abstractions**: Clean Architecture & DDD with Dependency Injection Tokens (`STORAGE_PROVIDER`, `LLM_PROVIDER`, `EVENT_PUBLISHER`, `CLOCK_PROVIDER`, `FEATURE_FLAG_PROVIDER`).
- **Observability**: Pino JSON logger with correlation trace ID middleware, Langfuse AI telemetry, Sentry error tracking, and triple `/health`, `/health/ready`, `/health/live` probes.

---

## Prerequisites

- **Node.js**: `^20.18.0` (specified in `.nvmrc` and `.node-version`)
- **pnpm**: `>=9.15.4` (locked via `packageManager`)
- **Docker & Docker Compose**: For local PostgreSQL (with `pgvector`) and Redis services.

---

## Getting Started

### 1. Installation

Clone the repository and install dependencies using `pnpm`:

```bash
pnpm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` in the project root and adjust default values if needed:

```bash
cp .env.example .env
```

### 3. Launch Core Infrastructure via Docker

Start PostgreSQL (`pgvector/pgvector:pg16`) and Redis containers:

```bash
pnpm docker:up
```

### 4. Database Setup & Prisma Generation

Run Prisma migrations and client generation:

```bash
pnpm prisma:generate
```

### 5. Running the Application in Development

Run both Frontend and Backend concurrently:

```bash
pnpm dev
```

- **Backend API**: `http://localhost:3001/api/v1`
- **Swagger Documentation**: `http://localhost:3001/api/docs`
- **Health Check Probe**: `http://localhost:3001/api/v1/health`
- **Readiness Check Probe**: `http://localhost:3001/api/v1/health/ready`
- **Liveness Check Probe**: `http://localhost:3001/api/v1/health/live`
- **Frontend**: `http://localhost:3000`

---

## Standardized Enterprise Scripts

| Script Command | Description |
| :--- | :--- |
| `pnpm dev` | Runs all workspaces in parallel in dev mode |
| `pnpm build` | Builds production bundles for all workspaces |
| `pnpm lint` | Runs ESLint with module boundary checks across all packages |
| `pnpm lint:fix` | Automatically fixes ESLint warnings and formatting |
| `pnpm typecheck` | Validates TypeScript types across all workspaces |
| `pnpm test` | Runs unit & integration test suites via Vitest / Jest |
| `pnpm e2e` | Executes Playwright & NestJS E2E test suites |
| `pnpm format` | Formats all code using Prettier |
| `pnpm clean` | Cleans build artifacts and `node_modules` across workspaces |

---

## Documentation Strategy

Detailed architectural design records and documentation are maintained in the [`docs/`](./docs) directory:
- [`docs/adr/`](./docs/adr/): Architectural Decision Records (ADRs)
- [`docs/architecture/`](./docs/architecture/): Deep dive system architecture documentation
- [`docs/api/`](./docs/api/): API & Swagger guides
- [`docs/deployment/`](./docs/deployment/): Containerization & cloud deployment guides
