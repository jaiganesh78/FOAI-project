# Policy Versioning & Lineage Specification

## Immutable Version Model
- Historical policy versions are **never overwritten or destroyed**.
- Every update generates a new `PolicyVersion` entry linked to the parent `PolicyDocument`.
- Previous active version is automatically marked `isCurrent: false` and linked to the new version via `supersededByVersionId`.

## Chunk Lineage Tracking
Each chunk created during ingestion retains exact lineage details:
- `documentId`: Core policy document GUID
- `versionId`: Specific version GUID
- `stableChunkId`: Content-addressable hash surviving across versions if chunk text is unchanged
- `sectionTitle`: Heading / section title
- `pageNumber`: Page number in original document
- `paragraphIndex`: Paragraph sequence index
- `checksum`: MD5 hash of chunk text
