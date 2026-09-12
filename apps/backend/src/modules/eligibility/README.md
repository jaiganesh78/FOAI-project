# Enterprise Eligibility Intelligence Engine & Decision Trace Platform

## Overview
The **Eligibility Intelligence Engine & Decision Trace Platform** is responsible for transforming structured citizen facts (Sprint 2) and normalized policy knowledge (Sprint 4) into **100% deterministic, explainable, versioned, auditable, and reproducible** eligibility decisions.

It is NOT an AI engine. Every decision is rule-based, reproducible, versioned, and audit-ready.

---

## Key Features
- **Pipeline Completion (`PolicyValidationService`)**: Validates normalized policies before activation.
- **Immutable Rule Versioning (`PolicyRuleVersion`)**: Versioned rules ensuring zero-drift historical replayability.
- **Rule Cost Metadata & Execution Planner (`EvaluationExecutionPlanner`)**: Evaluates cheap rules (`LOW` cost) first to short-circuit expensive branches.
- **Rule Compilation Cache (`CompiledRuleCacheService`)**: Caches compiled AST rule trees.
- **Fact Usage Index (`FactUsageIndexService`)**: Prunes unneeded graph traversals during incremental re-evaluation.
- **Template-Driven Explainability (`ExplainabilityService`)**: Zero-code wording updates using parameterised `ExplainabilityTemplate`.
- **Decision Replay Engine (`DecisionReplayService`)**: Replays historical decisions using stored snapshots and traces.
- **Operational Metrics (`EvaluationMetricsService`)**: Captures execution times, graph depth, and cache hit/miss ratios.

---

## Directory Structure
```
src/modules/eligibility/
├── controllers/
│   └── eligibility.controller.ts
├── services/
│   ├── policy-validation.service.ts
│   ├── compiled-rule-cache.service.ts
│   ├── evaluation-execution-planner.ts
│   ├── fact-usage-index.service.ts
│   ├── rule-engine.service.ts
│   ├── dependency-graph.service.ts
│   ├── evaluation-graph.service.ts
│   ├── trace-store.service.ts
│   ├── snapshot.service.ts
│   ├── context-engine.service.ts
│   ├── benefit-intelligence.service.ts
│   ├── opportunity-intelligence.service.ts
│   ├── explainability.service.ts
│   ├── decision-replay.service.ts
│   ├── evaluation-metrics.service.ts
│   ├── incremental-evaluation.service.ts
│   ├── eligibility-evaluation.orchestrator.ts
│   └── eligibility-query.service.ts
├── repositories/
│   ├── policy-rule.repository.interface.ts
│   ├── prisma-policy-rule.repository.ts
│   ├── decision-trace.repository.interface.ts
│   ├── prisma-decision-trace.repository.ts
│   ├── eligibility-snapshot.repository.interface.ts
│   └── prisma-eligibility-snapshot.repository.ts
├── README.md
├── sequence-diagram.md
├── future-roadmap.md
├── decision-trace.md
├── evaluation-graph.md
└── eligibility.module.ts
```
