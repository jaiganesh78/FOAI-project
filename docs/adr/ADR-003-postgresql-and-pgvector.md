# ADR-003: PostgreSQL with pgvector for Relational and Vector Data

## Status
Accepted

## Context
Government policy intelligence requires storing structured relational entities (citizens, policies, rules, eligibility logs) alongside high-dimensional vector embeddings generated from chunked policy documents. Managing separate relational databases and standalone vector stores introduces data consistency risks and operational overhead.

## Decision
We select **PostgreSQL 16** with the **`pgvector`** extension managed via **Prisma ORM**.

## Consequences
- **Positive**: Single ACID-compliant database for both relational metadata and vector embeddings (HNSW/IVFFlat index support).
- **Positive**: Unified backup, migration, and connection pooling strategy.
- **Negative**: Extremely high vector throughput scale might eventually warrant a dedicated vector database in future years.
