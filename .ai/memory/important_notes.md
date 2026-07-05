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

## Development Environment Gotchas

- **Shell env overrides `.env` in Docker Compose.** If a variable like `JWT_SECRET_KEY` or `CHROMA_PORT` is set in the host shell, Compose uses it instead of the value in `.env`. Unset conflicting variables before running `docker compose up` if the container sees stale values.
- **ChromaDB JS client / server API mismatch.** The `chromadb` JS client may call `/api/v2/heartbeat` while the server image only exposes `/api/v1/heartbeat`. Health checks in the backend use a direct `fetch` to `/api/v1/heartbeat` to avoid this.
- **Backend TypeScript module target.** `NodeNext` module resolution does not resolve path aliases in a runnable production build. The project uses `CommonJS` + `node` resolution so `tsc` rewrites `@/*` imports automatically.
- **Tailwind v4 theme colors.** Defining only `--color-primary` does not generate shade utilities like `bg-primary-600`. The theme must include `--color-primary-50` through `--color-primary-950` for the dashboard tokens to render.
- **JWT placeholder length.** The Zod schema requires `JWT_SECRET_KEY` to be at least 32 characters. Any placeholder in `.env.example` must satisfy this or the backend will fail to boot.
- **Frontend lint cache permissions.** Running `next lint` inside the production Docker image can create a root-owned `.next/cache/eslint/` directory. The lint script uses `--no-cache` to avoid this in mixed host/container workflows.
- **Auth test environment.** Backend config must accept `APP_ENV=test`; the Jest suite loads `backend/.env.test` directly.
- **Refresh token rotation.** Refresh tokens are blacklisted by `jti` on rotation; Redis is used when available with an in-memory fallback for tests/dev.
- **Frontend Docker build context.** `.dockerignore` must exclude only build artifacts and secrets; excluding config files like `tsconfig.json` breaks Next.js alias resolution during `docker compose build`.
- **Next.js Suspense prerender.** Pages that call `useSearchParams()` need a Suspense boundary in production builds, even if local development works.

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
