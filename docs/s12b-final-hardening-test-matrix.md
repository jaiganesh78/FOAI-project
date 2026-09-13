# S12B — Final Hardening Adversarial Test Matrix

**Date:** 2026-09-13  
**Auditor:** Principal Architect, Senior Backend Engineer, Security Engineer, Database Engineer, Adversarial Auditor  
**Scope:** Complete Adversarial & Regression Test Mapping for S12B Candidate Retrieval & Semantic Alignment  
**Total S12B Tests:** 87 tests across 4 test files (100% PASS)  

---

## 1. Test Suite Distribution

| Test File Path | Category / Target | Test Count | Status |
|---|---|:---:|:---:|
| `test/unit/candidate-retrieval/remediation-adversarial.spec.ts` | Complete Adversarial & Hardening Matrix (Areas A–J, Findings R1–R16, F1–F6) | 57 | **PASS** |
| `test/unit/candidate-retrieval/retrieval-adversarial.spec.ts` | Fundamental Architectural Invariants (Similarity != Eligibility, Version Safety, Failure) | 13 | **PASS** |
| `test/unit/candidate-retrieval/semantic-alignment.spec.ts` | Semantic Alignment Unit Suite (Canonical resolution, Alias safety, PII stripping) | 10 | **PASS** |
| `test/unit/candidate-retrieval/candidate-retrieval.spec.ts` | Candidate Retrieval Service Unit Suite (Structured, Vector, Hybrid modes) | 7 | **PASS** |
| **Total S12B Suite** | **4 test files** | **87** | **GREEN** |

---

## 2. Comprehensive Test Matrix by Architectural Domain

### Area A: Semantic Authority & Escape Hatch Removal (Findings R5, R6)
| # | Scenario | Expected Behavior | Test File | Test Name | Result |
|:---:|---|---|---|---|:---:|
| 1 | Fake dotted canonical key passed (`FAKE.NEW_ATTRIBUTE`) | Key rejected from `canonicalFacts` & `canonicalAttributesPresent`; fails closed to `unresolvedInputs` | `remediation-adversarial.spec.ts` | `1. rejects fake dotted canonical key into canonicalFacts` | **PASS** |
| 2 | Lowercase canonical attribute code passed (`agriculture.land_area`) | Case-sensitive lookup fails; rejected from canonical facts; fails closed to `unresolvedInputs` | `remediation-adversarial.spec.ts` | `2. rejects lowercase canonical attribute code` | **PASS** |
| 3 | Unregistered legacy key passed (`unregistered_field`) | Unregistered in registry; fails closed to `unresolvedInputs` | `remediation-adversarial.spec.ts` | `3. rejects completely unknown/unregistered attribute key` | **PASS** |
| 4 | Registered legacy attribute key passed (`landHolding`) | Successfully bridges to `AGRICULTURE.LAND_AREA` in `canonicalFacts` and populates `landHoldingHectares` | `remediation-adversarial.spec.ts` | `4. resolves registered legacy attribute key (landHolding -> AGRICULTURE.LAND_AREA)` | **PASS** |
| 5 | Context-required alias passed (`farmer`) | Alias cannot be resolved without explicit scheme context; recorded in `unresolvedInputs` | `remediation-adversarial.spec.ts` | `5. preserves context-required alias ("farmer") in unresolvedInputs` | **PASS** |
| 6 | Ambiguous alias passed (`business worker`) | Alias has multiple candidates; recorded in `ambiguousInputs` without guessing | `remediation-adversarial.spec.ts` | `6. preserves ambiguous alias ("business worker") in ambiguousInputs` | **PASS** |
| 7 | Deterministic canonical value resolution (`SC`, `OBC`) | Values resolved to exact controlled vocabulary strings in `canonicalFacts` | `remediation-adversarial.spec.ts` | `7. resolves canonical value deterministically` | **PASS** |

---

