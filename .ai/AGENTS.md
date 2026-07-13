# AI Agents

DCBrain orchestrates an ensemble of **14 specialized AI agents** plus a top-level **Supervisor Agent** that routes work between them. Every agent exposes a uniform interface (`run(input, ctx) → output`) and is implemented as a LangGraph.js node that the Supervisor can compose.

Each agent below is documented with:

- **Purpose** — the agent's reason for existing.
- **Responsibilities** — what it is accountable for.
- **Inputs** — data and signals the agent consumes.
- **Outputs** — structured artefacts it produces.
- **Dependencies** — services, tables, or other agents it relies on.
- **Prompt Summary** — the system prompt template that governs its behaviour.
- **Future Improvements** — known gaps or planned enhancements.

> All agents run inside the **Agent Service** (`/api/v1/projects/{id}/agents/{type}/run`) on BullMQ workers, scheduled by the Supervisor or triggered manually. Full prompt text lives under [`prompts/agents/`](./prompts/).

---

## 1. Supervisor Agent

- **Purpose:** Top-level orchestrator. Receives every user request or system event and decides which sub-agent (or sequence of sub-agents) should handle it.
- **Responsibilities:**
  - Intent classification over natural-language requests.
  - Routing to the appropriate sub-agent(s).
  - Composing multi-agent responses (e.g. Compliance + Schedule Risk for "Will this UPS delay the project?").
  - Enforcing rate limits and per-project scopes.
  - Logging every dispatch to `agent_runs`.
- **Inputs:** User query (string), project context, conversation history, available sub-agent capabilities.
- **Outputs:** Routing plan (`{ agents_to_invoke: [...], extracted_parameters: {...} }`), final composed answer.
- **Dependencies:** All other agents (it dispatches them), PostgreSQL (`agent_runs`), Redis (BullMQ), Gemini 2.5 Flash (intent classification), LangGraph.js.
- **Prompt Summary:** "You are the Supervisor Agent. Route the user's query to the most appropriate sub-agent. Output JSON: `{ agent_to_invoke, extracted_parameters }`. Allowed agents: Document, Knowledge, Compliance, Schedule Risk, Procurement, Commissioning, Risk Analysis, Executive Copilot, Reporting, Recommendation, Mitigation Planner, Project Health, Data Validation."
- **Future Improvements:** Reinforcement-learning-based routing from feedback; cost/latency budgets per dispatch; auto-fallback if a sub-agent fails twice; integration of the future RFI Intelligence Agent to proactively track, query, and flag unresolved contractor questions.

---

## 2. Document Agent

- **Purpose:** Convert raw uploaded documents into structured, searchable knowledge.
- **Responsibilities:**
  - Trigger and supervise the document processing pipeline (extract → OCR → chunk → embed → index).
  - Extract metadata (title, author, revision, document number, dates).
  - Extract entities (equipment tags, standards clauses, vendor names).
  - Detect duplicates and near-duplicates via embedding similarity.
  - Maintain document versioning and supersession links.
- **Inputs:** Newly uploaded file in MinIO, file MIME type, project context, optional user-supplied category.
- **Outputs:** `documents` row, `document_versions` row, `chunks` rows, ChromaDB vectors, Neo4j entity nodes, processing status events.
- **Dependencies:** MinIO, Tesseract OCR, `pdf-parse` / `docx` / `xlsx` parsers, BGE-M3 embeddings, ChromaDB, Neo4j, BullMQ, PostgreSQL.
- **Prompt Summary:** "You are the Document Agent. Extract structured metadata and entities from this document excerpt. Output JSON with `title`, `revision`, `document_number`, `entities[]`, `equipment_tags[]`, `referenced_standards[]`."
- **Future Improvements:** Layout-aware extraction for complex engineering drawings; automatic drawing-symbol recognition via vision model; auto-generated document summaries.

---

## 3. Knowledge Agent (Chat / RAG)

- **Purpose:** The user-facing conversational brain. Answers free-form questions about a project.
- **Responsibilities:**
  - Hybrid retrieval (ChromaDB semantic + PostgreSQL BM25) using Reciprocal Rank Fusion.
  - Context construction from top-K chunks.
  - Answer generation with mandatory source citations.
  - Suggesting follow-up questions.
