# Conflict Detection & Fact Reconciliation Specification

Detects discrepancies between citizen self-declarations and document facts (e.g., Income ₹2,50,000 vs Certificate ₹2,00,000).

Resolution Types:
- `ACCEPT_DOCUMENT`: Overwrite citizen fact with document extracted value.
- `ACCEPT_CITIZEN_DECLARATION`: Retain citizen self-declared fact.
- `MANUAL_OVERRIDE`: Officer provides explicit override value.
- `SUPERSEDE`: Supersede document with newer uploaded certificate.
