# DCBrain Demo-Data Uploader

Production-grade, strongly-typed **Playwright** automation that uploads the entire
`project-data/` demo dataset into a running DCBrain deployment **exactly like a real
user would** — by driving the browser UI.

> **UI-only, by design.** This tool never calls the backend API, never writes to the
> database, and never touches MinIO/ChromaDB/Neo4j directly. Every file enters the
> platform through the same three upload controls a human uses:
> **Documents**, **Procurement**, and **Schedule Risk**.

---

## What it does

1. **Scans** `project-data/` recursively and **classifies every file exactly once**
   (see `src/classifier.ts`). Classification is derived from how DCBrain actually
   ingests data — verified from source, not assumed.
2. **Logs in**, **selects or creates** the target project.
3. For each module, uploads through the UI:
   - **Documents** — batched (default 25/batch), grouped by discipline category.
   - **Procurement** — imports the two flat line-item CSVs (`/procurement` import).
   - **Schedule Risk** — imports each Primavera P6 XML (`/schedule` import).
4. **Validates** each upload via the UI (document counter grew, import count > 0,
   activities parsed).
5. Persists **resumable progress**, records **sha256 checksums** (integrity +
   duplicate detection), captures **screenshots on failure** and a **video** of the run.
6. Writes **`UPLOAD_REPORT.md`** to the repo root.

### Current dataset (verified)

| Destination     | Files | How it's uploaded                                   |
| --------------- | ----: | --------------------------------------------------- |
| Documents       |   830 | Batched multi-file upload, category = discipline    |
| Procurement     |     2 | `BOQ-IMPORT.csv`, `VENDOR-DELIVERY-TRACKER.csv`      |
| Schedule Risk   |     7 | P6 XML schedules (baseline, updates, lookahead, …)  |
| Excluded        |    58 | AI-eval harness, OCR ground-truth, build manifests  |
| **Total**       | **897** |                                                   |

Run `pnpm dry-run` to reproduce this breakdown without a browser.

---

## Prerequisites

- Node.js ≥ 20
- A **running DCBrain stack** (frontend on `http://localhost:3000`, backend on `:8000`)
- Login credentials with upload permission (defaults read from `upload.config.ts`)

## Install

```bash
cd demo-uploader
pnpm install     # or npm install — postinstall downloads the Chromium browser
```

## Configure

All defaults live in **`upload.config.ts`** — no values are hard-coded in the
automation logic. Precedence (low → high): **config file → env vars → CLI flags**.

| Setting          | `upload.config.ts` | Env var                | CLI flag           |
| ---------------- | ------------------ | ---------------------- | ------------------ |
| Base URL         | `baseUrl`          | `DCBRAIN_BASE_URL`     | `--base-url`       |
| Email            | `credentials.email`| `DCBRAIN_EMAIL`        | `--email`          |
| Password         | `credentials.password` | `DCBRAIN_PASSWORD` | `--password`       |
| Project name     | `project.name`     | `DCBRAIN_PROJECT`      | `--project`        |
| Dataset root     | `datasetRoot`      | `DCBRAIN_DATASET_ROOT` | `--dataset-root`   |
| Browser          | `browser`          | `DCBRAIN_BROWSER`      | `--browser`        |
| Headless         | `headless`         | `DCBRAIN_HEADLESS`     | `--headless`/`--headed` |
| Retry count      | `retryCount`       | `DCBRAIN_RETRY`        | `--retry`          |
| Timeout (ms)     | `timeoutMs`        | `DCBRAIN_TIMEOUT_MS`   | `--timeout-ms`     |

---

## Commands

```bash
# Preview only — NO browser. Prints per-module file counts + destinations.
pnpm dry-run

# Full upload (headed browser, video + screenshots-on-failure).
pnpm upload-demo-data

# Resume an interrupted run — skips files already marked 'uploaded'.
pnpm upload-demo-data:resume

# Headless (CI / servers).
pnpm upload-demo-data:headless

# Target a specific/fresh project (created if missing).
pnpm upload-demo-data --project "Orion Data Centre Phase 2"

# Upload only selected modules (repeatable flag).
pnpm upload-demo-data --module Documents --module "Schedule Risk"

# Regenerate UPLOAD_PLAN.md / upload-map.json / UPLOAD_GAP_ANALYSIS.md.
pnpm plan

# Type-check.
pnpm type-check
```

Full flag reference: `pnpm upload-demo-data --help`.

---

## Outputs

Written under `demo-uploader/.artifacts/` (configurable via `artifactsDir`):

| Artifact                    | Purpose                                           |
| --------------------------- | ------------------------------------------------- |
| `progress.json`             | Resumable per-file status + checksums + attempts  |
| `upload.log.jsonl`          | Structured run log (one JSON object per line)      |
| `screenshots/*.png`         | Full-page capture on each failure / retry          |
| `videos/*.webm`             | Video recording of the run                         |

And at the **repo root**:

| Artifact                 | Purpose                                              |
| ------------------------ | ---------------------------------------------------- |
| `UPLOAD_PLAN.md`         | Every file → destination table (one row per file)    |
| `upload-map.json`        | Machine-readable classification map                  |
| `UPLOAD_GAP_ANALYSIS.md` | Modules that generate/consume data but lack UI upload |
| `UPLOAD_REPORT.md`       | Post-run results, validations, failures, integrity   |

---

## How resuming works

Progress is keyed by **repo-relative path**. On `--resume`, any file whose status is
`uploaded` is skipped. Because checksums are stored, a file whose content matches an
already-uploaded file is detected as a **duplicate** and skipped even without `--resume`.
Delete `.artifacts/progress.json` to force a clean re-upload.

## Reliability

- **Retries** with exponential backoff per upload unit (`retryCount`, `retryBackoffMs`).
- A failed unit is recorded and the run **continues** — one bad file never aborts everything.
- **Screenshot** captured on every failure and retry; **video** for the whole session.
- Exit code is non-zero if any file ended in `failed`.

---

## Architecture

```
demo-uploader/
├─ upload.config.ts        # all tunables (no hard-coded values in logic)
├─ src/
│  ├─ cli.ts               # entrypoint: arg parsing, dry-run, orchestration wiring
│  ├─ config.ts            # layered config resolution (defaults → env → flags)
│  ├─ scanner.ts           # recursive scan + sha256 + repo/uploader roots
│  ├─ classifier.ts        # deterministic file → destination rules
│  ├─ uploader.ts          # browser orchestrator (login → project → per-module)
│  ├─ progress.ts          # resumable JSON progress store + duplicate detection
│  ├─ retry.ts             # exponential-backoff helper
│  ├─ logger.ts            # console + JSONL logger
│  ├─ report.ts            # UPLOAD_REPORT.md renderer
│  ├─ generatePlan.ts      # UPLOAD_PLAN.md / upload-map.json / gap analysis
│  ├─ types.ts             # shared types
│  └─ pages/               # one page object per UI surface
│     ├─ LoginPage.ts
│     ├─ ProjectPage.ts
│     ├─ DocumentsPage.ts
│     ├─ ProcurementPage.ts
│     └─ SchedulePage.ts
```

Each page object mirrors exactly one real DCBrain screen and exposes only the
interactions a user performs there — so if the UI changes, the fix is localized.
