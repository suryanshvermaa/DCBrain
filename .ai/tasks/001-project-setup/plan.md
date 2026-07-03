# Task 001: Project Setup — Implementation Plan

## Execution Order

### Step 1: Create Backend Structure (60 min)

1. Create `backend/` directory with the module-based structure from [ARCHITECTURE.md](../../ARCHITECTURE.md).
2. Initialize `package.json` with pinned versions per [TECH_STACK.md](../../TECH_STACK.md):
   ```json
   {
     "express": "^4.19.0",
     "@prisma/client": "^5.16.0",
     "prisma": "^5.16.0",
     "zod": "^3.23.0",
     "bullmq": "^5.8.0",
     "ioredis": "^5.4.0",
     "chromadb": "^1.8.0",
     "@langchain/core": "^0.2.0",
     "@langchain/langgraph": "^0.0.0",
     "@langchain/google-genai": "^0.0.0",
     "pdf-parse": "^1.1.1",
     "docx": "^8.5.0",
     "xlsx": "^0.18.5",
     "tesseract.js": "^5.1.0",
     "neo4j-driver": "^5.22.0",
     "minio": "^8.0.0",
     "jsonwebtoken": "^9.0.2",
     "bcrypt": "^5.1.1",
     "multer": "^1.4.5-lts.1",
     "winston": "^3.13.0",
     "cors": "^2.8.5",
     "helmet": "^7.1.0"
   }
   ```
3. Install dev dependencies: `typescript`, `@types/node`, `@types/express`, `@types/jsonwebtoken`, `@types/bcrypt`, `@types/multer`, `@types/cors`, `tsx`, `ts-node`, `jest`, `supertest`, `@types/jest`, `ts-jest`, `eslint`, `prettier`.
4. Create `src/app.ts` with Express app factory, CORS, Helmet, JSON parser, and `/health` endpoint.
5. Create `src/core/config.ts` with Zod-based environment validation.
6. Create `src/lib/prisma.ts` with a singleton Prisma client.
7. Run `npx prisma init` and create an initial schema with `users` and `projects` tables.
8. Configure ESLint and Prettier.

### Step 2: Create Frontend Structure (45 min)

1. Initialize with: `npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir`.
2. Install dependencies per [TECH_STACK.md](../../TECH_STACK.md):
   ```bash
   npm install @reduxjs/toolkit react-redux recharts lucide-react react-markdown
   npm install -D @types/react @types/react-dom
   ```
3. Set up directory structure per [ARCHITECTURE.md](../../ARCHITECTURE.md).
4. Create `src/app/globals.css` with design tokens from [UI_GUIDELINES.md](../../UI_GUIDELINES.md).
5. Create placeholder `src/app/page.tsx`.
6. Configure `tsconfig.json` with strict mode and path aliases (`@/*`).

### Step 3: Docker Compose (45 min)

1. Create `Dockerfile.frontend` (Node 20 Alpine, dev mode with volume mount).
2. Create `Dockerfile.backend` (Node 20 slim, `tsx` for hot reload).
3. Create `docker-compose.yml` with services: frontend, backend, worker, postgres, redis, chromadb, minio, neo4j.
4. Create `nginx.conf` for production routing (not needed for dev).
5. Create `.env.example` from [ENVIRONMENT.md](../../ENVIRONMENT.md).
6. Add health checks for postgres, redis, chromadb, minio, and neo4j.

### Step 4: Project Root Files (30 min)

1. Create comprehensive `.gitignore`.
2. Create/update root `README.md` with quick-start guide.
3. Run `docker compose up -d` and verify all services start.
4. Run `docker compose exec backend npx prisma migrate dev` successfully.
5. Test `http://localhost:3000` loads the placeholder page.
6. Test `http://localhost:8000/health` returns `{"status":"healthy"}`.

## Validation

After completion, verify:
- `docker compose up -d` starts all 8 services without errors.
- `http://localhost:3000` shows the Next.js placeholder page.
- `http://localhost:8000/health` returns `{"status":"healthy"}`.
- `http://localhost:8000/docs` shows Swagger / OpenAPI docs.
- `docker compose exec backend npx prisma migrate dev` runs without errors.
- No secrets are committed to the repository.
