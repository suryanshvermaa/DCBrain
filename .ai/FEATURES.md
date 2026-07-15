# Features

## Priority Classification

| Priority | Label | Definition |
|----------|-------|------------|
| P0 | Must Have | Core functionality required for hackathon demo and MVP |
| P1 | Should Have | Important features that significantly enhance value |
| P2 | Nice to Have | Features that add polish and differentiation |
| P3 | Future | Post-MVP features planned for later phases |

---

## P0 — Must Have (Hackathon Demo)

### F-001: User Authentication
- **Status:** Not Started
- **Sprint:** 1
- **Requirements:** [FR-001](./REQUIREMENTS.md#fr-001-user-authentication-and-authorization)
- **Description:** Email/password registration and login with JWT tokens. Role-based access control with four roles: Admin, Project Manager, Engineer, Viewer. Session management with configurable expiry.
- **Key Behaviors:**
  - Registration creates user with default "viewer" role
  - Login returns access token (24h) and refresh token (7d)
  - Admin can elevate user roles
  - Invalid tokens return 401 with clear error message

### F-002: Document Upload & Management
- **Status:** Not Started
- **Sprint:** 1
- **Requirements:** [FR-002](./REQUIREMENTS.md#fr-002-document-upload-and-management)
- **Description:** Upload project documents (PDF, DOCX, XLSX, CSV). Documents are stored, categorized, and tracked through a processing pipeline. Support batch upload, version control, and metadata extraction.
- **Key Behaviors:**
  - Drag-and-drop upload interface
  - Progress bar with per-file status
  - Automatic categorization suggestion based on filename and content
  - Version history preserved when uploading new revisions
  - Document list with sorting, filtering, and search

### F-003: Document Processing Pipeline
- **Status:** Not Started
- **Sprint:** 2
- **Requirements:** [FR-003](./REQUIREMENTS.md#fr-003-document-processing-pipeline)
- **Description:** Asynchronous processing pipeline that extracts text, splits into chunks, generates embeddings, and stores in vector database. Handles PDF (with OCR fallback), DOCX, XLSX formats.
- **Key Behaviors:**
  - Processing runs asynchronously via BullMQ workers
  - Status tracked in real-time (queued → processing → completed/failed)
  - Failed documents retry 3 times with exponential backoff
  - Chunking preserves document structure (section headers, page numbers)
  - Embeddings stored in ChromaDB with rich metadata

### F-004: RAG-Powered Search
- **Status:** Not Started
- **Sprint:** 2
- **Requirements:** [FR-004](./REQUIREMENTS.md#fr-004-rag-powered-document-search)
- **Description:** Natural language search across all project documents. Hybrid search combining semantic (vector) and keyword (BM25) retrieval. LLM generates contextual answers with source citations.
- **Key Behaviors:**
  - Natural language query input with autocomplete suggestions
  - Results show AI-generated answer + source document list
  - Each source includes document name, page number, relevance score
  - Filters by category, date range, specific documents
  - Search history saved per user

### F-005: AI Chat Interface
- **Status:** Not Started
- **Sprint:** 2
- **Requirements:** [FR-005](./REQUIREMENTS.md#fr-005-ai-chat-interface)
- **Description:** Conversational interface for project queries. Maintains context within a session. Supports follow-up questions, document references, and formatted responses.
- **Key Behaviors:**
  - Chat window with message history and markdown rendering
  - Follow-up questions maintain conversation context
  - Users can reference specific documents in queries
  - AI suggests follow-up questions after each response
  - Chat sessions can be exported as PDF

### F-006: Project Dashboard
- **Status:** Not Started
- **Sprint:** 3
- **Requirements:** [FR-009](./REQUIREMENTS.md#fr-009-dashboard-analytics)
- **Description:** Visual dashboard showing project health score, dependency graph visualization, document statistics, compliance summary, and procurement status. Real-time updates via WebSocket.
- **Key Behaviors:**
  - Interactive React Flow dependency graph visualization (turns yellow/red on failures)
  - Project health score (using deterministic composite metric)
  - Failure simulator input panel for "what-if" scenarios
  - Document upload and processing statistics
  - Responsive layout for desktop and tablet

### F-006a: Dependency Graph & Failure Simulator
- **Status:** Completed
- **Sprint:** 3
- **Description:** Deterministic Neo4j graph tracking equipment, vendor, and task dependencies. Calculates delay and failure propagation using PRISM math models.
- **Key Behaviors:**
  - `Impact = Delay - Slack` propagation logic
  - Hard (1.0), Soft (0.5), Parallel (0.2) dependency weighting
  - Executive Copilot AI translates mathematical failures into mitigation plans (`Mitigation = 0.4(TimeSaved) + 0.3(CostEfficiency) + 0.3(Feasibility)`)

---

## P1 — Should Have (MVP)

### F-007: Compliance Validation Engine
- **Status:** Not Started
- **Sprint:** 3
- **Requirements:** [FR-006](./REQUIREMENTS.md#fr-006-compliance-validation-engine)
- **Description:** Automated compliance checking of project documents against industry standards (ASHRAE, NFPA, TIA-942, Uptime Institute). Generates compliance reports with pass/fail/warning status per requirement.
- **Key Behaviors:**
  - Select document and standards to check against
  - AI extracts requirements from specification and maps to standard clauses
  - Results show compliance status per clause with evidence
  - Non-compliant items highlighted with severity rating
  - Exportable compliance report (PDF)

### F-008: Schedule Risk Prediction & Math Models
- **Status:** Not Started
- **Sprint:** 4
- **Requirements:** [FR-007](./REQUIREMENTS.md#fr-007-schedule-risk-prediction)
- **Description:** Analyze critical path and predict delay risks. Uses deterministic math formulas to calculate project health and risk scores.
- **Key Behaviors:**
  - Risk Formula: `Risk = 0.35(Schedule) + 0.25(Procurement) + 0.20(Compliance) + 0.20(Commissioning)`
  - Health Score: `Health = 100 - Risk`
  - Monte Carlo Simulations (1000 iterations) for predicting schedule slips and cost overruns
  - Predicted delay with confidence interval
  - Recommended mitigation actions per high-risk activity

### F-009: Procurement Visibility Dashboard
- **Status:** Implemented
- **Sprint:** 4
- **Requirements:** [FR-008](./REQUIREMENTS.md#fr-008-procurement-visibility-dashboard)
- **Description:** Centralized procurement tracking showing material status, vendor performance, lead times, and specification compliance for all procurement items.
- **Key Behaviors:**
  - Import procurement data from CSV/Excel
  - Visual pipeline: identified → RFQ → PO → fabrication → shipped → received → installed
  - Vendor performance scorecards
  - Overdue and at-risk item alerts
  - Lead time tracking with critical date warnings

### F-010: RFI Management
- **Status:** Completed
- **Sprint:** 4
- **Description:** Track Requests for Information (RFIs) with status management, assignment, and integration with document search. AI can suggest answers to new RFIs based on existing documents.
- **Key Behaviors:**
  - Create, assign, and track RFIs
  - Link RFIs to related documents
  - AI-suggested answers based on project documents
  - Overdue RFI alerts
  - RFI resolution timeline analytics

---

## P2 — Nice to Have (Enhancement)

### F-011: AI Agents
- **Status:** Not Started
- **Sprint:** 5
- **Requirements:** [FR-010](./REQUIREMENTS.md#fr-010-ai-agents)
- **Description:** Autonomous AI agents that run on schedules or triggers to monitor project data and proactively surface insights. Includes Document Monitor, Compliance Watch, Schedule Sentinel, and RFI Tracker agents.
- **Key Behaviors:**
  - Configurable agent schedules (daily, weekly, on-event)
  - Agent findings appear as dashboard notifications
  - Agent run history with detailed findings
  - Manual trigger option for ad-hoc runs

### F-012: Advanced Analytics
- **Status:** Not Started
- **Sprint:** 5
- **Description:** Enhanced dashboard analytics including trend charts, comparison views, and predictive insights. Document usage analytics showing most-searched topics and knowledge gaps.
- **Key Behaviors:**
  - Time-series charts for key metrics
  - Document search analytics (popular queries, unanswered questions)
  - Compliance trend over time
  - Schedule performance tracking (SPI/CPI curves)

### F-013: Notification System
- **Status:** Not Started
- **Sprint:** 5
- **Description:** Real-time notifications via WebSocket and optional email. Users configure notification preferences for different event types.
- **Key Behaviors:**
  - In-app notification bell with unread count
  - WebSocket-based real-time delivery
  - Per-event-type notification preferences
  - Email digest option (daily/weekly summary)

---

## P3 — Future (Post-MVP)

### F-014: Multi-Project Portfolio View
- Cross-project analytics and resource allocation
- Lessons learned transfer between projects

### F-015: BIM Integration
- 3D model viewer integration
- Spatial search: "Show me all equipment in Server Hall B"

### F-016: Automated Report Generation
- **Status:** Completed
- **Sprint:** 5
- **Description:** Generates 6 report types (daily, weekly, executive, compliance, risk, procurement) with AI-summarized sections, PDFKit PDF export, MinIO storage, and BullMQ async generation.
- **Key Behaviors:**
  - Configurable report generation (sync/async)
  - PDF and Markdown export
  - AI summaries per section
  - Frontend view with history and previews

### F-017: Mobile Application
- Progressive Web App for field access
- Offline document viewing
- Camera integration for field inspection photos

### F-018: Integration Hub
- Procore API integration
- Aconex document sync
- Microsoft Teams notifications
- Power BI connector


### F-020: Expanded AI Ensemble (14 Agents)
- Rollout of specialized agents: Supervisor, Mitigation Planner, Executive Copilot, Recommendation, and Data Validation agents to fully orchestrate the platform automatically.

## Related Documents

- [REQUIREMENTS.md](./REQUIREMENTS.md) — Detailed requirements for each feature
- [ROADMAP.md](./ROADMAP.md) — Timeline for feature delivery
- [UI_GUIDELINES.md](./UI_GUIDELINES.md) — Design specifications
- [COMPONENTS.md](./COMPONENTS.md) — Frontend components for each feature

