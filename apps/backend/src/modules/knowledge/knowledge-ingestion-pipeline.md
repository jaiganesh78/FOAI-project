# Knowledge Ingestion Pipeline Architecture

## Pipeline Stages
1. **Discovery & Retrieval**: Routes source request to matching `IKnowledgeConnector` (`ApiConnector`, `WebScrapingConnector`, `PdfConnector`).
2. **Fingerprinting & Duplicate Prevention**: Computes `SHA256(Document) + Size + Title + Date + Version + SourceId`. Skips downstream compute if hash exists.
3. **Parsing Strategy Routing**: Routes content to `IParser` (`PdfParser`, `HtmlParser`, `JsonParser`, `XmlParser`, `PlainTextParser`).
4. **Classification Engine**: Deterministic classification into `SCHEME`, `GAZETTE`, `CIRCULAR`, `NOTIFICATION`, `BUDGET`, etc.
5. **Metadata Extraction & Normalization**: Standardizes amounts (e.g. `"Rs 2 Lakh"` -> `200000`), states (`"Tamil Nadu"` -> `"TN"`), categories with extraction provenance.
6. **Chunk Generation & Stable IDs**: Generates sliding window text chunks with lineage metadata and content-addressable `stableChunkId`.
7. **Quality Scoring & Verification**: Evaluates completeness, parsing success, metadata confidence, and verifies line integrity before activation.
8. **Storage & State Machine**: Writes immutable `PolicyVersion` and `PolicyChunk` records and advances policy status to `ACTIVE`.
9. **Event Publishing**: Emits domain events (`knowledge.document_processed`, `knowledge.ingestion_completed`).
