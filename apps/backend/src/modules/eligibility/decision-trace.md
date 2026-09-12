# Decision Trace Store Architecture

## Purpose
The **Decision Trace Store** provides a permanent, immutable audit trail for every eligibility decision made by GPIOS.

## Core Trace Model (`DecisionTrace`)
- `userId`: Target citizen GUID.
- `citizenSnapshotId`: Serialized point-in-time profile snapshot GUID.
- `policyVersionId`: Immutable policy document version GUID.
- `policyRuleVersionId`: Immutable rule version GUID.
- `status`: Overall decision (`ELIGIBLE`, `INELIGIBLE`, `REQUIRES_MORE_DATA`).
- `executionDurationMs`: Evaluation latency.
- `correlationId`: Distributed trace ID.
- `nodes` & `edges`: Graph audit trail mapping facts to rule nodes.
