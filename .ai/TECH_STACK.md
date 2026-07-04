# Technology Stack

Every technology choice is documented with its rationale. See [DECISIONS.md](./DECISIONS.md) for detailed ADRs.

## Architecture Overview

DCBrain uses a **modular monolith** architecture for the hackathon prototype, designed to be decomposed into microservices for production. The frontend is a Next.js web application communicating with an Express.js REST API backend.

## Frontend

| Technology | Version | Purpose | Rationale |
|-----------|---------|---------|-----------|
| Next.js | 15.x | App framework | Server-side rendering, API routes, App Router, standard for modern React apps. |
| React | 19.x | UI framework | Component-based architecture, large ecosystem, team familiarity. |
| TypeScript | 5.x | Type safety | Catches errors at compile time, improves refactoring confidence, better IDE support. Non-negotiable for a project of this complexity. |
| TailwindCSS | 4.x | Styling | Utility-first CSS framework. Allows rapid UI development without context switching. |
| shadcn/ui | Latest | UI Components | Unstyled, accessible components that we can fully customize. Better than bloated component libraries. |
| Redux Toolkit | 2.x | Client state | Centralized global state management. Enforces predictable state updates, developer tooling (Redux DevTools), and scalability. |
| Recharts | 2.x | Charts | React-native charting library built on D3. Simpler API than raw D3. |
| Lucide React | Latest | Icons | Consistent, tree-shakeable icon set. |

## Backend

| Technology | Version | Purpose | Rationale |
|-----------|---------|---------|-----------|
| Node.js | 20.x | Runtime | Fast, async-driven runtime suitable for I/O heavy operations (document processing API). |
| Express.js | 4.x | Web framework | Mature, minimalist web framework. Vast ecosystem of middleware. |
| TypeScript | 5.x | Type safety | End-to-end type safety when sharing types with the frontend. |
| Zod | 3.x | Data validation | Schema validation for API requests/responses. Integrates perfectly with TypeScript. |
| Prisma | 5.x | ORM | Next-generation Node.js and TypeScript ORM. Type-safe database queries. |
| BullMQ | 5.x | Task queue | Redis-based queue for background processing (document parsing, embeddings). Replaces traditional heavy task worker architectures in the Node ecosystem. |
| Redis | 7.x | Cache/broker | Message broker for BullMQ, caching layer for frequent queries, session storage. |

## AI/ML Stack

| Technology | Version | Purpose | Rationale |
|-----------|---------|---------|-----------|
| LangChain.js / @langchain/core | 0.3+ | LLM framework | Provides RAG pipeline and tool integration abstractions for Node.js. |
| LangGraph.js | 0.1+ | AI Agent framework | Orchestrates stateful, multi-actor agent configurations. Supports cyclic workflows and human-in-the-loop steps. |
| Gemini API | 2.5 Flash | LLM provider | Reasoning, chat, document understanding, RAG response generation, and structured outputs. |
| BAAI/bge-m3 | Latest | Embeddings | Generate vector embeddings for documents and queries for semantic search (never use Gemini for embeddings). |
| ChromaDB | 0.5+ | Vector database | Lightweight vector DB with an official JavaScript/Node client. Suitable for prototype. |
| pdf-parse / tesseract.js | Latest | Document parsing | Node.js libraries for extracting text from PDFs and performing OCR on images. |

## Database

| Technology | Version | Purpose | Rationale |
|-----------|---------|---------|-----------|
| PostgreSQL | 16.x | Primary database | ACID compliance, JSON support, full-text search, mature ecosystem. |
| ChromaDB | 0.5.0 | Vector DB | Stores and queries high-dimensional vectors generated from documents. Open-source, fast, and simple to host in Docker for hackathon. |
| Redis | 7.x | Cache | Message broker for BullMQ and general caching. |
| MinIO | latest | Object Storage | S3-compatible self-hosted object storage for raw PDFs and docx files. |
| Neo4j | 5.x | Graph DB | Used for building the Knowledge Graph, mapping equipment dependencies, and running Failure Propagation simulations. |

## Infrastructure

| Technology | Version | Purpose | Rationale |
|-----------|---------|---------|-----------|
| Docker | 24.x | Containerization | Consistent development and deployment environments. |
| Docker Compose | 2.x | Local orchestration | Multi-container local development. |
| Nginx | 1.25+ | Reverse proxy | SSL termination, static file serving, API routing, rate limiting. |
| GitHub Actions | N/A | CI/CD | Automated testing, linting, building, and deployment. |

## Development Tools

| Tool | Purpose |
|------|---------|
| ESLint + Prettier | Code quality and formatting for TS/JS |
| Jest + Supertest | Backend API and unit testing framework |
| Vitest / RTL | Frontend testing framework |
| Playwright | End-to-end testing |
| Husky + lint-staged | Git hooks for automated checks |

## Dependency Management

- npm or pnpm with lock files for deterministic installs.
- Infrastructure: Docker images pinned to specific tags, never `latest`.

## Related Documents

- [DECISIONS.md](./DECISIONS.md) — Why each technology was chosen
- [ARCHITECTURE.md](./ARCHITECTURE.md) — How these technologies compose into a system
- [ENVIRONMENT.md](./ENVIRONMENT.md) — Configuration for each technology
- [DEPLOYMENT.md](./DEPLOYMENT.md) — How the stack is deployed
