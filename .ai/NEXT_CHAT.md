# Next Chat Instructions

> **This file tells any AI model exactly what to read and what to do when starting a new session.**

---

## Current Status

**Date:** 2026-06-30
**Phase:** Phase 1 — Foundation
**Active Task:** 001 — Project Setup
**Active Task File:** [tasks/001-project-setup/task.md](./tasks/001-project-setup/task.md)
**Blocker:** None

---

## Before Writing Any Code, Read These Files

### Mandatory Reading (Every Session)

1. **[PROJECT_STATE.md](./PROJECT_STATE.md)** — Where development stands right now
2. **[state/current_task.json](./state/current_task.json)** — Machine-readable active task
3. **The active task folder** — currently [tasks/001-project-setup/](./tasks/001-project-setup/)
   - `task.md` — What needs to be done
   - `plan.md` — How to do it
   - `progress.md` — What has been done so far

### Read If Working On Architecture or New Features

4. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — System design, data flows, directory structure
5. **[DECISIONS.md](./DECISIONS.md)** — Why things are built the way they are
6. **[TECH_STACK.md](./TECH_STACK.md)** — What technologies to use

### Read If Writing Code

7. **[CODING_STANDARDS.md](./CODING_STANDARDS.md)** — Code standards and conventions (alias: [CODING_RULES.md](./CODING_RULES.md))
8. **[SECURITY.md](./SECURITY.md)** — Security requirements that affect code
9. **[ENVIRONMENT.md](./ENVIRONMENT.md)** — Environment variables and configuration

### Read If Working On Frontend

10. **[UI_GUIDELINES.md](./UI_GUIDELINES.md)** — Design system, tokens, layouts (alias: [UI_UX.md](./UI_UX.md))
11. **[COMPONENTS.md](./COMPONENTS.md)** — Component hierarchy and props

### Read If Working On Backend

12. **[DATABASE.md](./DATABASE.md)** — Database schema
13. **[API.md](./API.md)** — REST endpoint definitions

---

## What To Do Right Now

### Task 001: Project Setup

The first task is to set up the development environment and project structure. This involves:

1. **Create the frontend project** using Next.js + React + Tailwind
   - Initialize with `npx create-next-app@latest`
   - Install core dependencies (`@reduxjs/toolkit`, `react-redux`, `recharts`, `lucide-react`, `shadcn/ui`)
   - Set up the directory structure per [ARCHITECTURE.md](./ARCHITECTURE.md)
   - Configure ESLint, Prettier, and TypeScript strict mode

2. **Create the backend project** using Express.js + Node.js
   - Initialize `package.json`
   - Install core dependencies (`express`, `bullmq`, `prisma`, `zod`, `langchain`, `@langchain/langgraph`, `ioredis`)
   - Set up the module-based directory structure per [ARCHITECTURE.md](./ARCHITECTURE.md)
   - Create Prisma schema and generate client
   - Set up Express app factory with module routing (each domain in its own folder)

3. **Create Docker Compose** configuration
   - Frontend, backend, PostgreSQL, Redis, ChromaDB services
   - Volume mounts for hot reload
   - Environment variable configuration

4. **Create project-root files**
   - `docker-compose.yml`
   - `.env.example` (copy from [ENVIRONMENT.md](./ENVIRONMENT.md))
   - `.gitignore`
   - Root `README.md`

### After Completing the Task

After completing any task, you MUST:

1. **Update the task's `progress.md`** with what was done
2. **Update the task's `review.md`** with any notes for reviewers
3. **Update [PROJECT_STATE.md](./PROJECT_STATE.md)** with new status
4. **Update [state/current_task.json](./state/current_task.json)** to point to the next task
5. **Update [CHANGELOG.md](./CHANGELOG.md)** with what was added
6. **Update this file (NEXT_CHAT.md)** with instructions for the next session
7. **Update [tasks/completed.md](./tasks/completed.md)** and [tasks/sprint.md](./tasks/sprint.md)

---

## Important Context for AI Models

1. **This project uses Vibe Coding** — multiple AI models collaborate across sessions. Never assume chat history exists.
2. **Neuro-Symbolic PRISM Pivot** — This project heavily prioritizes a deterministic failure simulation engine (Neo4j Graph + Math Formulas) for the Hackathon MVP, rather than just an AI Chat interface. AI agents are used to extract data for the math models and explain the results.
3. **All knowledge must live in files** — if you discover something important, document it in the appropriate `.ai/` file.
3. **Follow the coding standards** — [CODING_STANDARDS.md](./CODING_STANDARDS.md) is the law. Deviations require an ADR.
4. **The architecture is decided** — don't propose alternative frameworks or architectures without reading [DECISIONS.md](./DECISIONS.md) first. If you have a strong reason to deviate, create a new ADR.
5. **Update state files** — always keep [PROJECT_STATE.md](./PROJECT_STATE.md), [state/current_task.json](./state/current_task.json), and this file current.
6. **Check for known issues** — read [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) before starting work that might be affected.
7. **Record lessons** — add to [LESSONS.md](./LESSONS.md) when you discover something important.

---

## Quick Reference for Common Tasks

| I want to... | Read this first |
|--------------|----------------|
| Add a new feature | [FEATURES.md](./FEATURES.md), [templates/feature.md](./templates/feature.md) |
| Fix a bug | [KNOWN_ISSUES.md](./KNOWN_ISSUES.md), [templates/bug.md](./templates/bug.md) |
| Add an API endpoint | [API.md](./API.md), [DATABASE.md](./DATABASE.md), [templates/api.md](./templates/api.md) |
| Add a React component | [COMPONENTS.md](./COMPONENTS.md), [UI_GUIDELINES.md](./UI_GUIDELINES.md), [CODING_STANDARDS.md](./CODING_STANDARDS.md) |
| Make an architecture decision | [DECISIONS.md](./DECISIONS.md), [templates/decision.md](./templates/decision.md) |
| Deploy | [DEPLOYMENT.md](./DEPLOYMENT.md), [ENVIRONMENT.md](./ENVIRONMENT.md) |
| Write tests | [TESTING.md](./TESTING.md) |
| Understand a term | [GLOSSARY.md](./GLOSSARY.md) |
