# Task 001: Project Setup — Implementation Plan

## Overview
Set up the complete development environment with frontend (Next.js 14 App Router + TypeScript + TailwindCSS + Redux Toolkit), backend (Express.js + TypeScript), database (PostgreSQL 16), cache (Redis 7), vector store (ChromaDB), object storage (MinIO), graph database (Neo4j 5.x), and Docker Compose orchestration.

## Phase 1: Backend Setup (60 min)

### 1.1 Create Backend Directory Structure
Create the module-based directory structure per ARCHITECTURE.md:
```
backend/
├── src/
│   ├── app.ts                 # Express app factory
│   ├── server.ts              # Entry point
│   ├── core/
│   │   ├── config.ts          # Zod-based env validation
│   │   ├── errors.ts          # Custom error classes
│   │   └── middleware/
│   │       ├── errorHandler.ts
│   │       └── validation.ts
│   ├── lib/
│   │   ├── prisma.ts          # Singleton Prisma client
│   │   ├── redis.ts           # Redis client
│   │   ├── chroma.ts          # ChromaDB client
│   │   ├── minio.ts           # MinIO client
│   │   └── neo4j.ts           # Neo4j driver
│   ├── modules/
│   │   ├── auth/
│   │   ├── documents/
│   │   ├── search/
│   │   ├── chat/
│   │   ├── compliance/
│   │   ├── schedule/
│   │   ├── procurement/
│   │   ├── dashboard/
│   │   ├── agents/
│   │   ├── simulation/
│   │   └── knowledge-graph/
│   └── routes/
│       └── index.ts           # Route aggregator
├── prisma/
│   └── schema.prisma          # Prisma schema
├── package.json
├── tsconfig.json
├── Dockerfile
├── .eslintrc.js
├── .prettierrc
└── jest.config.js
```

### 1.2 Initialize Backend Package.json
- Node 20, TypeScript 5.x, Express 4.x
- Dependencies per TECH_STACK.md
- Dev dependencies: typescript, @types/*, tsx, jest, supertest, eslint, prettier

### 1.3 Create Core Configuration Files
- `tsconfig.json` with strict mode
- `src/core/config.ts` - Zod schema for all env vars from ENVIRONMENT.md
- `src/core/errors.ts` - Custom error classes (NotFoundError, ValidationError, etc.)
- `src/core/middleware/errorHandler.ts` - Centralized error handler
- `src/core/middleware/validation.ts` - Zod validation middleware

### 1.4 Create Library Clients
- `src/lib/prisma.ts` - Singleton PrismaClient with logging in dev
- `src/lib/redis.ts` - ioredis client for BullMQ
- `src/lib/chroma.ts` - ChromaDB client
- `src/lib/minio.ts` - MinIO client
- `src/lib/neo4j.ts` - Neo4j driver

### 1.5 Create Express App Factory
- `src/app.ts` - Express app with CORS, Helmet, JSON parser, health endpoint
- `src/server.ts` - Entry point, starts server on APP_PORT

### 1.6 Prisma Schema & Migrations
- Run `npx prisma init`
- Create initial schema with `users` and `projects` tables
- Run `npx prisma migrate dev --name init`

### 1.7 Health Check Endpoint
- GET `/health` returns `{ status: "healthy", timestamp, version, services: {...} }`

### 1.8 ESLint & Prettier Config

## Phase 2: Frontend Setup (45 min)

### 2.1 Initialize Next.js Project
```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

### 2.2 Install Dependencies
- `@reduxjs/toolkit`, `react-redux`
- `recharts`, `lucide-react`, `react-markdown`
- Future: `@langchain/langgraph`

### 2.3 Create Directory Structure per ARCHITECTURE.md
```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Placeholder dashboard
│   │   ├── globals.css        # Design tokens from UI_GUIDELINES.md
│   │   └── providers.tsx      # Redux Provider
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── layout/
│   ├── features/
│   │   ├── auth/
│   │   ├── documents/
│   │   ├── search/
│   │   ├── chat/
│   │   ├── compliance/
│   │   ├── schedule/
│   │   ├── procurement/
│   │   ├── dashboard/
│   │   └── agents/
│   ├── lib/
│   │   ├── api.ts             # API client
│   │   ├── store.ts           # Redux store
│   │   └── utils.ts
│   └── hooks/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── Dockerfile
├── .eslintrc.js
├── .prettierrc
└── jest.config.ts
```

### 2.4 Configure Design Tokens
- CSS custom properties in `globals.css` per UI_GUIDELINES.md
- Tailwind config with design system colors

### 2.5 Create Redux Store
- `src/lib/store.ts` with configureStore
- `src/app/providers.tsx` with Provider wrapper

### 2.6 Placeholder Page
- Simple dashboard layout with sidebar, top bar, main content

## Phase 3: Docker Compose (45 min)

### 3.1 Create Dockerfile.backend
- Base: node:20-slim
- Install dependencies, copy source
- Use tsx for hot reload in dev
- Expose port 8000

### 3.2 Create Dockerfile.frontend
- Base: node:20-alpine
- Install dependencies, copy source
- Dev mode with volume mount
- Expose port 3000

### 3.3 Create docker-compose.yml
Services:
- **postgres**: postgres:16-alpine, port 5432, health check
- **redis**: redis:7-alpine, port 6379, health check
- **chromadb**: chromadb/chroma:0.5.5, port 8100, health check
- **minio**: minio/minio:latest, ports 9000/9001, health check
- **neo4j**: neo4j:5-community, ports 7474/7687, health check
- **backend**: build from Dockerfile.backend, port 8000, depends on postgres, redis, chromadb, minio, neo4j
- **frontend**: build from Dockerfile.frontend, port 3000, depends on backend
- **worker**: build from Dockerfile.backend (same image), runs bullmq workers

### 3.4 Create .env.example
Copy from ENVIRONMENT.md with all required variables

### 3.5 Create nginx.conf (for production reference)

## Phase 4: Project Root Files (30 min)

### 4.1 Create .gitignore
Cover: node_modules, dist, build, .next, .env, *.log, .DS_Store, coverage, .vercel, *.tsbuildinfo

### 4.2 Create Root README.md
- Quick start with docker compose up
- Service URLs
- Development workflow
- Environment setup

### 4.3 Verify Docker Compose
- `docker compose up -d --build`
- Verify all 8 services start
- Test health endpoints

## Acceptance Criteria Verification

After implementation, verify:
- [ ] `docker compose up -d` starts all 8 services without errors
- [ ] `http://localhost:3000` shows the Next.js placeholder page
- [ ] `http://localhost:8000/health` returns `{"status":"healthy"}`
- [ ] `http://localhost:8000/docs` shows Swagger/OpenAPI docs
- [ ] `docker compose exec backend npx prisma migrate dev` runs without errors
- [ ] No secrets committed to repository
- [ ] TypeScript strict mode passes (`npx tsc --noEmit` in both frontend and backend)
- [ ] ESLint passes in both projects

## Complexity Classification

| Chunk | Complexity | Reason |
|-------|-----------|--------|
| Backend Setup | Complex | Multiple interdependent modules, Prisma setup, multiple DB clients |
| Frontend Setup | Simple | Standard Next.js init with known dependencies |
| Docker Compose | Complex | 8 services with health checks, networking, volume mounts |
| Root Files | Simple | Standard configuration files |

## Dependencies Between Chunks
- Backend must be created before Dockerfile.backend
- Frontend must be created before Dockerfile.frontend
- Both Dockerfiles must exist before docker-compose.yml
- .env.example should be created before docker-compose verification
- Prisma schema must exist before running migrations