### Area B: PII Defense & Query Privacy (Findings R3, F1, F6)
| # | Scenario | Expected Behavior | Test File | Test Name | Result |
|:---:|---|---|---|---|:---:|
| 8 | Aadhaar in citizen facts (`aadhaarNumber: '123456789012'`) | Purged at alignment ingress; absent from `canonicalFacts` and `AlignedCitizenSignals` | `remediation-adversarial.spec.ts` | `8. purges Aadhaar number from raw citizen facts` | **PASS** |
| 9 | PAN in citizen facts (`panNumber: 'ABCDE1234F'`) | Purged at alignment ingress; absent from `canonicalFacts` and `AlignedCitizenSignals` | `remediation-adversarial.spec.ts` | `9. purges PAN number from raw citizen facts` | **PASS** |
| 10 | Bank account in citizen facts (`bankAccountNumber: '123456789012'`) | Purged at alignment ingress; absent from `canonicalFacts` and `AlignedCitizenSignals` | `remediation-adversarial.spec.ts` | `10. purges bank account number from raw citizen facts` | **PASS** |
| 11 | Aadhaar in free-text `searchQuery` | Redacted to `[REDACTED_IDENTIFIER]` before `IEmbeddingProvider`; warning issued | `remediation-adversarial.spec.ts` | `11. sanitizes Aadhaar number from free-text searchQuery` | **PASS** |
| 12 | PAN in free-text `searchQuery` | Redacted to `[REDACTED_IDENTIFIER]` before `IEmbeddingProvider`; warning issued | `remediation-adversarial.spec.ts` | `12. sanitizes PAN number from free-text searchQuery` | **PASS** |
| 13 | Mixed PII in `searchQuery` (Aadhaar + PAN) | All sensitive tokens redacted before embedding generation; warning issued | `remediation-adversarial.spec.ts` | `13. sanitizes mixed PII from free-text searchQuery` | **PASS** |
| 14 | PII absence in retrieval output and logs | Sanitized request produces zero PII tokens in candidate result or execution trace | `remediation-adversarial.spec.ts` | `14. guarantees PII is absent from warnings and candidate output` | **PASS** |
| 53 | PII in unregistered facts | Aadhaar, PAN, and Bank Account numbers are redacted before entering `unresolvedInputs` or `warnings` | `remediation-adversarial.spec.ts` | `53. redacts Aadhaar, PAN, and Bank Account from unresolvedInputs and warnings` | **PASS** |
| 55 | Long-digit identifier in `searchQuery` | Conservative long-digit identifier redaction replaces 9–18 digit sequences with `[REDACTED_IDENTIFIER]` | `remediation-adversarial.spec.ts` | `55. applies conservative long-digit identifier redaction on searchQuery` | **PASS** |

---

### Area C: Citizen Fact Trust Boundary & Authorization (Findings R4, F2)
| # | Scenario | Expected Behavior | Test File | Test Name | Result |
|:---:|---|---|---|---|:---:|
| 15 | Cross-citizen identity spoofing (`userId: 'citizen-2'`) | Controller compares `userId` against JWT `req.user.userId`; throws HTTP 403 `ForbiddenException` | `remediation-adversarial.spec.ts` | `15. rejects cross-citizen identity spoofing with ForbiddenException` | **PASS** |
| 16 | Authenticated citizen uses own identity | Allowed through controller; queries authoritative facts | `remediation-adversarial.spec.ts` | `16. allows authenticated citizen to retrieve candidates for their own identity` | **PASS** |
| 17 | Authoritative fact server-side lookup | Controller queries `CitizenQueryService.getStructuredFactsByUserId(userId)` | `remediation-adversarial.spec.ts` | `17. loads authoritative facts from CitizenQueryService when available` | **PASS** |
| 56 | Client fact vs authoritative fact conflict | Authoritative server facts override conflicting client-supplied facts | `remediation-adversarial.spec.ts` | `56. ensures authoritative server profile facts take precedence over conflicting client facts` | **PASS** |
| 57 | Client-only exploratory fact injection | Client cannot inject invented canonical attributes; unknown keys fail closed | `remediation-adversarial.spec.ts` | `57. client-only facts cannot inject fake canonical attributes into canonicalFacts` | **PASS** |

---

