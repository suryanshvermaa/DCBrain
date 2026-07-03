# Deployment

## Environments
- **Local:** `localhost:3000` (frontend), `localhost:8000` (API)
- **Staging:** `staging.dcbrain.example.com` (`develop` branch)
- **Production:** `dcbrain.example.com` (`main` branch)

## Quick Start
Run `docker compose up -d` to spin up frontend, backend, worker, postgres, redis, chromadb, minio, and graph db.

## Production Architecture
```mermaid
graph TD
    DNS["DNS / CDN"] --> LB["Load Balancer"]
    
    subgraph Frontend_Tier ["Frontend Tier"]
        FE1["Frontend Container 1"]
        FE2["Frontend Container 2"]
    end
    
    LB --> FE1
    LB --> FE2
    
    subgraph API_Tier ["API Tier"]
        API1["API Container 1"]
        API2["API Container 2"]
    end
    
    FE1 --> API1
    FE1 --> API2
    FE2 --> API1
    FE2 --> API2
    
    subgraph Data_Tier ["Data Tier"]
        PG[("PostgreSQL")]
        Redis[("Redis")]
        MinIO[("MinIO")]
        GraphDB[("Neo4j 5.x")]
        Chroma[("ChromaDB")]
    end
    
    API1 --> PG
    API1 --> Redis
    API1 --> MinIO
    API1 --> GraphDB
    
    API2 --> PG
    API2 --> Redis
    API2 --> MinIO
    API2 --> GraphDB
    
    subgraph Worker_Tier ["Worker Tier Auto-scaling"]
        W1["BullMQ Task Worker"]
        W2["BullMQ Sim Worker"]
    end
    
    Redis -.->|Task Queue| W1
    Redis -.->|Task Queue| W2
    
    W1 --> PG
    W1 --> MinIO
    W1 --> Chroma
    W1 --> GraphDB
    
    W2 --> PG
    W2 --> GraphDB
```
