# Canonical Fact Resolution & 10-Condition Decision Matrix

## Decision Matrix Conditions
1. **Higher Precedence + Valid Evidence + Fresh => Automatic Resolution**: Automatically accepts highest precedence source (`GOVERNMENT_VERIFIED` > `MANUAL_OFFICER_VERIFIED` > `DOCUMENT_DERIVED` > `SYSTEM_DERIVED` > `SELF_DECLARED`).
2. **Higher Precedence + Expired Evidence => Manual Review**: Policy overrides automatic source precedence; flags for officer manual review / reverification.
3. **Trust Score Below Threshold => Cannot Establish Canonical Truth**: Defers resolution when document trust score < minimum policy threshold.
4. **Missing Provenance => Incomplete Evidence**: Routes item to manual review queue.
5. **Invalid Document Lifecycle => Rejected**: Rejects non-active document evidence.
6. **Conflicting Government Sources => Officer Manual Review**: Routes competing government facts to officer review.
7. **Conflicting Officer Decisions => Manual Review**: Flags conflicting officer review decisions.
8. **Same-Value Duplicate Sources => Clean Deduplication**: Deduplicates duplicate facts without raising false conflicts.
9. **Explicit Policy Manual Review => Officer Queue**: Policy requirement routes resolution to manual review queue.
10. **No Acceptable Source => Preserve Existing Fact**: Preserves canonical fact and flags unresolved conflict.