### Area D: Structured Retrieval Applicability & Overlap (Findings R1, R2, R9)
| # | Scenario | Expected Behavior | Test File | Test Name | Result |
|:---:|---|---|---|---|:---:|
| 18 | Ministry constraint match | Policy with matching chunk ministry is returned as candidate | `remediation-adversarial.spec.ts` | `18. matches policy when ministry constraint matches chunk metadata` | **PASS** |
| 19 | Ministry constraint mismatch | Policy with differing ministry is filtered out | `remediation-adversarial.spec.ts` | `19. excludes policy when ministry constraint mismatches chunk metadata` | **PASS** |
| 20 | Beneficiary category match | Policy matching beneficiary category is returned | `remediation-adversarial.spec.ts` | `20. matches policy when beneficiary category constraint matches` | **PASS** |
| 21 | Beneficiary category mismatch | Policy with differing beneficiary category is filtered out | `remediation-adversarial.spec.ts` | `21. excludes policy when beneficiary category constraint mismatches` | **PASS** |
| 22 | State constraint match | State-specific policy matching citizen state is returned | `remediation-adversarial.spec.ts` | `22. matches policy when state matches` | **PASS** |
| 23 | State constraint mismatch | State-specific policy for differing state is filtered out | `remediation-adversarial.spec.ts` | `23. excludes policy when state mismatches` | **PASS** |
| 24 | Relevant attribute overlap | Policy referencing at least 1 known citizen attribute is returned | `remediation-adversarial.spec.ts` | `24. matches policy when referenced attributes overlap with citizen canonical attributes` | **PASS** |
| 25 | No attribute overlap | Policy referencing specific attributes with 0 citizen overlap is excluded | `remediation-adversarial.spec.ts` | `25. excludes policy when referenced attributes have zero overlap with citizen attributes` | **PASS** |
| 26 | Rule threshold non-evaluation | Policy is retrieved even if citizen values violate numeric rule condition (retrieval != eligibility) | `remediation-adversarial.spec.ts` | `26. attribute presence does NOT evaluate rule thresholds or filter on numerical condition failure` | **PASS** |

---

### Area E: Vector Mathematics & Correctness (Finding R7)
| # | Scenario | Expected Behavior | Test File | Test Name | Result |
|:---:|---|---|---|---|:---:|
| 27 | Identical vectors | Cosine similarity = 1.0; normalizedScore = 1.0 | `remediation-adversarial.spec.ts` | `27. identical vectors return cosine = 1.0 and normalizedScore = 1.0` | **PASS** |
| 28 | Orthogonal vectors | Cosine similarity = 0.0; normalizedScore = 0.5 | `remediation-adversarial.spec.ts` | `28. orthogonal vectors return cosine = 0.0` | **PASS** |
| 29 | Opposite vectors | Cosine similarity = -1.0; normalizedScore = 0.0 | `remediation-adversarial.spec.ts` | `29. opposite vectors return negative cosine in [-1, 0)` | **PASS** |
| 30 | Vectors with NaN | Handled safely by returning similarity 0.0 without throwing or NaN propagation | `remediation-adversarial.spec.ts` | `30. vectors with NaN return 0.0 safely without crashing` | **PASS** |
| 31 | Vectors with Infinity | Handled safely by returning similarity 0.0 | `remediation-adversarial.spec.ts` | `31. vectors with Infinity return 0.0 safely` | **PASS** |
| 32 | Zero-norm vector | Zero length denominator handled safely; returns similarity 0.0 | `remediation-adversarial.spec.ts` | `32. zero-norm vector returns 0.0 safely` | **PASS** |
| 33 | Dimension mismatch | Different vector lengths return similarity 0.0 safely | `remediation-adversarial.spec.ts` | `33. dimension mismatch returns 0.0 safely` | **PASS** |
| 34 | Deterministic repeatability | Successive identical queries yield bitwise identical output | `remediation-adversarial.spec.ts` | `34. deterministic vector search produces identical results across runs` | **PASS** |

---

### Area F: Version Safety & Fusion Isolation (Findings R16, F3)
| # | Scenario | Expected Behavior | Test File | Test Name | Result |
|:---:|---|---|---|---|:---:|
| 35 | Same-version vector fusion | Matches for exact `versionId` and `documentId` are fused into candidate | `remediation-adversarial.spec.ts` | `35. fuses vector matches into candidate of matching version` | **PASS** |
| 36 | Mismatched-version vector defense | Vector match with differing `versionId` is rejected defensively; not fused | `remediation-adversarial.spec.ts` | `36. defensively rejects vector match containing mismatched versionId` | **PASS** |
| 37 | Mismatched document vector match | Vector match for document not in structured set is discarded | `remediation-adversarial.spec.ts` | `37. ignores vector matches for documents not in structured candidates` | **PASS** |
| 54 | 3-Key deterministic tie-breaker | When score and documentNumber match, sorted by `policyVersionId` ascending | `remediation-adversarial.spec.ts` | `54. deterministically breaks ties using policyVersionId when score and documentNumber are identical` | **PASS** |

---

