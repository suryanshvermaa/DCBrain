# Known Issues

Track known bugs, limitations, and workarounds. Each issue has a severity, status, and workaround if available.

## Severity Levels

| Level | Definition |
|-------|-----------|
| 🔴 Critical | System is unusable or data loss occurs |
| 🟠 Major | Feature is broken but workaround exists |
| 🟡 Minor | Cosmetic or non-blocking issue |
| 🔵 Trivial | Extremely minor, fix when convenient |

---

## Active Issues

No known issues yet — development has not started. This file will be updated as issues are discovered during development.

---

## Expected Challenges

These are anticipated challenges based on architectural analysis, not bugs. They are documented here so future developers and AI models are aware:

### ISSUE-E001: PDF Text Extraction Quality
- **Severity:** 🟠 Major (Expected)
- **Component:** Document Processing Pipeline
- **Description:** Engineering drawings and scanned specifications may produce poor-quality text extraction. PDFs with complex layouts (multi-column, tables spanning pages, embedded CAD drawings) are known challenges for pdfplumber.
- **Mitigation:** OCR fallback via Tesseract for scanned documents. Table extraction handled separately. Post-extraction quality scoring to flag low-quality extractions for manual review.
- **Status:** Anticipated — will be addressed in Task 004 (Document Processing)

### ISSUE-E002: Embedding Model Context Window
- **Severity:** 🟡 Minor (Expected)
- **Component:** RAG Pipeline
- **Description:** The BAAI/bge-m3 embedding model has an 8,192 token context window. Chunks exceeding this will be truncated, potentially losing context at chunk boundaries.
- **Mitigation:** Chunk size set to 512 tokens (well under limit). Overlap of 50 tokens preserves continuity. Section headers prepended to each chunk for context.
- **Status:** Anticipated — configured in [ENVIRONMENT.md](./ENVIRONMENT.md)

### ISSUE-E003: LLM Hallucination in Compliance Checking
- **Severity:** 🟠 Major (Expected)
- **Component:** Compliance Validation Engine
- **Description:** LLMs may fabricate compliance findings that don't exist in the source documents. This is especially dangerous for compliance checking where false positives or false negatives have real consequences.
- **Mitigation:** Every compliance finding must include an exact quote from the source document. Confidence scores attached to each finding. Human review required before compliance reports are finalized. No compliance finding is actionable without human approval.
- **Status:** Anticipated — design pattern documented in [ARCHITECTURE.md](./ARCHITECTURE.md)

### ISSUE-E004: Primavera P6 XML Format Variations
- **Severity:** 🟡 Minor (Expected)
- **Component:** Schedule Risk Module
- **Description:** P6 XML exports vary between versions (P6 Professional, P6 EPPM, P6 Cloud). Field names and schema structure may differ.
- **Mitigation:** Support the most common P6 XML export schema (XER to XML via P6 export). Validate critical fields on import and reject files that don't meet minimum schema requirements. Provide clear error messages for unsupported formats.
- **Status:** Anticipated — will be addressed in Task 008 (Schedule Risk)

### ISSUE-004: Graph DB Selection
- **Severity:** P1 (High)
- **Component:** Backend / Knowledge Graph
- **Description:** Originally open question between Neo4j and Memgraph for the Knowledge Graph and Simulation Engine. Different local-deployment resource footprints made the choice non-trivial.
- **Resolution (2026-07-01):** **Neo4j 5.x** selected. Rationale recorded in [DECISIONS.md](./DECISIONS.md) ADR-010. Cypher schemas can now be authored directly without vendor neutrality workarounds.
- **Status:** ✅ Resolved

---

## Resolved Issues

### ISSUE-004: Graph DB Selection
- **Resolved:** 2026-07-01
- **Resolution:** Neo4j 5.x chosen for Knowledge Graph and Simulation Engine. See [DECISIONS.md](./DECISIONS.md) ADR-010 for rationale.

---

## How to Report Issues

When discovering an issue during development:

1. Add it to this file under "Active Issues" with:
   - Unique ID (ISSUE-NNN format)
   - Severity level
   - Component affected
   - Steps to reproduce (if applicable)
   - Current workaround (if any)
   - Related task or PR
2. If the issue blocks development, also add it to [PROJECT_STATE.md](./PROJECT_STATE.md) under Blockers
3. For critical issues, create a task in [tasks/backlog.md](./tasks/backlog.md)

## Related Documents

- [PROJECT_STATE.md](./PROJECT_STATE.md) — Current blockers
- [LESSONS.md](./LESSONS.md) — Lessons learned from resolving issues
- [tasks/backlog.md](./tasks/backlog.md) — Task backlog for issue fixes