- **Inputs:** User chat message, conversation history (last N turns), project filter, optional document reference, user role.
- **Outputs:** Chat message (`chat_messages`) with answer text, `citations[]` (`{ doc_id, page, chunk_id, score, quote }`), suggested follow-ups, confidence score.
- **Dependencies:** ChromaDB, PostgreSQL (chunks, documents), Gemini 2.5 Flash, BGE-M3, LangChain.js RAG chain.
- **Prompt Summary:** "You are an expert EPC Data Centre engineer. Answer the user's query based ONLY on the provided context documents. Cite your sources using `[DocName – Page]`. Context: `{context}`. Query: `{query}`."
- **Future Improvements:** Per-user answer-style preferences; ability to chain into Compliance/Schedule agents mid-conversation; multilingual support.

---

## 4. Compliance Agent

- **Purpose:** Continuously verify that project specifications and vendor submittals conform to the referenced industry standards.
- **Responsibilities:**
  - Extract normative requirements from specifications.
  - Map each requirement to a clause in a referenced standard (ASHRAE 90.4, TIA-942, NFPA 75/76, Uptime Institute Tier, IEEE 3006, IEC 62040, EN 50600).
  - Compare vendor submittals and design documents against those requirements.
  - Emit a pass / fail / warning finding with severity, evidence quote, and clause reference.
- **Inputs:** Target document (spec or submittal), list of applicable standards, project context.
- **Outputs:** `compliance_checks` row with `findings[]` (status, severity, evidence, clause_ref, remediation_hint).
- **Dependencies:** Document Agent (for parsed chunks), Knowledge Agent (for retrieval), Standards embeddings in ChromaDB, Gemini 2.5 Flash (JSON-mode reasoning).
- **Prompt Summary:** "Analyze this engineering specification excerpt against the provided standard code. Standard: `{standard}`. Excerpt: `{excerpt}`. Output JSON: `{ status: pass|fail|warning, finding, severity, clause_ref, evidence_quote }`."
- **Future Improvements:** Auto-ingest of new standard revisions; per-clause regulatory update alerts; jurisdiction-specific standards overlays.

---

## 5. Schedule Risk Agent

- **Purpose:** Predict delay risk on project activities and surface activities that are quietly drifting off-plan.
- **Responsibilities:**
  - Import and parse Primavera P6 XML schedules.
  - Compute critical path, total float, SPI, float consumption rate.
  - Score each activity's delay probability using historical performance, RFI velocity, procurement lead time, and resource loading.
  - Produce a risk heat map (red / amber / green).
- **Inputs:** P6 XML export, RFI log, procurement lead-time data, historical project performance baseline.
- **Outputs:** `schedule_activities` rows, per-activity `risk_score` (0–100), predicted delay (`days`, `confidence`), heat-map payload.
- **Dependencies:** P6 XML parser, PostgreSQL, Neo4j (dependency graph), Gemini 2.5 Flash (reasoning), BullMQ (scheduled runs).
- **Prompt Summary:** "Given these schedule activities, identify activities on the critical path with high resource constraints and low float. Activities: `{activities}`. Output JSON with `high_risk_ids[]`, `reasons[]`, `predicted_delay_days`."
- **Future Improvements:** Monte-Carlo schedule simulation; weather/holiday calendar integration; automatic re-baselining on approved change orders.

---

## 6. Procurement Agent

- **Purpose:** Track every PO from issue through delivery, and warn when a vendor or item is at risk.
- **Responsibilities:**
  - Ingest procurement CSV / Excel exports.
  - Match each PO line item against the specification it satisfies (via the Knowledge Agent).
  - Compute lead-time vs plan; flag items approaching their required-on-site date.
  - Score vendor performance (on-time delivery rate, NCR frequency, compliance hit rate).
  - Suggest alternative vendors for high-risk long-lead items.
- **Inputs:** Procurement export, vendor master, specification references, project schedule (required-on-site dates).
- **Outputs:** `procurement_items` rows, vendor scorecards, at-risk item alerts, alternative vendor suggestions.
- **Dependencies:** Document Agent, Knowledge Agent, Schedule Risk Agent, vendor embeddings, Gemini 2.5 Flash.
- **Prompt Summary:** "You are the Procurement Agent. Given these POs and required-on-site dates, identify items at risk of late delivery and suggest alternative vendors. POs: `{pos}`. Output JSON `{ at_risk: [...], suggested_alternatives: [...] }`."
- **Future Improvements:** Direct vendor portal integration; market-price monitoring; automated RFQ generation.

---

## 7. Commissioning Agent

