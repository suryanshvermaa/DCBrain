# Next Chat Instructions

> **This file tells any AI model exactly what to read and what to do when starting a new session.**

---

## Current Status

**Date:** 2026-07-04
**Phase:** Phase 1 — Foundation
**Active Task:** 002 — Authentication
**Active Task File:** [tasks/002-authentication/task.md](./tasks/002-authentication/task.md)
**Blocker:** None

---

## Before Writing Any Code, Read These Files

### Mandatory Reading (Every Session)

1. **[PROJECT_STATE.md](./PROJECT_STATE.md)** → [CURRENT_STATE.md](./CURRENT_STATE.md) — Where development stands right now
2. **[state/current_task.json](./state/current_task.json)** — Machine-readable active task
3. **The active task folder** — currently [tasks/002-authentication/](./tasks/002-authentication/)
   - `task.md` — What needs to be done
   - `plan.md` — How to do it
   - `progress.md` — What has been done so far
   - `review.md` — Review notes

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

### Task 002: Authentication

Implement user authentication for the platform. This typically involves:

1. **Backend**
   - Register `/api/auth/register` and login `/api/auth/login` endpoints
   - JWT access + refresh token flow
   - Password hashing with bcrypt
   - Zod schemas for request validation
   - Prisma user queries
   - Auth middleware to protect routes
   - Refresh token endpoint `/api/auth/refresh`

2. **Frontend**
   - Login and register pages (`/login`, `/register`)
   - Redux slice for auth state
   - API client integration for auth endpoints
   - Protected route wrapper
   - Store tokens (access in memory or httpOnly cookie context; follow project conventions)

3. **Documentation**
   - Update `API.md` with auth endpoints
   - Update `DATABASE.md` if schema changes
   - Update task `progress.md` and `review.md`
   - Update `PROJECT_STATE.md` / `CURRENT_STATE.md` when complete
   - Update `CHANGELOG.md`
   - Update `NEXT_CHAT.md` (this file) for the next session

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
4. **Follow the coding standards** — [CODING_STANDARDS.md](./CODING_STANDARDS.md) is the law. Deviations require an ADR.
5. **The architecture is decided** — don't propose alternative frameworks or architectures without reading [DECISIONS.md](./DECISIONS.md) first. If you have a strong reason to deviate, create a new ADR.
6. **Update state files** — always keep [PROJECT_STATE.md](./PROJECT_STATE.md), [state/current_task.json](./state/current_task.json), and this file current.
7. **Check for known issues** — read [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) before starting work that might be affected.
8. **Record lessons** — add to [LESSONS.md](./LESSONS.md) when you discover something important.

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
