# Downstream Impact Engine Architecture

## Overview
`FactVerificationImpactEngineService` computes declarative downstream domain impact flags when a canonical fact is updated or flagged for manual review.

## Impact Flags
- `eligibilityReEvaluationRequired`: Set `true` if attribute is an eligibility criterion (e.g. `annualIncome`, `isLandOwner`).
- `recommendationRecalculationRequired`: Set `true` if recommendations require recalculation.
- `journeyRevalidationRequired`: Set `true` if application journeys depend on the attribute (e.g. `bankAccountNumber`).
- `documentReverificationRequired`: Set `true` if identity documents require re-upload.
- `manualReviewRequired`: Set `true` if routed to officer review.
- `noDownstreamImpact`: Set `true` if no downstream dependencies exist.
