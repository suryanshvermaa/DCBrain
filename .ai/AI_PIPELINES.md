# AI Pipelines and Data Flows

## Supervisor Orchestration
```mermaid
graph TD
    UserQuery["User Request / System Event"] --> Supervisor["Supervisor Agent"]
    
    subgraph Agents ["Delegated Agents (14)"]
        DocAgent["Document Agent"]
        KnowAgent["Knowledge Agent"]
        CompAgent["Compliance Agent"]
        SchedAgent["Schedule Risk Agent"]
        ProcAgent["Procurement Agent"]
        HealthAgent["Project Health Agent"]
        ValidAgent["Data Validation Agent"]
        OtherAgents["Commissioning / Risk / Executive / Reporting / Recommendation / Mitigation"]
    end
    
    Supervisor -->|Gemini JSON routing| Agents
    Agents -->|findings| Notifications["In-App Notifications"]
    Agents -->|log| AgentRuns["agent_runs table"]
```

## Agent Auto-Trigger Events
| Event | Triggered Agents |
|-------|------------------|
| Document processed | DOCUMENT, DATA_VALIDATION |
| Schedule imported | SCHEDULE_RISK, PROJECT_HEALTH |
| Procurement imported | PROCUREMENT, PROJECT_HEALTH |

Agents execute via BullMQ `agent-execution` queue. Manual triggers available via `POST /agents/{type}/run`.

## Document Processing & Graph Indexing Pipeline
```mermaid
sequenceDiagram
    participant User
    participant API as Express.js API
    participant BullMQ as BullMQ Queue
    participant Worker as Processing Worker
    participant DB as PostgreSQL
    participant Extract as Extraction
    participant Embed as Embeddings
    participant VectorDB as ChromaDB
    participant GraphDB as Graph Database

    User->>API: Upload Document
    API->>DB: Save metadata
    API->>BullMQ: Enqueue job
    API-->>User: 202 Accepted

    BullMQ->>Worker: Dequeue
    Worker->>Extract: Extract text & entities
    Worker->>Worker: Chunk text
    Worker->>Embed: Generate embeddings
    Worker->>VectorDB: Store Vectors
    Worker->>Extract: Prompt LLM for Entities & Relationships
    Worker->>GraphDB: Store Node/Edge Relationships via Cypher MERGE
    Worker->>DB: Update status to `completed`
```

## Simulation & Failure Propagation Pipeline
```mermaid
stateDiagram-v2
    [*] --> Start
    Start --> InitState: Initialize Simulation State
    
    state "Simulation Execution Loop" as SimLoop {
        InitState --> FetchGraph: Load Dependency Graph
        FetchGraph --> ApplyDelay: Inject Synthetic Delay
        ApplyDelay --> PropagateFailure: Cascade Delay via Graph
        PropagateFailure --> CalcImpact: Estimate Cost/Time Impact
        CalcImpact --> GenerateMitigation: Mitigation Planner Agent
        
        GenerateMitigation --> ApplyDelay: Add alternative scenario
        GenerateMitigation --> FinishSim: Accept best mitigation
    }
    
    FinishSim --> SaveResults: Persist Simulation Output
    SaveResults --> [*]
```
