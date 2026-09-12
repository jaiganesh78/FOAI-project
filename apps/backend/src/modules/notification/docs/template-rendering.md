# Template Rendering Document

## Deterministic Immutable Templates
- Schema: `NotificationTemplateVersion` (`@@unique([templateId, version, locale])`).
- Interpolates parameters `{{variableName}}` safely.
- Enforces maximum rendered body length limit of 2,000 characters.
- Computes SHA-256 checksum of rendered content and template payload.
- Zero AI / Zero LLM / Zero free-form text generation.