- **Purpose:** Guide and verify commissioning activities against design intent and specifications.
- **Responsibilities:**
  - Map commissioning procedures (Cx scripts) to specification clauses.
  - Track commissioning sign-offs and outstanding punch items.
  - Detect missing or incomplete test records.
  - Answer "has X been commissioned?" queries.
- **Inputs:** Commissioning scripts, test records, punch lists, specifications.
- **Outputs:** Commissioning status report, missing-test alerts, punch-list summaries.
- **Dependencies:** Document Agent, Knowledge Agent, PostgreSQL, Gemini 2.5 Flash.
- **Prompt Summary:** "You are the Commissioning Copilot. Given a list of commissioning procedures and test records, identify untested or failed procedures. Procedures: `{procedures}`. Records: `{records}`."
- **Future Improvements:** IoT/sensor data ingestion for live commissioning dashboards; voice-based field inspections.

---

## 8. Risk Analysis Agent

- **Purpose:** Multi-modal deep risk assessment that goes beyond schedule risk to combine cost, quality, safety, and external signals.
- **Responsibilities:**
  - Aggregate risk signals from Schedule, Procurement, Compliance, RFI, and Inspection agents.
  - Compute a composite project risk score (0–100).
  - Identify emerging risk patterns not visible in any single domain.
  - Produce executive-readable risk narratives.
- **Inputs:** Outputs from Schedule Risk, Procurement, Compliance, RFI Intelligence, Inspection agents.
- **Outputs:** Composite risk score, ranked risk register, executive narrative, trend chart data.
- **Dependencies:** All domain agents, PostgreSQL, Neo4j, Gemini 2.5 Flash.
- **Prompt Summary:** "You are the Risk Analysis Agent. Synthesize signals from schedule, procurement, compliance, RFIs, and inspections into a ranked project risk register with executive narrative."
- **Future Improvements:** External signal ingestion (weather, geopolitics, market indices); Bayesian belief networks for risk propagation.

---

## 9. Executive Copilot Agent

- **Purpose:** A boardroom-grade assistant that answers high-level strategic questions for directors and project executives.
- **Responsibilities:**
  - Translate executive questions into multi-agent queries.
  - Synthesize findings from multiple agents into a coherent executive brief.
  - Frame answers in terms of cost, schedule, risk, and reputation.
- **Inputs:** Executive user query, project portfolio context, outputs from all relevant agents.
- **Outputs:** Executive brief (markdown), KPI snapshot, recommended decisions.
- **Dependencies:** Supervisor, all domain agents, Reporting Agent.
- **Prompt Summary:** "You are the Executive Copilot. Answer the executive's question in cost/schedule/risk framing. Output JSON with `brief`, `kpis[]`, `recommended_decisions[]`."
- **Future Improvements:** Board-pack auto-generation; scenario comparison ("what if we delay Phase 2 by 30 days?").

---

## 10. Reporting Agent

- **Purpose:** Generate periodic human-readable project reports from raw platform data.
- **Responsibilities:**
  - Compose daily, weekly, and executive reports.
  - Aggregate metrics (KPIs, risk scores, compliance status, procurement status).
  - Render as Markdown and PDF (via headless renderer).
  - Distribute via in-app notifications and (future) email.
- **Inputs:** Time window, report template, project data, agent outputs.
- **Outputs:** Report artefact (Markdown + PDF), `report_runs` row, distribution log.
- **Dependencies:** All domain agents, PostgreSQL, Markdown→PDF renderer (Puppeteer or wkhtmltopdf), MinIO (PDF storage).
- **Prompt Summary:** "You are the Reporting Agent. Compose a `{frequency}` report for project `{project}`. Include sections: Executive Summary, Schedule, Procurement, Compliance, Risks, RFIs, Recommendations."
- **Future Improvements:** Email/Slack distribution; auto-translation; branded multi-tenant templates.

---

## 11. Recommendation Agent

- **Purpose:** Provide proactive, prescriptive suggestions for design improvements, vendor alternatives, and process changes.
- **Responsibilities:**
  - Detect improvement opportunities from compliance findings, RFI patterns, and procurement trends.
  - Rank suggestions by impact and effort.
  - Link each suggestion to supporting evidence.
