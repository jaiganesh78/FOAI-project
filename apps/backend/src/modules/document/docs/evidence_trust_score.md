# Evidence Trust Score Engine Specification

Calculates deterministic trust score (0-100) based on weighted formula:
```
TrustScore = f(DocumentAge, VerificationMethodWeight, GovernmentSourceWeight, ManualVerificationBonus, OCRQuality, DocumentQuality, ExtractionConfidence, ConflictHistoryPenalty)
```

Confidence Levels:
- `CRITICAL`: 90 - 100
- `HIGH`: 75 - 89
- `MEDIUM`: 50 - 74
- `LOW`: 0 - 49
