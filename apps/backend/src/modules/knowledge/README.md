# Government Knowledge Acquisition & Policy Intelligence Module

## Overview
The **Knowledge Acquisition & Policy Intelligence Module** serves as the centralized policy knowledge layer for the AI-Powered Government Policy Intelligence Platform (GPIOS).

It is responsible for:
- Registering and monitoring external government knowledge sources (PM-KISAN, Gazette of India, National Scholarship Portal).
- Intelligent refresh scheduling with adaptive crawl intervals.
- Document discovery, connector abstraction (`IKnowledgeConnector`), and multi-format parsing (`PdfParser`, `HtmlParser`, `JsonParser`, `XmlParser`, `PlainTextParser`).
- Policy fingerprinting (`PolicyFingerprintService`) to prevent duplicate ingestion compute.
- Deterministic document classification (`DocumentClassificationEngine`).
- Metadata extraction & normalization (`PolicyNormalizationService`).
- Chunk generation with Stable Chunk IDs (`stableChunkId`) and line provenance.
- Immutable policy versioning (`PolicyVersion`) and quality scoring (`KnowledgeQualityReport`).
- High-level read model query services (`IKnowledgeQueryService`, `IKnowledgeStatisticsService`).

---

## Directory Structure
```
src/modules/knowledge/
├── controllers/
│   └── knowledge.controller.ts
├── connectors/
│   ├── knowledge-connector.interface.ts
│   ├── api.connector.ts
│   ├── web-scraping.connector.ts
│   ├── pdf.connector.ts
│   ├── manual-upload.connector.ts
│   └── connector.factory.ts
├── parsers/
│   ├── parser.interface.ts
│   ├── pdf.parser.ts
│   ├── html.parser.ts
│   ├── json.parser.ts
│   ├── xml.parser.ts
│   ├── plain-text.parser.ts
│   └── parser.registry.ts
├── services/
│   ├── policy-fingerprint.service.ts
│   ├── refresh-scheduler.service.ts
│   ├── document-classification.engine.ts
│   ├── metadata-extraction.service.ts
│   ├── policy-normalization.service.ts
│   ├── chunk-generation.service.ts
│   ├── knowledge-quality.service.ts
│   ├── knowledge-integrity.service.ts
│   ├── document-processing.pipeline.ts
│   ├── knowledge-query.service.ts
│   ├── knowledge-statistics.service.ts
│   ├── knowledge-source.service.ts
│   └── knowledge-ingestion.service.ts
├── repositories/
│   ├── knowledge-source.repository.interface.ts
│   ├── prisma-knowledge-source.repository.ts
│   ├── policy-document.repository.interface.ts
│   ├── prisma-policy-document.repository.ts
│   ├── policy-version.repository.interface.ts
│   ├── prisma-policy-version.repository.ts
│   ├── policy-chunk.repository.interface.ts
│   └── prisma-policy-chunk.repository.ts
├── README.md
├── sequence-diagram.md
├── future-roadmap.md
├── knowledge-ingestion-pipeline.md
├── policy-versioning.md
└── knowledge.module.ts
```
