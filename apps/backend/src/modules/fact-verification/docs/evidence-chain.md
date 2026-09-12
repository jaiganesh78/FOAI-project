# 5-Tier Evidence Chain Validation

## Tier Structure
1. **Tier 1 — Canonical Fact (`CitizenFact`)**
2. **Tier 2 — Extracted Evidence Record (`Evidence`)**
3. **Tier 3 — Verified Document (`Document`)**
4. **Tier 4 — Document Version (`DocumentVersion`)**
5. **Tier 5 — Immutable Storage Object / File Hash (`Original File`)**

## Validation Rules
- Must contain valid provenance linkage.
- Target document must have `status === 'ACTIVE'`.
- Document verification status must be `VERIFIED`.
- Document trust score must meet or exceed minimum policy threshold (default >= 70%).
- Absence of blocking active conflicts.
