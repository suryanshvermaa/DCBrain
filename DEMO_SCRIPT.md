# 🎬 DCBrain — Demo Video Script (Word-by-Word Narration)

> **How to use this:** Read the **SAY** lines aloud, naturally, while screen recording. The **[DO]** lines tell you what to click/show. The **[WHY]** notes are for you only — don't read them. Target length: **~5–6 minutes**. Speak calmly, slightly slower than feels natural.

> ⚠️ **Pre-flight checklist (do this BEFORE hitting record):**
> - ✅ Live `GEMINI_API_KEY` and `OPENAI_API_KEY` set in `backend/app.env` — so AI runs on the *real* path, not the fallback.
> - ✅ At least 2–3 **real technical PDFs already uploaded and PROCESSED** in your demo project (electrical/mechanical specs, an ASHRAE or NFPA reference). Verify they show status `PROCESSED`, not `FAILED` or `QUEUED`.
> - ✅ One document upload held in reserve to show ingestion live.
> - ✅ At least one **schedule imported** with activities, so the simulation has real graph data (avoids the canned fallback).
> - ✅ All 8 Docker services up (`docker compose ps`).
> - ✅ Browser zoom ~110%, notifications bell visible, dark mode looks clean.
> - ❌ Do NOT run compliance/simulation on an empty project — that triggers the deterministic fallback.

---

## SCENE 0 — Cold Open (0:00–0:20)

**[DO]** Start on the DCBrain login screen, clean and full-screen.

**SAY:**
> "Data centre construction is one of the most complex engineering efforts on the planet — thousands of documents, dozens of vendors, strict compliance standards, and schedules where a single delay cascades across the entire project. Today I want to show you DCBrain: an AI platform that unifies all of that into one intelligent system. This isn't a prototype or a wrapper around a chatbot — it's a full neuro-symbolic platform, and I'll show you exactly how it works end to end."

**[WHY]** Sets the "this is real, not a demo shell" frame early. Judges hear a lot of prompt-wrappers — you're pre-empting that.

---

## SCENE 1 — Security & Access Control (0:20–1:00)

**[DO]** Log in with your admin account.

**SAY:**
> "First, security. DCBrain is built like enterprise software. There's no open sign-up — this is an IAM-style model where an admin provisions every account. Authentication uses JSON Web Tokens with separate access and refresh tokens, passwords are hashed with bcrypt, and refresh tokens are stored in secure, HTTP-only cookies that can actually be revoked on logout."

**[DO]** Navigate to the Members page of a project.

**SAY:**
> "Access is governed by role-based permissions. We have six distinct roles — Admin, Project Manager, Engineer, Procurement, QA/QC, and Viewer — each mapped to a specific set of permissions like uploading documents, running compliance checks, or importing schedules. And every project is fully isolated: a user only ever sees the workspaces they've been invited to. That isolation is enforced on the server for every single request, not just hidden in the interface."

**[WHY]** This is 100% verified (`security.ts`, `assertProjectAccess`). It signals maturity instantly and separates you from weekend hacks.

---

## SCENE 2 — The Project Hub (1:00–1:20)

**[DO]** Go to the Home / dashboard — show the list of data centre projects.

**SAY:**
> "This is the central hub — every active data centre project in one view. Each one is a completely siloed workspace with its own documents, team members, schedule, and activity history. Let me open one and show you the real intelligence underneath."

**[DO]** Click into your prepared demo project.

---

## SCENE 3 — Document Ingestion Pipeline (1:20–2:20)

**[DO]** Go to the Documents page. Show the already-processed documents. Then upload your reserve document live.

**SAY:**
> "Everything starts with documents. Watch what happens when I upload one."

**[DO]** Drag in / select the reserve file. Point at the status changing.

**SAY:**
> "The moment I upload, the file goes into object storage and a background worker picks up the job. Behind this simple progress bar, a real pipeline is running. The system extracts the text — it handles PDFs, Word docs, Excel sheets, and even runs OCR on scanned images. Then it splits the text into overlapping chunks, and — this is the key part — it generates real vector embeddings for each chunk using an embedding model."

