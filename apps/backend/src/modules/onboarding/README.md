# Onboarding Module Specification — GPIOS Platform

## Overview
The **Adaptive Citizen Discovery & Progressive Onboarding Engine** acts as the primary intelligence pipeline for discovering citizen attributes and progressively populating the **Citizen Knowledge Profile**.

Rather than treating onboarding as a static multi-step form wizard, this engine decouples UI questions from core citizen attributes, dynamically evaluates parent-child dependencies, normalizes raw inputs, auto-saves progress, and invokes Sprint 2's validation and snapshot engines.

---

## Architectural Principles
1. **Discovery Blueprint Engine (`DiscoveryBlueprint`)**: Defines target persona, step ordering, display categories, and completion rules.
2. **Question Catalog (`QuestionCatalog`)**: Decouples UI presentation questions from underlying `CitizenAttributeRegistry` keys with rendering metadata (`width`, `icon`, `tooltip`, `keyboardType`, `i18nKey`, `ariaLabel`).
3. **Answer Normalization Engine (`AnswerNormalizationEngine`)**: Converts user inputs (e.g. `"2 lakhs"`, `"₹2,00,000"`, `"200000"`) into canonical values (`number`, `boolean`, `Date`, `string`, `object`).
4. **Question Visibility Engine (`QuestionVisibilityEngine`)**: Evaluates display conditions, hidden questions, disabled fields, and parent attribute dependencies (`parentKey`, `activationCondition`).
5. **Discovery Context Object (`DiscoveryContext`)**: Encapsulates `userId`, `session`, `blueprint`, `answeredFacts`, `currentStepKey`.
6. **Progress Calculation Strategy (`IProgressCalculationStrategy`)**: Decouples total and category progress calculation formulas.
7. **Draft Answer Support**: Supports `DRAFT`, `SUBMITTED`, `VALIDATED` states.

---

## Public REST API Endpoints

| Method | Endpoint | Description | Auth Guard |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/onboarding/session` | Get or auto-create current citizen onboarding session & progress | Bearer JWT |
| `POST` | `/api/v1/onboarding/session` | Initialize session with specific blueprint | Bearer JWT |
| `PATCH` | `/api/v1/onboarding/session` | Update current step, pause, or resume session | Bearer JWT |
| `GET` | `/api/v1/onboarding/questions` | Fetch dynamic questions for current step (evaluates visibility & parent dependencies) | Bearer JWT |
| `POST` | `/api/v1/onboarding/answers` | Normalize input, validate via Attribute Engine, save to Citizen Profile | Bearer JWT |
| `GET` | `/api/v1/onboarding/progress` | Fetch detailed discovery progress & category completeness | Bearer JWT |
| `POST` | `/api/v1/onboarding/complete` | Complete onboarding session & update profile state | Bearer JWT |

---

## Data Flow Pipeline

```
User Input
   │
   ▼
Answer Normalization Engine
   │
   ▼
Attribute Validation Engine (Sprint 2)
   │
   ▼
Citizen Fact Repository & History
   │
   ▼
Citizen Profile State Machine & Snapshot Generator
   │
   ▼
Domain Event Registry ('onboarding.question_answered')
```
