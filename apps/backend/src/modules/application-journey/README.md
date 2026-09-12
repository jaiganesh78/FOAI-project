# Enterprise Action Planning & Application Journey Engine

## Overview
The **Enterprise Action Planning & Application Journey Engine** (`ApplicationJourneyModule`) transforms prioritized policy recommendations into fully executable, deterministic citizen application journeys.

It answers the core citizen question:
> *"Exactly what should the citizen do next?"*

---

## Key Enterprise Architecture & Hardening Features

- **Journey Template Inheritance (`JourneyBlueprintService`)**: Supports blueprint inheritance hierarchy (`parentBlueprintId`) from Root Template (`Government Benefit Application`) -> Domain Template (`Farmer Scheme Journey`) -> Concrete Policy Blueprint (`PM-KISAN`).
- **Step Execution Policies (`StepExecutionPolicy`)**: Encapsulates execution metadata (`executionMode`, `owner`, `retryLimit`, `retryIntervalMs`, `blockingBehavior`, `timeoutMs`, `requiresVerification`).
- **Journey Constraint Engine (`JourneyConstraintEngine`)**: Centralized validation evaluating dependency, deadline, verification, document, and policy constraints prior to step state transition.
- **Dual Replay Engine (`JourneyReplayService`)**: Supports both **Snapshot Replay** and chronological **Event Replay**.
- **Personalized Action Planner (`ActionPlanningService`)**: Formulates personalized daily action steps ("Today", "Tomorrow", "Next Up", "Finally").
- **Dynamic Checklist Engine (`ChecklistGenerationService`)**: Generates real-time verification checklists for facts, document copies, and evidence.
- **Deadline Intelligence (`DeadlineIntelligenceService`)**: Tracks government submission windows and document expiries to assign urgency (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **Expanded Operational Analytics (`JourneyAnalyticsService`)**: Tracks step durations, waiting times, verification times, replay durations, drop-offs, and completion rates.

---

## Directory Structure
```
src/modules/application-journey/
├── controllers/
│   └── application-journey.controller.ts
├── services/
│   ├── journey-blueprint.service.ts
│   ├── journey-constraint.engine.ts
│   ├── journey-dependency-graph.service.ts
│   ├── journey-planner.service.ts
│   ├── checklist-generation.service.ts
│   ├── document-requirement.service.ts
│   ├── journey-readiness.service.ts
│   ├── deadline-intelligence.service.ts
│   ├── action-planning.service.ts
│   ├── journey-progress.service.ts
│   ├── journey-snapshot.service.ts
│   ├── journey-replay.service.ts
│   ├── journey-difference.service.ts
│   ├── journey-timeline.service.ts
│   ├── journey-analytics.service.ts
│   ├── application-journey.orchestrator.ts
│   └── journey-query.service.ts
├── repositories/
│   ├── journey.repository.interface.ts
│   ├── prisma-application-journey.repository.ts
│   ├── journey-blueprint.repository.interface.ts
│   ├── prisma-journey-blueprint.repository.ts
│   ├── journey-snapshot.repository.interface.ts
│   └── prisma-journey-snapshot.repository.ts
├── README.md
├── sequence-diagram.md
├── journey-blueprint.md
├── action-planner.md
├── checklist-engine.md
├── dependency-graph.md
├── timeline.md
├── snapshot-engine.md
├── future-roadmap.md
└── application-journey.module.ts
```
