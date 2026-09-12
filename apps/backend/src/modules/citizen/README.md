# Citizen Intelligence Module (`@gpios/backend/modules/citizen`)

## 1. System Overview
The **Citizen Intelligence Module** serves as the central **Citizen Knowledge Profile** foundation for the GPIOS platform. It acts as the single source of truth for citizen demography, income, occupation, location, agriculture, and disability facts. Downstream engines (Eligibility Evaluation Engine, Policy Recommendation Engine, AI Copilot, Citizen Companion) consume structured citizen facts through this module.

---

## 2. Technical Architecture & Key Components
- **Entity–Attribute–Value (EAV) Model**: Schema-agnostic storage of dynamic citizen facts in `CitizenFact` rows validated against `CitizenAttributeRegistry`.
- **Master Attribute Registry**: Centralized catalog (`CitizenAttributeRegistry`) governing data types, allowed values, parent-child dependencies (e.g. `isFarmer` → `landAreaHectares`), and metadata.
- **Attribute Validation Engine (`AttributeValidationEngine`)**: Reusable validation service ensuring datatype accuracy, enum validity, mandatory rules, and parent-child dependencies before facts enter the database.
- **Profile Lifecycle State Machine**: Tracks state transitions (`CREATED` → `IN_PROGRESS` → `PARTIALLY_COMPLETED` → `COMPLETED` → `VERIFIED` → `ARCHIVED`).
- **Immutable Fact Versioning & Snapshots**: Every fact update creates an audit trail in `CitizenFactHistory` and generates a point-in-time snapshot via `CitizenSnapshotService` in `CitizenProfileVersion`.
- **Read Model Query Service (`CitizenQueryService`)**: Exposes structured fact lookup methods (`getStructuredFactsByUserId`, `getFactValue`, `getCategoryFacts`, `getCompletenessSummary`) for future engines without direct repository coupling.

---

## 3. Public REST APIs

| Method | Endpoint | Description | Auth Strategy |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/citizen/profile` | Get profile summary, state, and completion percentage | Bearer JWT |
| `POST` | `/api/v1/citizen/profile` | Initialize profile for authenticated user | Bearer JWT |
| `PATCH` | `/api/v1/citizen/profile` | Recalculate completeness and update profile state | Bearer JWT |
| `GET` | `/api/v1/citizen/facts` | List active verified facts for citizen | Bearer JWT |
| `POST` | `/api/v1/citizen/facts` | Add a new fact (validated against Attribute Registry) | Bearer JWT |
| `PATCH` | `/api/v1/citizen/facts/:id` | Update existing fact (triggers historic snapshot) | Bearer JWT |
| `DELETE` | `/api/v1/citizen/facts/:id` | Soft delete a citizen fact | Bearer JWT |
| `GET` | `/api/v1/citizen/profile/completeness` | Calculate profile completeness %, missing categories & attributes | Bearer JWT |

---

## 4. Published Domain Events (`DomainEventRegistry.Citizen`)
- `citizen.profile_created`: Fired when a citizen profile is first initialized.
- `citizen.profile_updated`: Fired when completion percentage or lifecycle status changes.
- `citizen.fact_added`: Fired when a new fact is validated and attached.
- `citizen.fact_updated`: Fired when an existing fact value is updated.
- `citizen.fact_deleted`: Fired when a fact is soft deleted.
- `citizen.profile_version_created`: Fired when an immutable profile version snapshot is created.

---

## 5. Database Schema & Tables
- `citizen_profiles`: Core profile tracking `userId`, `status`, `completionPercentage`, `version`.
- `citizen_attribute_registry`: Catalog of all valid citizen attributes and validation constraints.
- `citizen_facts`: Active EAV fact entries.
- `citizen_fact_history`: Immutable audit trail of fact value changes.
- `citizen_profile_versions`: Point-in-time profile snapshots.
- `fact_evidence`: Metadata records for supporting documents.

---

## 6. Extension Points for Future Sprints
- **Sprint 3 (Knowledge & Policy Ingestion)**: Attribute Registry keys map directly to policy rule conditions.
- **Sprint 5 (Eligibility Engine)**: Consumes `ICitizenQueryService` to evaluate policy eligibility rules against structured citizen facts.
- **DigiLocker / OCR Sync**: External document ingestion pipelines will create `FactEvidence` rows and update `verificationStatus` to `DOCUMENT_VERIFIED`.
