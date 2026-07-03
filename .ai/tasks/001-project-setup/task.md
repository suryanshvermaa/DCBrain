# Task 001: Project Setup

## Overview
- **ID:** 001
- **Priority:** P0 (Critical)
- **Estimate:** 4 hours
- **Sprint:** 1
- **Dependencies:** None
- **Status:** Not Started

## Objective

Set up the complete development environment with frontend (Next.js), backend (Express.js), database (PostgreSQL), cache (Redis), vector store (ChromaDB), and Docker Compose orchestration. After this task, any developer should be able to run `docker compose up` and have a working development environment.

## Acceptance Criteria

- [ ] Frontend project initialized with Next.js + TypeScript (App Router)
- [ ] Backend project initialized with Express.js + Node.js + TypeScript
- [ ] Docker Compose configuration starts all services (frontend, backend, worker, PostgreSQL, Redis, ChromaDB, MinIO, Neo4j)
- [ ] Frontend loads at `http://localhost:3000` showing a placeholder page
- [ ] Backend responds at `http://localhost:8000/health` with service status
- [ ] API docs available at `http://localhost:8000/docs`
- [ ] Database migrations run successfully via Prisma
- [ ] ESLint, Prettier, and TypeScript strict mode configured
- [ ] `.env.example` is created with all required variables (including Gemini, MinIO, Neo4j)
- [ ] `.gitignore` covers Node, Docker, IDE, and environment artifacts
- [ ] Root `README.md` documents setup steps

## Required APIs
- [List APIs here]

## Required Database Changes
- [List database changes here]

## Required Tests
- [List tests here]

## Required Documentation
- [List documentation updates here]

## Required Mermaid Diagram Updates
- [List Mermaid diagram updates here]

## Technical Details

### Frontend Setup
- Use `npx create-next-app@latest` with React + TypeScript template (App Router)
- Install dependencies: @reduxjs/toolkit, react-redux, recharts, lucide-react, react-markdown, @langchain/langgraph (future agent wiring)
- Configure TypeScript strict mode
- Set up directory structure per [ARCHITECTURE.md](../../ARCHITECTURE.md)
- Create CSS custom properties for design system per [UI_GUIDELINES.md](../../UI_GUIDELINES.md)

### Backend Setup
- Create Express application factory in `src/app.ts`
- Configure Zod settings in `src/core/config.ts`
- Set up Prisma async engine in `src/lib/prisma.ts`
- Initialize Prisma for migrations
- Create health check endpoint at `/health`
- Set up CORS middleware
- Install dependencies per [TECH_STACK.md](../../TECH_STACK.md)

### Docker Compose
- Define services per [DEPLOYMENT.md](../../DEPLOYMENT.md): frontend, backend, worker, PostgreSQL, Redis, ChromaDB, MinIO, Neo4j
- Configure volumes for hot reload where applicable
- Set up internal Docker networking between services
- Configure health checks for stateful services (postgres, redis, chromadb, minio, neo4j)

## Reference Documents
- [ARCHITECTURE.md](../../ARCHITECTURE.md) — Directory structure
- [TECH_STACK.md](../../TECH_STACK.md) — Dependencies and versions
- [DEPLOYMENT.md](../../DEPLOYMENT.md) — Docker Compose configuration
- [ENVIRONMENT.md](../../ENVIRONMENT.md) — Environment variables
- [UI_GUIDELINES.md](../../UI_GUIDELINES.md) — Design tokens for CSS setup