**[DO]** Let it reach PROCESSED (or cut to an already-processed one if slow).

**SAY:**
> "Those embeddings get stored in a vector database for semantic search, the chunks are mirrored in PostgreSQL for keyword search, and at the same time an AI model extracts engineering entities — equipment, vendors, standards, activities — and writes them into a Neo4j knowledge graph. So one upload simultaneously builds a searchable index *and* a connected map of the project. It even detects near-duplicate content automatically. That's the foundation everything else stands on."

**[WHY]** Verified end-to-end (`worker.ts`, `extractors.ts`, `embedder.ts`, `entityExtractor.ts`). This is your strongest "it's real all the way down" moment. If upload is slow on camera, don't wait — cut to a processed doc.

---

## SCENE 4 — RAG Chat with Citations ⭐ THE CENTERPIECE (2:20–3:20)

**[DO]** Open the Chat page. Have a strong question ready that your documents can actually answer.

**SAY:**
> "Now the part that ties it together — I can just ask questions in plain English."

**[DO]** Type a real question, e.g.:
> *"What cooling redundancy is specified in these documents, and does it meet Tier III concurrent maintainability?"*

**SAY (while it responds):**
> "This isn't a generic chatbot answering from memory. It runs a hybrid search — semantic search over the vector embeddings *and* keyword search — then fuses the two result sets using Reciprocal Rank Fusion to find the most relevant passages. It feeds only those real document excerpts to the model, with strict instructions to answer only from that context and never hallucinate."

**[DO]** When the answer arrives, scroll to and point at the **citations / sources**.

**SAY:**
> "And here's the proof it's grounded — every answer comes with citations. These sources point to the actual documents, the actual pages, and the actual excerpts the answer was built from. You can click straight through to verify it. For an engineering audit trail, that traceability is everything."

**[WHY]** Verified (`rag/pipeline.ts`, `rag/generator.ts`). Citations map to real DB rows — this is impossible to fake, and judges know it. Land on the citations; that's the money shot.

---

## SCENE 5 — Knowledge Graph (3:20–3:50)

**[DO]** Open the Graph page.

**SAY:**
> "Remember those entities extracted during ingestion? This is the knowledge graph they build. Every equipment item, vendor, standard, and activity becomes a node, connected by real relationships pulled from the documents — what supplies what, what depends on what, what governs what. This isn't decoration. This graph is what powers our most impressive feature."

**[WHY]** Verified (`graph/service.ts`, Cypher in `entityExtractor.ts`). Use it as the bridge into simulation.

---

## SCENE 6 — Schedule Risk Simulation (3:50–4:40)

**[DO]** Go to Simulations → New. Pick a real activity from your imported schedule. Enter a delay (e.g., 10 days).

**SAY:**
> "In construction, the scariest question is: 'if this one task slips, what else breaks?' DCBrain answers it. I'll take a real activity from the project schedule and simulate a ten-day delay."

**[DO]** Run it. Show the results — the cascade of impacted activities, cost impact, time impact.

**SAY:**
> "The system walks the knowledge graph to trace how that delay propagates through connected activities and equipment — a failure-propagation cascade. It weights each downstream impact, estimates the additional delay days, and calculates the total cost impact. So instead of guessing, a project manager sees the full blast radius of a single slip."

**[DO]** Click "Generate Mitigation Plan."

**SAY:**
> "And then it goes one step further — it hands the whole simulation to an AI mitigation agent that proposes a concrete recovery plan: resequencing, workarounds, and schedule recovery options. Analysis to action, in one click."

**[WHY]** Verified (`simulations/service.ts` + `MITIGATION_PLANNER` agent). ⚠️ MUST have real schedule + graph data or it silently uses canned impacts. This is why the pre-flight checklist matters.

---

## SCENE 7 — Compliance Engine (4:40–5:10)

**[DO]** Go to Compliance. Run an audit against your uploaded specs (with real docs selected).