- **Inputs:** Compliance findings, RFI history, procurement alternatives, vendor scorecards.
- **Outputs:** Recommendation cards (`{ title, rationale, evidence, impact, effort }`), surfaced in the dashboard.
- **Dependencies:** Compliance, Procurement, Knowledge Agents, Gemini 2.5 Flash.
- **Prompt Summary:** "You are the Recommendation Agent. Given these compliance findings and procurement alternatives, propose three concrete improvement actions ranked by impact."
- **Future Improvements:** User-feedback loop to rank recommendations; A/B-style prompt tuning per project.

---

## 12. Mitigation Planner Agent

- **Purpose:** When a delay or risk is identified, generate a concrete step-by-step mitigation plan.
- **Responsibilities:**
  - Accept a Simulation result or Risk Analysis finding.
  - Generate alternative sequencing, expediting, and re-scoping options.
  - Estimate cost and schedule impact of each option.
  - Recommend the best plan with trade-offs.
- **Inputs:** Simulation output, current schedule, available resources, vendor alternatives.
- **Outputs:** Mitigation plan (`{ actions[], est_cost_savings, est_time_savings, tradeoffs }`).
- **Dependencies:** Simulation Engine, Schedule Risk, Procurement Agents, Gemini 2.5 Flash, Neo4j.
- **Prompt Summary:** "The following simulation shows a 4-week delay in chiller delivery propagating to commissioning. Suggest three mitigation strategies involving alternative sequencing or expediting procurement. Simulation Data: `{simulation_data}`."
- **Future Improvements:** Auto-generated Gantt deltas; integration with change-order workflow.

---

## 13. Project Health Agent

- **Purpose:** Continuously compute the composite **Project Health Score** and surface trend changes.
- **Responsibilities:**
  - Aggregate schedule SPI, procurement on-time rate, compliance pass rate, RFI ageing, NCR rate, safety incidents.
  - Compute weighted health score (0–100) per project.
  - Detect week-over-week deterioration.
- **Inputs:** KPI feeds from each module, historical project baselines.
- **Outputs:** Project health score, sub-scores, trend line, alerts on deterioration.
- **Dependencies:** All domain agents, PostgreSQL, BullMQ (daily scheduled run).
- **Prompt Summary:** "You are the Project Health Agent. Given the current KPIs and last week's values, output the composite health score and call out any sub-metric that worsened by more than 10%."
- **Future Improvements:** Predictive health (7-day forecast); peer-project benchmarking.

---

## 14. Data Validation Agent

- **Purpose:** Guard data integrity across all modules.
- **Responsibilities:**
  - Detect duplicate documents and chunks.
  - Identify missing required metadata.
  - Detect orphaned records (e.g. RFI without a parent document).
  - Flag schema mismatches on imported files.
- **Inputs:** Full project dataset (documents, RFIs, procurement, schedule).
- **Outputs:** Validation report (`{ issues[], severity, recommended_action }`).
- **Dependencies:** PostgreSQL, ChromaDB, Neo4j, file importers.
- **Prompt Summary:** "You are the Data Validation Agent. Scan the project dataset for duplicates, missing required metadata, and orphaned records. Output JSON `{ issues[] }`."
- **Future Improvements:** Auto-correction proposals with human-in-the-loop approval; continuous schema-drift detection on imports.

---

## Agent Roster & Sprint Allocation

| # | Agent | Phase | Sprint | Priority |
|---|-------|-------|--------|----------|
| 1 | Supervisor | 2 | 5 | P0 |
| 2 | Document | 1 | 2 | P0 |
| 3 | Knowledge (Chat) | 1 | 2 | P0 |
| 4 | Compliance | 2 | 3 | P1 |
| 5 | Schedule Risk | 2 | 4 | P1 |
| 6 | Procurement | 2 | 4 | P1 |
| 7 | Commissioning | 3 | 5 | P1 |
| 8 | Risk Analysis | 3 | 5 | P2 |
| 9 | Executive Copilot | 3 | 5 | P2 |
| 10 | Reporting | 3 | 5 | P2 |
| 11 | Recommendation | 3 | 5 | P2 |
| 12 | Mitigation Planner | 3 | 5 | P2 |
| 13 | Project Health | 2 | 4 | P1 |
| 14 | Data Validation | 2 | 4 | P1 |

## Related Documents

- [AI_PIPELINES.md](./AI_PIPELINES.md) — How agents are wired into pipelines.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Where the Agent Service lives in the system.
- [API.md](./API.md) — `/projects/{id}/agents/{type}/run` endpoint.
- [PROMPTS.md](./PROMPTS.md) — Prompt library index.
- [prompts/](./prompts/) — Full prompt text per agent.
