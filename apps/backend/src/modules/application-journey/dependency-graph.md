# Journey Dependency Graph Engine Architecture

## Overview
Models step dependencies as a directed acyclic graph (DAG):
- **Topological Sorting**: Produces valid execution sequences.
- **Cycle Detection**: Detects and prevents circular step prerequisites.
- **Status Evaluation**: Evaluates step statuses (`NOT_STARTED` -> `READY` -> `BLOCKED` -> `COMPLETED`).
