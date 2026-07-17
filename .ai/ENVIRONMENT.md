# Environment Variables

All configuration is managed through environment variables. No secrets are committed to the repository.

## Development Setup

1. Copy `.env.example` to `.env` in the project root
2. Fill in required values (marked with `REQUIRED`)
3. Docker Compose reads `.env` automatically
4. For non-Docker development, export variables or use `dotenv`

---

## Variable Reference

### Application

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `APP_NAME` | `DCBrain` | No | Application display name |
| `APP_ENV` | `development` | No | Environment: `development`, `test`, `staging`, `production` |
| `APP_DEBUG` | `true` | No | Enable debug mode (disable in production) |
| `APP_VERSION` | `0.1.0` | No | Application version string |
| `APP_HOST` | `0.0.0.0` | No | API server host |
| `APP_PORT` | `8000` | No | API server port |
| `FRONTEND_URL` | `http://localhost:3000` | No | Frontend URL for CORS |

### Authentication

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `JWT_SECRET_KEY` | — | **REQUIRED** | Secret key for JWT signing (min 32 chars) |
| `JWT_ALGORITHM` | `HS256` | No | JWT signing algorithm |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | No | Access token lifetime (default: 24 hours) |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | `7` | No | Refresh token lifetime |

### Database

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `DATABASE_URL` | `postgresql://dcbrain:dcbrain_dev_password@localhost:5432/dcbrain` | **REQUIRED** | PostgreSQL connection string |
| `DATABASE_POOL_SIZE` | `20` | No | Connection pool size |
| `DATABASE_MAX_OVERFLOW` | `10` | No | Max connections beyond pool size |
| `DATABASE_ECHO` | `false` | No | Log SQL queries (development only) |

### Redis

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `REDIS_URL` | `redis://localhost:6379/0` | **REQUIRED** | Redis connection string |
| `REDIS_CACHE_TTL` | `3600` | No | Default cache TTL in seconds |

### ChromaDB

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `CHROMA_HOST` | `localhost` | No | ChromaDB server host |
| `CHROMA_PORT` | `8100` | No | ChromaDB server port |
| `CHROMA_COLLECTION_PREFIX` | `project_` | No | Collection name prefix |

### Gemini & Embeddings

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `GEMINI_API_KEY` | — | **REQUIRED** | Google Gemini API key |
| `GEMINI_MODEL` | `gemini-2.5-flash` | No | LLM model for reasoning, chat, and structured output |
| `OPENAI_API_KEY` | — | **REQUIRED** | OpenAI API key used for document/chunk and query embeddings |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | No | OpenAI vector embedding model name (1536 dimensions) |
| `GEMINI_MAX_TOKENS` | `2000` | No | Max tokens per LLM response |
| `GEMINI_TEMPERATURE` | `0.1` | No | LLM temperature (low for factual answers) |

### Document Processing

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `UPLOAD_DIR` | `./uploads` | No | Directory for uploaded documents |
| `MAX_UPLOAD_SIZE_MB` | `100` | No | Maximum file upload size in MB |
| `CHUNK_SIZE` | `512` | No | Token count per text chunk |
| `CHUNK_OVERLAP` | `50` | No | Token overlap between chunks |
| `EMBEDDING_BATCH_SIZE` | `100` | No | Documents per embedding API call |

### BullMQ

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `BullMQ_BROKER_URL` | `redis://localhost:6379/1` | No | BullMQ message broker URL |
| `BullMQ_RESULT_BACKEND` | `redis://localhost:6379/2` | No | BullMQ result backend URL |
| `BullMQ_WORKER_CONCURRENCY` | `2` | No | Number of concurrent worker processes |

### Frontend (Next.js)

These variables are prefixed with `NEXT_PUBLIC_` and embedded at build time.

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | **REQUIRED** | Backend API base URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8000` | No | WebSocket URL |
| `NEXT_PUBLIC_APP_NAME` | `DCBrain` | No | Application name displayed in UI |

### Logging

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `LOG_LEVEL` | `INFO` | No | Logging level: DEBUG, INFO, WARNING, ERROR |
| `LOG_FORMAT` | `json` | No | Log format: `json` (production) or `console` (development) |

---

## .env.example

```env
# =============================================================================
# DCBrain Environment Variables
# Copy this file to .env and fill in required values
# =============================================================================

# --- Application ---
APP_NAME=DCBrain
APP_ENV=development
APP_DEBUG=true
APP_VERSION=0.1.0
APP_HOST=0.0.0.0
APP_PORT=8000
FRONTEND_URL=http://localhost:3000

# --- Authentication ---
# REQUIRED: Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET_KEY=CHANGE_ME_GENERATE_A_SECURE_KEY
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# --- Database ---
# REQUIRED: PostgreSQL connection string
DATABASE_URL=postgresql://dcbrain:dcbrain_dev_password@localhost:5432/dcbrain
DATABASE_POOL_SIZE=20
DATABASE_ECHO=false

# --- Redis ---
# REQUIRED: Redis connection string
REDIS_URL=redis://localhost:6379/0

# --- Object Storage (MinIO) ---
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# --- Graph Database ---
GRAPH_DB_URL=bolt://localhost:7687
GRAPH_DB_USER=neo4j
GRAPH_DB_PASSWORD=password

# --- ChromaDB ---
CHROMA_HOST=localhost
CHROMA_PORT=8100

# --- Gemini & Embeddings ---
# REQUIRED: Get from Google AI Studio
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash
# REQUIRED: OpenAI API key used for document/chunk and query embeddings
OPENAI_API_KEY=your-openai-api-key-here
EMBEDDING_MODEL=text-embedding-3-small
GEMINI_MAX_TOKENS=2000
GEMINI_TEMPERATURE=0.1

# --- Document Processing ---
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=100
CHUNK_SIZE=512
CHUNK_OVERLAP=50
EMBEDDING_BATCH_SIZE=100

# --- BullMQ ---
BullMQ_BROKER_URL=redis://localhost:6379/1
BullMQ_RESULT_BACKEND=redis://localhost:6379/2
BullMQ_WORKER_CONCURRENCY=2

# --- Frontend (Next.js) ---
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_APP_NAME=DCBrain

# --- Logging ---
LOG_LEVEL=INFO
LOG_FORMAT=console
```

---

## Environment-Specific Overrides

### Production Differences

| Variable | Production Value | Reason |
|----------|-----------------|--------|
| `APP_ENV` | `production` | Enables production optimizations |
| `APP_DEBUG` | `false` | Disables debug endpoints and verbose errors |
| `JWT_ALGORITHM` | `RS256` | Asymmetric keys for better security |
| `DATABASE_URL` | Managed RDS/Azure connection string | Managed database with replicas |
| `DATABASE_ECHO` | `false` | No SQL logging in production |
| `LOG_FORMAT` | `json` | Structured logs for log aggregation |
| `LOG_LEVEL` | `WARNING` | Reduce log volume in production |
| `GEMINI_TEMPERATURE` | `0.05` | More deterministic in production |

### Test Environment

- `APP_ENV=test` is valid and used by `backend/.env.test` for Jest runs.
- `DATABASE_URL` and `REDIS_URL` should point at the local Docker services when running tests on the host.
- `APP_ENV=development` disables authentication rate limiting; this keeps the login/register UI usable during local development.

## Related Documents

- [SECURITY.md](./SECURITY.md) — Secret management practices
- [DEPLOYMENT.md](./DEPLOYMENT.md) — How environments are deployed
- [TECH_STACK.md](./TECH_STACK.md) — Technologies being configured
