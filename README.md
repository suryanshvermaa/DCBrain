# DCBrain: AI Platform for Data Centre EPC

DCBrain is an AI-powered platform that unifies EPC (Engineering, Procurement, Construction) project data for data centre projects. It combines RAG document search, Knowledge Graph, automated compliance checking, schedule risk prediction, and an ensemble of autonomous AI agents.

## 🚀 Quick Start

### Prerequisites

- Docker 24.x + Docker Compose 2.x
- Node.js 20.x (for local development without Docker)
- Google Gemini API key (for AI features)

### 1. Clone and Configure

```bash
git clone https://github.com/your-org/dcbrain.git
cd dcbrain

# Copy environment template
cp .env.example .env

# Edit .env and add your GEMINI_API_KEY
# Generate JWT_SECRET_KEY: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Start All Services

```bash
docker compose up -d
```

This starts 8 services:
| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js React application |
| Backend API | 8000 | Express.js REST API |
| Worker | - | BullMQ background workers |
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Cache & message broker |
| ChromaDB | 8100 | Vector database |
| MinIO | 9000/9001 | Object storage (S3-compatible) |
| Neo4j | 7474/7687 | Graph database |

### 3. Verify Installation

```bash
# Check all services are running
docker compose ps

# Test frontend
curl http://localhost:3000

# Test backend health
curl http://localhost:8000/health

# Test API docs
open http://localhost:8000/docs
```

### 4. Run Database Migrations

```bash
docker compose exec backend npx prisma migrate dev --name init
```

## 📁 Project Structure

```
dcbrain/
├── .ai/                    # Project memory & documentation
│   ├── ARCHITECTURE.md
│   ├── TECH_STACK.md
│   ├── ENVIRONMENT.md
│   └── tasks/             # Task tracking
├── backend/               # Express.js API
│   ├── src/
│   │   ├── app.ts        # Express app factory
│   │   ├── server.ts     # Entry point
│   │   ├── core/         # Config, errors, middleware
│   │   ├── lib/          # Database clients
│   │   ├── modules/      # Feature modules
│   │   └── routes/       # API routes
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── Dockerfile
├── frontend/             # Next.js App
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   ├── features/     # Feature modules
│   │   ├── lib/          # Utilities, store, API
│   │   └── hooks/        # Custom hooks
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🛠️ Development

### Backend Development

```bash
cd backend
npm install
npm run dev          # Start with hot reload (tsx)
npm run build        # TypeScript compile
npm run lint         # ESLint
npm run format       # Prettier
npm run test         # Jest tests
npm run prisma:studio # Prisma Studio
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev          # Start dev server on :3000
npm run build        # Production build
npm run lint         # ESLint
npm run format       # Prettier
npm run test         # Vitest
npm run type-check   # TypeScript check
```

### Running Tests

```bash
# Backend tests
docker compose exec backend npm test

# Frontend tests
docker compose exec frontend npm test

# All tests
docker compose exec backend npm test && docker compose exec frontend npm test
```

## 🔧 Configuration

All configuration is via environment variables. See `.env.example` for all options.

### Required Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET_KEY` | 32+ char secret for JWT signing |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GRAPH_DB_URL` | Neo4j bolt URL |
| `NEXT_PUBLIC_API_URL` | Backend API URL for frontend |

### Generate Secure Keys

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# MinIO credentials (use strong passwords in production)
```

## 🏗️ Architecture

DCBrain uses a **neuro-symbolic modular monolith**:

- **AI Layer**: Gemini 2.5 Flash for reasoning, BAAI/bge-m3 for embeddings
- **Symbolic Layer**: Neo4j for failure propagation graphs, mathematical schedule simulation
- **Data Layer**: PostgreSQL (relational), ChromaDB (vectors), MinIO (objects), Redis (cache/queue)
- **Frontend**: Next.js 14 App Router, Redux Toolkit, TailwindCSS, shadcn/ui

See [.ai/ARCHITECTURE.md](.ai/ARCHITECTURE.md) for details.

## 🧪 Core Features

1. **RAG Document Search** - Semantic + keyword search with citations
2. **Knowledge Graph** - Cross-document entity linking, failure propagation
3. **Compliance Validation** - Automated ASHRAE, NFPA, IEC checking
4. **Schedule Intelligence** - Risk prediction, delay simulation, what-if scenarios
5. **Procurement Visibility** - BOQ, RFI, NCR, Change Orders, Inspection tracking
6. **14 Autonomous AI Agents** - Supervisor, Document, Compliance, Schedule, etc.

## 📚 API Documentation

- Swagger UI: `http://localhost:8000/docs` (when implemented)
- OpenAPI spec: `http://localhost:8000/openapi.json`

## 🔒 Security

- JWT authentication with refresh tokens
- RBAC (Role-Based Access Control)
- Helmet.js security headers
- CORS configured for frontend origin
- Input validation via Zod schemas
- No secrets in repository

## 🚢 Deployment

### Production Build

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Environment-Specific Configs

| Environment | Branch | Domain |
|-------------|--------|--------|
| Development | feature/* | localhost |
| Staging | develop | staging.dcbrain.example.com |
| Production | main | dcbrain.example.com |

See [DEPLOYMENT.md](.ai/DEPLOYMENT.md) for details.

## 🤝 Contributing

1. Read [CONTRIBUTING.md](.github/CONTRIBUTING.md) (when created)
2. Follow [CODING_STANDARDS.md](.ai/CODING_STANDARDS.md)
3. Create feature branch from `develop`
4. Write tests for new features
5. Ensure all checks pass: `npm run lint && npm run type-check && npm test`
6. Submit PR with description

## 📝 License

Proprietary - ET AI Hackathon 2026 - Team Nebula

## 🆘 Troubleshooting

### Services won't start

```bash
# Check logs
docker compose logs -f postgres
docker compose logs -f backend

# Reset everything
docker compose down -v
docker compose up -d --build
```

### Database connection issues

```bash
# Check postgres is healthy
docker compose exec postgres pg_isready -U dcbrain

# Run migrations manually
docker compose exec backend npx prisma migrate dev
```

### Port conflicts

```bash
# Check what's using ports
lsof -i :3000 -i :8000 -i :5432 -i :6379

# Stop conflicting services
```

## 📞 Support

- Check [KNOWN_ISSUES.md](.ai/KNOWN_ISSUES.md)
- Review [LESSONS.md](.ai/LESSONS.md)
- Create issue in GitHub

---

**Built for ET AI Hackathon 2026** 🧠🏗️