**SAY:**
> "Compliance is non-negotiable in this industry. DCBrain runs automated audits against the standards that matter — ASHRAE, NFPA, TIA-942. It pulls the actual specification excerpts from your documents, evaluates them against the standards with the AI acting as a principal compliance auditor, and returns structured findings — each one with a pass, warning, or fail status, the evidence it's based on, and a specific recommendation. It even computes an overall compliance score."

**[DO]** Point at a finding's evidence + recommendation, and the score.

**[WHY]** Verified (`compliance/service.ts`, structured Zod output). ⚠️ Run on a project WITH documents so you hit the live AI path, not the fallback.

---

## SCENE 8 — The Agent Ensemble (5:10–5:40)

**[DO]** Go to the Agents page. Show the roster.

**SAY:**
> "Underneath all of this is an ensemble of fourteen autonomous AI agents — for documents, compliance, schedule risk, procurement, project health, commissioning, executive reporting, and more. They're coordinated by a supervisor agent that reads a request, figures out which specialist should handle it, runs that agent on the real project data, and synthesises the answer back. And they don't just respond to prompts — agents can be triggered automatically by events, like a document finishing processing. It's a genuine multi-agent system operating over live project data."

**[WHY]** Verified (`registry.ts` = 14, `supervisor.agent.ts`, `triggers.ts`). Note the injection-safe design if asked — you strip `projectId`/`userId` from LLM-extracted params.

---

## SCENE 9 — Real-Time & Architecture Close (5:40–6:10)

**[DO]** Trigger or show a notification appearing in the bell (e.g., the "Document Processed" notification from Scene 3).

**SAY:**
> "And it's all live — notifications stream in over authenticated WebSockets the moment something happens, across every open tab."

**[DO]** Optionally show the architecture diagram from the README, or just speak over the dashboard.

**SAY:**
> "To bring it home — DCBrain is a neuro-symbolic platform. The neural side is the AI: embeddings, retrieval, reasoning. The symbolic side is the knowledge graph and the mathematical schedule simulation. Together they run on eight orchestrated services — PostgreSQL, a vector database, Neo4j, object storage, and Redis — behind a Next.js front end. Retrieval-augmented search, a live knowledge graph, automated compliance, failure-cascade simulation, and fourteen coordinated AI agents — unified into a single platform for data centre construction. Thank you."

**[WHY]** Verified (`docker-compose.yml` = 8 services, `websocket.ts`). End on the "neuro-symbolic" framing — it's accurate here and memorable.

---

## 🎯 Delivery Tips

- **Pace:** ~140 words/min. If you rush, it reads as nervous. Pause after each feature lands.
- **Land the citations (Scene 4) and the simulation cascade (Scene 6)** — those two moments are what separate you from the field. Give them an extra beat.
- **If something is slow to load,** keep talking — narrate what it's doing. Never sit in silence watching a spinner.
- **If a judge asks "is this real or hardcoded?"** — answer honestly: *"There's a deterministic fallback so the demo never crashes, but everything you're seeing right now is the live model running on our real project data."* Confidence + honesty beats a dodge.
- **Never trigger a feature on an empty project on camera** — that's the only path that shows canned output.

## ⏱️ Timing Summary

| Scene | Feature | Time |
|---|---|---|
| 0 | Cold open | 0:00–0:20 |
| 1 | Security & RBAC | 0:20–1:00 |
| 2 | Project hub | 1:00–1:20 |
| 3 | Ingestion pipeline | 1:20–2:20 |
| 4 | ⭐ RAG chat + citations | 2:20–3:20 |
| 5 | Knowledge graph | 3:20–3:50 |
| 6 | Schedule simulation | 3:50–4:40 |
| 7 | Compliance engine | 4:40–5:10 |
| 8 | 14-agent ensemble | 5:10–5:40 |
| 9 | Real-time + close | 5:40–6:10 |

**Total: ~6 minutes.** To trim to ~4 min, cut Scene 2 to one line and merge Scenes 8–9.
