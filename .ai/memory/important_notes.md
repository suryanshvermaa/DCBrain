# Important Notes

Critical information that must persist across all sessions. These notes contain context that affects development decisions but doesn't fit neatly into other documentation files.

---

## Data Sensitivity

**All project documents uploaded to DCBrain are confidential EPC project data.** This includes engineering specifications, procurement data with pricing, vendor information, and personnel details. The following constraints apply at all times:

- No project data may be logged in plain text (redact document content in logs)
- Gemini API calls must be reviewed for data processing agreement compliance before production
- All uploaded files must be stored in the organization's cloud tenant — no third-party storage
- Demo and test environments must use synthetic data, never real project documents
- Screenshots and screen recordings for demos must use sanitized data

---

## Hackathon Constraints

- **Timeline:** 48-hour hackathon demo deadline
- **Priority:** Get the demo working first, optimize later
- **Demo flow:** Upload 3-5 documents → Search with natural language → Show sourced answer → Chat conversation → Dashboard overview
- **Acceptable shortcuts for hackathon:** Hardcoded demo data in dashboard, simplified error handling, single-user mode
- **Not acceptable shortcuts:** Skipping authentication (demo must show login), skipping source citations (core differentiator), using fake AI responses (must be real RAG)

---

## Gemini API Usage

- **Model:** Gemini 2.5 Flash for answer generation and compliance analysis
- **Embeddings:** BAAI/bge-m3 (1536 dimensions)
- **Estimated costs:** ~$0.50 per 1000 search queries, ~$2.00 per 1000 document pages embedded
- **Rate limits:** 500 RPM for Gemini 2.5 Flash, 3000 RPM for embeddings (Tier 1)
- **Batch embedding:** Process 100 chunks per API call to stay within rate limits
- **Temperature:** 0.1 for factual answers (compliance, search), 0.3 for conversational chat

---

## Known Data Format Requirements

EPC projects use specific document formats. The processing pipeline must handle:

1. **PDF specifications:** Multi-column layouts, tables spanning multiple pages, cross-references between sections, revision clouds on drawings
2. **P6 XML exports:** Schema varies between P6 versions (21.12, 22.12, 23.12). Focus on the XER-to-XML export format from P6 Professional
3. **Procurement Excel:** No standard format — columns vary by organization. Must support flexible column mapping during import
4. **Drawing title blocks:** Extract document number, revision, date, and discipline from title block area (bottom-right of drawings)

---

## Performance Benchmarks to Target

Based on competitive analysis of similar document search tools:

| Operation | Target | Acceptable | Unacceptable |
|-----------|--------|------------|-------------|
| Search query response | < 3 seconds | < 5 seconds | > 10 seconds |
| Document upload (single) | < 2 seconds | < 5 seconds | > 10 seconds |
| Document processing (per doc) | < 60 seconds | < 120 seconds | > 300 seconds |
| Dashboard load | < 2 seconds | < 3 seconds | > 5 seconds |
| Chat response | < 4 seconds | < 7 seconds | > 15 seconds |

---

## Team Communication Channels

- **Primary:** GitHub Issues and Pull Requests
- **Quick questions:** Direct messages (during hackathon)
- **Documentation:** This `.ai/` folder (always the source of truth)

---

## Reminder for All AI Models

1. You do NOT have access to previous chat history. Everything you need is in this `.ai/` folder.
2. If you make a decision that isn't documented, document it before ending the session.
3. If you encounter a bug, add it to [KNOWN_ISSUES.md](../KNOWN_ISSUES.md).
4. If you learn something important, add it to [LESSONS.md](../LESSONS.md).
5. Always update [PROJECT_STATE.md](../PROJECT_STATE.md) and [NEXT_CHAT.md](../NEXT_CHAT.md) before ending a session.
