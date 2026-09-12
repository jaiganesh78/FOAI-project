# Conflict Engine Architecture

## Overview
`FactConflictEngineService` detects and classifies conflicts across 8 distinct categories without mutating canonical state directly.

## Conflict Categories & Severity
- **VALUE_MISMATCH** (HIGH): Competing non-government values.
- **DATE_MISMATCH** (MEDIUM): Discrepant date attributes.
- **SOURCE_CONFLICT** (CRITICAL): Competing values involving a government source.
- **EXPIRED_EVIDENCE** (HIGH): Evidence exceeds freshness duration.
- **LOW_TRUST_EVIDENCE** (MEDIUM): Trust score < 70%.
- **DUPLICATE_FACT** (LOW): Same-value duplicate sources (deduplicated cleanly).
- **INCOMPLETE_EVIDENCE** (HIGH): Missing provenance link.
- **VERIFICATION_CONFLICT** (CRITICAL): Discrepant verification statuses.
