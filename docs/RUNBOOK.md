# DCBrain — Deployment Runbook

> **Audience:** DevOps engineers, on-call engineers  
> **Environment:** Production (`dcbrain.example.com`) · Staging (`staging.dcbrain.example.com`)

---

## 1. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Docker | ≥ 24.x | Container runtime |
| Docker Compose | ≥ 2.x | Service orchestration |
| `pg_dump` / `psql` | ≥ 16 | Database backup & restore |
| `ssh` | any | Server access |
| `curl` | any | Health verification |

---

## 2. First-Time Server Setup

```bash
# On the production server as root / sudo user
ssh user@your-server

# Create application directory
sudo mkdir -p /opt/dcbrain/{backups,nginx/certs}
cd /opt/dcbrain

# Clone repository
git clone https://github.com/your-org/dcbrain.git .

# Copy and fill in the production environment file
cp .env.prod.example .env.prod
nano .env.prod          # fill in ALL CHANGE_ME values

# Generate a strong JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Place TLS certificates (from Let's Encrypt or your CA)
# Expected paths (referenced in nginx/nginx.conf):
sudo cp /path/to/fullchain.pem /opt/dcbrain/nginx/certs/fullchain.pem
sudo cp /path/to/privkey.pem   /opt/dcbrain/nginx/certs/privkey.pem
sudo chmod 600 /opt/dcbrain/nginx/certs/privkey.pem

# Pull images and start services
docker compose -f docker-compose.prod.yml --env-file .env.prod pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Run database migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Verify health
curl -sf https://dcbrain.example.com/health | python3 -m json.tool
```

---

## 3. Routine Deployment (CI/CD — automatic)

Deployments are triggered automatically via GitHub Actions:

| Trigger | Target |
|---------|--------|
| Push to `develop` | Staging (automatic) |
| Push to `main` | Production (requires manual approval in GitHub Environments) |

**To approve a production deploy:**
1. Open the Actions run on GitHub
2. Navigate to the `Approve Production Deploy` job
3. Click **Review deployments → Approve and deploy**

---

## 4. Manual Deployment

Use this procedure when the CI/CD pipeline is unavailable.

```bash
ssh user@your-production-server
cd /opt/dcbrain

# Log in to container registry
echo "$GHCR_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Set the image tag you want to deploy
export IMAGE_TAG=<git-sha-or-semver-tag>

# Pull new images
docker compose -f docker-compose.prod.yml --env-file .env.prod pull backend frontend

# Rolling restart (zero-downtime: Nginx keeps serving existing containers)
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --no-build backend frontend worker

# Run migrations (safe to run — Prisma is idempotent)
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Verify health
sleep 15
curl -sf http://localhost:8000/health
```

---

## 5. Rollback Procedure

### Option A: Re-deploy a previous image tag (recommended)

```bash
ssh user@your-production-server
cd /opt/dcbrain

# List available image tags
docker images | grep dcbrain

# Set the previous good image tag
export IMAGE_TAG=<previous-sha>

# Pull and redeploy
docker compose -f docker-compose.prod.yml --env-file .env.prod pull backend frontend
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --no-build backend frontend worker

# Verify
sleep 15
curl -sf http://localhost:8000/health
```

### Option B: Tag rollback via GitHub Actions

1. Push an empty commit to `main` referencing the previous commit SHA, **or**
2. Revert the merge commit: `git revert -m 1 <merge-sha>` → push → approve deploy

---

## 6. Database Backup

### Manual backup

```bash
ssh user@your-production-server
cd /opt/dcbrain
bash scripts/backup-db.sh
# Backup stored in: /opt/dcbrain/backups/db-YYYYMMDD-HHMMSS.sql.gz
```

### Automated backup via cron

Add the following to crontab (`crontab -e`) on the production server:

```
# DCBrain database backup — runs daily at 02:00 UTC
0 2 * * * /opt/dcbrain/scripts/backup-db.sh >> /var/log/dcbrain/backup.log 2>&1
```

### Restore from backup

```bash
# Copy backup to server (if not already there)
scp db-20260101-020000.sql.gz user@your-server:/tmp/

ssh user@your-production-server

# Decompress
gunzip /tmp/db-20260101-020000.sql.gz

# Restore (WARNING: this drops and recreates all data)
docker compose -f /opt/dcbrain/docker-compose.prod.yml exec -T postgres \
  psql -U dcbrain -d dcbrain < /tmp/db-20260101-020000.sql

# Restart backend to clear any in-memory state
docker compose -f /opt/dcbrain/docker-compose.prod.yml restart backend worker
```

---

## 7. Health Verification

```bash
# Full health status (all dependencies)
curl -sf https://dcbrain.example.com/health | python3 -m json.tool

# Expected healthy response:
# {
#   "status": "healthy",
#   "version": "0.1.0",
#   "services": {
#     "database": "healthy",
#     "redis": "healthy",
#     "minio": "healthy",
#     "chromadb": "healthy",
#     "neo4j": "healthy"
#   }
# }

# Individual service logs
docker compose -f docker-compose.prod.yml logs --tail=100 backend
docker compose -f docker-compose.prod.yml logs --tail=100 worker
docker compose -f docker-compose.prod.yml logs --tail=100 nginx
```

---

## 8. SSL Certificate Renewal (Let's Encrypt)

```bash
# Using Certbot standalone mode (stop Nginx briefly)
docker compose -f docker-compose.prod.yml stop nginx

certbot renew --standalone

# Copy renewed certs
cp /etc/letsencrypt/live/dcbrain.example.com/fullchain.pem /opt/dcbrain/nginx/certs/
cp /etc/letsencrypt/live/dcbrain.example.com/privkey.pem   /opt/dcbrain/nginx/certs/
chmod 600 /opt/dcbrain/nginx/certs/privkey.pem

docker compose -f docker-compose.prod.yml start nginx
```

Or configure auto-renewal via Certbot's built-in timer/cron.

---

## 9. Known Issues & Gotchas

| Issue | Mitigation |
|-------|------------|
| `fast-xml-parser` and `xml2js` are transitive deps (not in package.json) | If Docker image rebuild fails with missing modules, run `npm install fast-xml-parser xml2js` in backend and commit |
| Worker timer leak in test environment | Non-blocking; does not appear in production (`--forceExit` is set in Jest config) |
| ChromaDB healthcheck uses `service_started` not `service_healthy` | ChromaDB image does not expose a reliable healthcheck endpoint; service may need a few extra seconds on cold start |
| Neo4j APOC plugin download | Requires internet access at first startup; pre-pull with `docker compose pull neo4j` |

---

## 10. GitHub Actions Secrets Required

Set these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `STAGING_HOST` | Staging server IP or hostname |
| `STAGING_USER` | SSH username for staging server |
| `STAGING_SSH_KEY` | Private SSH key for staging server |
| `PROD_HOST` | Production server IP or hostname |
| `PROD_USER` | SSH username for production server |
| `PROD_SSH_KEY` | Private SSH key for production server |

And in **Variables** (not secrets, safe to expose):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Public API URL (e.g. `https://dcbrain.example.com`) |