### Area G: Evidence Semantics & Observability (Findings R8, R9)
| # | Scenario | Expected Behavior | Test File | Test Name | Result |
|:---:|---|---|---|---|:---:|
| 38 | Evidence chunk deduplication | `matchedChunkCount` equals unique vector chunk count; no double-counting | `remediation-adversarial.spec.ts` | `38. does not double-count chunks in matchedChunkCount (Finding R8)` | **PASS** |
| 39 | Truthful constraint match flags | `ministryMatch` and `departmentMatch` are true only on actual match | `remediation-adversarial.spec.ts` | `39. sets departmentMatch and ministryMatch to true only when constraints actually matched` | **PASS** |
| 40 | Undefined match flags when unrequested | When constraints are omitted, match flags return `undefined` (never `true`) | `remediation-adversarial.spec.ts` | `40. sets match flags to undefined when constraints are not requested (Finding R9)` | **PASS** |
| 41 | Unique chunk evidence reporting | `totalChunkCount`, `vectorMatchedChunkCount`, `uniqueMatchedChunkCount` report accurately | `remediation-adversarial.spec.ts` | `41. reports uniqueMatchedChunkCount correctly when vector matches multiple chunks` | **PASS** |

---

### Area H: Retrieval Boundary & RuleEngine Non-Invocation (Finding R15)
| # | Scenario | Expected Behavior | Test File | Test Name | Result |
|:---:|---|---|---|---|:---:|
| 42 | RuleEngine non-invocation spy | `RuleEngineService.prototype.evaluateRule` spy confirms 0 invocations during retrieval | `remediation-adversarial.spec.ts` | `42. PROVES RuleEngineService is NEVER called during candidate retrieval (Finding R15)` | **PASS** |
| 43 | Vector score != eligibility | Candidate with high vector score contains zero eligibility boolean fields | `remediation-adversarial.spec.ts` | `43. high vector similarity does NOT produce eligibility decisions or passedRules` | **PASS** |
| 44 | Failing rule conditions preserved | Candidate with failing numeric conditions is retained in candidate set | `remediation-adversarial.spec.ts` | `44. candidate retrieval preserves policy even if citizen violates rule conditions` | **PASS** |
| 45 | Zero eligibility fields in candidate | JSON serialization contains no `eligible`, `passedRules`, or `failedRules` | `remediation-adversarial.spec.ts` | `45. verifies candidate results contain zero eligibility decision fields` | **PASS** |

---

### Area I: Failure Classification Truthfulness (Findings R10, R11)
| # | Scenario | Expected Behavior | Test File | Test Name | Result |
|:---:|---|---|---|---|:---:|
| 46 | Database connection failure | Caught DB exception returns `RETRIEVAL_FAILURE` (never `NO_RESULTS`) | `remediation-adversarial.spec.ts` | `46. returns RETRIEVAL_FAILURE when database repository throws` | **PASS** |
| 47 | Vector provider degradation | Vector failure in HYBRID mode degrades to `PARTIAL_RESULTS` with warnings | `remediation-adversarial.spec.ts` | `47. returns PARTIAL_RESULTS when vector search fails but structured retrieval succeeds` | **PASS** |
| 48 | Zero candidate match | Returns `NO_RESULTS` with 0 candidates when constraints match nothing | `remediation-adversarial.spec.ts` | `48. returns NO_RESULTS when no candidates match structured filters` | **PASS** |

---

### Area J: Ranking, Bounding & Score Range (Findings R10, R11, R12)
| # | Scenario | Expected Behavior | Test File | Test Name | Result |
|:---:|---|---|---|---|:---:|
| 49 | Deterministic documentNumber tie-break | Ties in score broken by `documentNumber` ascending | `remediation-adversarial.spec.ts` | `49. deterministically breaks ties using documentNumber ascending` | **PASS** |
| 50 | Bounded maxCandidates truncation | Output candidates bounded to `maxCandidates` | `remediation-adversarial.spec.ts` | `50. respects maxCandidates limit` | **PASS** |
| 51 | Total vs returned candidates distinction | `totalCandidates` returns count before truncation; `returnedCandidates` returns length | `remediation-adversarial.spec.ts` | `51. distinguishes totalCandidates from returnedCandidates (Finding R12)` | **PASS** |
| 52 | Score bounds [0.0, 1.0] | All candidate retrieval scores are finite numbers in `[0.0, 1.0]` | `remediation-adversarial.spec.ts` | `52. retrievalScore is always a finite number between 0.0 and 1.0` | **PASS** |
