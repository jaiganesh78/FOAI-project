# Containerization & Deployment Guide — GPIOS

## Container Services
- **PostgreSQL 16**: Containerized with `pgvector/pgvector:pg16` for vector index support.
- **Redis 7**: Containerized for state caching and task queues.
- **Backend API**: Multi-stage Docker build targeting Node.js 20 Alpine.
- **Frontend App**: Multi-stage Docker build targeting Next.js 16.

## Docker Compose Commands
```bash
# Start all services
pnpm docker:up

# Stop all services
pnpm docker:down

# Stream container logs
pnpm docker:logs
```
