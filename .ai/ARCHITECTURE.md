# System Architecture

## Architecture Style
DCBrain uses a **neuro-symbolic modular monolith** architecture. It combines AI models (Gemini) for unstructured data extraction and natural language reasoning with a deterministic mathematical engine (Neo4j) for graph-based failure simulation and schedule math.

## High-Level Architecture
```mermaid
graph TD
    Client["Next.js SPA + React Flow (Graph UI)"] --> Nginx["NGINX Reverse Proxy"]
    Nginx --> Backend["Express.js Application (REST + Graph API)"]
    
    subgraph Backend_Services ["Backend Services"]
        AuthSvc
        DocSvc
        SearchSvc
        ChatSvc
        CompSvc
        SchedSvc
        ProcSvc
        RfiSvc
        DashSvc
        AgentSvc
        ReportSvc
        SimSvc["Simulation Svc"]
        GraphSvc["Knowledge Graph Svc"]
    end
    
    Backend --> PG[("PostgreSQL")]
    Backend --> Chroma[("ChromaDB")]
    Backend --> Redis[("Redis")]
    Backend --> GraphDB[("Neo4j 5.x (Knowledge Graph + Failure Propagation)")]
    Backend --> MinIO[("MinIO (Object Storage)")]
    
    Redis -.-> BackgroundWorkers["BullMQ Workers"]
    BackgroundWorkers --> Gemini["Gemini API"]
    BackgroundWorkers --> Tesseract["Tesseract OCR"]
```

## Module Communication
```mermaid
graph LR
    DocSvc -->|Queue Task| BullMQ
    SearchSvc -->|Client| ChromaDB
    SearchSvc -->|Prisma| PG
    SearchSvc -->|HTTP| Gemini
    ChatSvc -->|Function Call| SearchSvc
    CompSvc -->|Function Call| SearchSvc
    AgentSvc -->|Schedule| BullMQ
    AgentSvc -->|Auto-trigger| BullMQ
    DocSvc -->|On process complete| AgentSvc
    SchedSvc -->|On import| AgentSvc
    ProcSvc -->|On import| AgentSvc
    SimSvc -->|Function Call| SchedSvc
    GraphSvc -->|Client| GraphDB
    RfiSvc -->|RAG Pipeline| SearchSvc
    DashSvc -->|Aggregate| ProcSvc
    DashSvc -->|Aggregate| SchedSvc
    DashSvc -->|Aggregate| CompSvc
    DashSvc -->|Aggregate| RfiSvc
    ReportSvc -->|Aggregate| DocSvc
    ReportSvc -->|Aggregate| CompSvc
    ReportSvc -->|Aggregate| SchedSvc
    ReportSvc -->|Aggregate| ProcSvc
    ReportSvc -->|Aggregate| RfiSvc
    ReportSvc -->|Schedule/Trigger| BullMQ
```

## Security
JWT validation, RBAC, HTTPS termination at NGINX, Input validation via Zod.

## Scaling Strategy
Horizontal API scaling, worker scaling via BullMQ, DB read replicas, event-driven event bus.
