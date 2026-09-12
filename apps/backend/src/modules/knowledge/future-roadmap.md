# Knowledge Acquisition Module - Future Roadmap

## Planned Features for Future Sprints
1. **Vector Embedding Generation (Sprint 5/6)**:
   - Integrate `EMBEDDING_PROVIDER` token to consume `EmbeddingPreparation` table entries and populate `pgvector` embeddings.
2. **Automated Scraping & Cron Workers (Sprint 5)**:
   - NestJS Schedule / BullMQ cron integration consuming `updateFrequencyCron` schedules.
3. **Advanced OCR & Multilingual Parsing**:
   - Integration with Tesseract / IndicOCR for scanned regional language gazettes.
4. **Policy Graph Visualization Dashboard**:
   - Visualizing policy dependency graphs (`SUPERSEDES`, `DEPENDS_ON`, `AMENDMENT`).
