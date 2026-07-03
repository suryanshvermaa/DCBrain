# Task 010: Deployment — Implementation Plan

## Execution Order

### Step 1: CI Pipeline (60 min)
1. Create `.github/workflows/ci.yml`
2. Configure backend checks: ESLint/Prettier lint, tsc --noEmit, Jest with coverage
3. Configure frontend checks: ESLint, tsc, Vitest with coverage
4. Add caching for pip and npm dependencies
5. Set up test database service containers

### Step 2: Production Dockerfiles (60 min)
1. Create multi-stage `Dockerfile.frontend` (build → nginx:alpine serve)
2. Create multi-stage `Dockerfile.backend` (build → node:20-slim run)
3. Optimize layer caching (dependencies before code)
4. Set non-root user in containers
5. Create `docker-compose.prod.yml`

### Step 3: Nginx Configuration (45 min)
1. Create production `nginx.conf`
2. Configure SSL/TLS with certificate paths
3. Add security headers (CSP, HSTS, X-Frame-Options)
4. Configure rate limiting
5. Set up API proxy and frontend static serving

### Step 4: Monitoring & Logging (45 min)
1. Configure structured JSON logging (pino)
2. Enhance `/health` endpoint with dependency checks
3. Add request ID middleware for tracing
4. Set up log rotation

### Step 5: Backup & Rollback (30 min)
1. Create database backup script (pg_dump)
2. Configure backup schedule and retention
3. Document rollback procedure
4. Test backup restoration

### Step 6: CD Pipeline (60 min)
1. Create `.github/workflows/deploy.yml`
2. Build and tag Docker images
3. Push to container registry
4. Deploy to staging on develop branch
5. Deploy to production on main branch (with manual approval)

## Validation
- Push to feature branch → CI runs lint + tests
- Merge to develop → deploy to staging automatically
- Merge to main → deploy to production with manual approval
- Health endpoint returns all services healthy
- Nginx serves frontend and proxies API correctly
- Database backup runs and can be restored
