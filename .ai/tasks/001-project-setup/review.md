# Task 001: Project Setup — Review

## Review Status: Completed

## Review Checklist

- [x] All services start with `docker compose up`
- [x] Frontend loads in browser
- [x] Backend health endpoint responds
- [x] API documentation is accessible
- [x] Database migrations run cleanly
- [x] Linting passes (ESLint, ESLint for TypeScript)
- [x] Type checking passes (`tsc --noEmit` backend, `tsc --noEmit` frontend)
- [x] Directory structure matches ARCHITECTURE.md
- [x] Environment variables match ENVIRONMENT.md
- [x] No secrets committed to repository

## Review Notes

### What was delivered

- Fully containerized development environment with 8 services (frontend, backend, worker, PostgreSQL + pgvector, Redis, ChromaDB, MinIO, Neo4j).
- Backend Express app factory with `/health`, `/api`, `/openapi.json`, and `/docs` (Swagger UI).
- Zod-based environment validation.
- Prisma schema and initial migration committed to the repo.
- Next.js dashboard placeholder with Tailwind v4 design tokens and primary color scale.
- Backend and frontend linting, formatting, and test tooling wired up.
- Backend Jest smoke tests and frontend Vitest smoke test.

### Issues found and resolved during implementation

1. **JWT placeholder too short**: The original placeholder `CHANGE_ME_GENERATE_A_SECURE_KEY` was 31 characters, failing the Zod `min(32)` rule. Updated `.env.example` and `.env` to `CHANGE_ME_GENERATE_A_SECURE_KEY_32`.
2. **Docker Compose did not pass JWT variables**: Added `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`, and `JWT_REFRESH_TOKEN_EXPIRE_DAYS` to the `backend` and `worker` service environments.
3. **TypeScript path aliases not resolving with `NodeNext`**: Switched backend `tsconfig.json` to `CommonJS` + `node` module resolution so path aliases are resolved at compile time and runtime.
4. **Prisma `$on` event types**: Prisma's generated `$on` overloads did not infer event names under the strict TypeScript configuration; suppressed with `@ts-expect-error` comments and runtime behavior is correct.
5. **Neo4j driver `.on` listener crashed at runtime**: The listener was not supported by the driver version and caused a `TypeError`; removed it.
6. **ChromaDB JS client heartbeat endpoint mismatch**: The client targeted `/api/v2/heartbeat`, but the server image only exposes `/api/v1/heartbeat`. Replaced `chroma.heartbeat()` with a direct `fetch` to the v1 endpoint in `checkChromaHealth`.
7. **Frontend primary color scale missing**: Tailwind v4 theme only defined `--color-primary`, so `bg-primary-600` etc. produced no color. Added `--color-primary-50` through `--color-primary-950`.
8. **PostgreSQL missing pgvector**: The `DocumentChunk.embedding` column uses `Unsupported("vector")`; switched the `postgres` service image to `pgvector/pgvector:pg16` and enabled the `vector` extension in `prisma/init.sql`.
9. **Prisma migrations were gitignored**: Updated root `.gitignore` so initial migration files can be committed.
10. **Missing ESLint/Prettier plugins**: Installed `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-config-prettier`, and `eslint-plugin-prettier` so backend linting runs.

### Remaining technical debt / warnings

- Backend ESLint uses the legacy `.eslintrc.js` format. Migrating to flat config is a future cleanup item.
- Several npm audit warnings exist in dependencies (notably `multer`, `uuid`, older ESLint). These are inherited from the chosen versions in the hackathon stack and can be addressed in a dedicated dependency-hardening task.
- Frontend Dockerfile uses a multi-stage production build even in local dev. This is slower but ensures the production artifact is exercised early.

### Verification commands

```bash
# Start everything
docker compose up -d

# Backend health
curl http://localhost:8000/health

# Swagger docs
curl -L http://localhost:8000/docs

# Frontend
curl http://localhost:3000

# Migrations
docker compose exec backend npx prisma migrate status

# Tests
docker compose exec backend npm test
cd frontend && npm test
```
