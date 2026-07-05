# Security Requirements

## Security Principles

1. **Defense in Depth** — Multiple security layers. No single point of failure.
2. **Least Privilege** — Users and services get minimum required permissions.
3. **Zero Trust** — Verify every request. Never trust implicit context.
4. **Secure by Default** — Secure configurations out of the box. Insecurity requires explicit opt-in.
5. **Data Sovereignty** — All project data stays within the organization's cloud tenant.

---

## Authentication

### JWT Token Strategy

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| Access Token | 24 hours | Memory (React state) | API authentication |
| Refresh Token | 7 days | HttpOnly cookie | Silent token renewal |

**Access Token Payload:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "engineer",
  "projects": ["project-uuid-1", "project-uuid-2"],
  "iat": 1719748800,
  "exp": 1719835200,
  "jti": "unique-token-id"
}
```

**Token Security:**
- Algorithm: HS256 with 256-bit secret (RS256 for production with key rotation)
- Access tokens stored in memory only — not localStorage, not sessionStorage
- Refresh tokens in HttpOnly, Secure, SameSite=Strict cookies
- Refresh token rotation: each refresh invalidates the previous token via a blacklist keyed by `jti`
- Refresh-token blacklist in Redis with in-memory fallback for tests/dev

### Password Security

- **Hashing:** bcrypt with 12 work factor rounds
- **Password Requirements:** Minimum 8 characters, at least one uppercase, one lowercase, one digit, one special character
- **Rate Limiting:** 5 failed login attempts per 15 minutes per IP, then 30-minute lockout
- **No password hints or security questions**

---

## Authorization (RBAC)

### Role Permissions Matrix

| Permission | Admin | Project Manager | Engineer | Viewer |
|-----------|-------|----------------|----------|--------|
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Create projects | ✅ | ✅ | ❌ | ❌ |
| Manage project members | ✅ | ✅ | ❌ | ❌ |
| Upload documents | ✅ | ✅ | ✅ | ❌ |
| Delete documents | ✅ | ✅ | Own only | ❌ |
| Search documents | ✅ | ✅ | ✅ | ✅ |
| Use chat | ✅ | ✅ | ✅ | ✅ |
| Run compliance checks | ✅ | ✅ | ✅ | ❌ |
| Import schedule data | ✅ | ✅ | ✅ | ❌ |
| Import procurement data | ✅ | ✅ | ✅ | ❌ |
| Configure agents | ✅ | ✅ | ❌ | ❌ |
| View dashboard | ✅ | ✅ | ✅ | ✅ |
| Export data | ✅ | ✅ | ✅ | ❌ |

### Project-Level Isolation

- Users can only access projects they are members of
- All API queries are scoped by `project_id` and verified against `project_members`
- Cross-project data access is impossible at the database query level
- Admin role bypasses project-level checks but is logged to audit trail

---

## Data Protection

### Encryption at Rest
- PostgreSQL: Transparent Data Encryption (TDE) if available, or filesystem-level encryption (LUKS)
- File storage: AES-256 encryption for uploaded documents
- Redis: Encrypted Redis (production) or ACL-protected (development)
- Backups: Encrypted with a separate key

### Encryption in Transit
- All HTTP traffic over TLS 1.3 (minimum TLS 1.2)
- Nginx terminates TLS with valid certificate
- Internal service communication: TLS between containers in production
- Gemini API calls: HTTPS with certificate verification

### Sensitive Data Handling
- **PII:** User emails and names are PII. Access controlled by role.
- **Passwords:** Only bcrypt hashes stored. Original passwords never logged or stored.
- **API keys:** Stored as environment variables, never in code or database.
- **Document content:** Treated as confidential. Access controlled by project membership.

---

## Input Validation & Sanitization

### API Input Validation
- All request bodies validated by Zod schemas with explicit type constraints
- File uploads validated by:
  - File extension whitelist: `.pdf`, `.docx`, `.xlsx`, `.csv`, `.xml`, `.json`
  - Magic byte verification (content-type sniffing)
  - Maximum file size: 100MB
  - Filename sanitization (strip path traversal characters)
- Query parameters validated with type coercion and range limits
- Path parameters (UUIDs) validated with regex pattern

### SQL Injection Prevention
- All database queries via Prisma ORM (parameterized by default)
- No raw SQL with string formatting
- Stored procedures not used (to keep all logic in application layer)

### XSS Prevention
- React escapes output by default
- `dangerouslySetInnerHTML` is never used
- Markdown rendering uses `react-markdown` with sanitized HTML (no raw HTML pass-through)
- Content Security Policy (CSP) headers configured in Nginx

### CSRF Protection
- SameSite=Strict cookies prevent CSRF for refresh token
- API uses Bearer token authentication (not cookie-based sessions), inherently CSRF-safe
- All state-changing operations require POST/PUT/DELETE (never GET)

---

## API Security

### Rate Limiting

Implemented via Redis-backed counters and lockouts in Express.js middleware:

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Authentication | 5 attempts | 15 minutes |
| Document Upload | 20 uploads | 1 hour |
| Search/Chat | 60 requests | 1 minute |
| General API | 120 requests | 1 minute |

- Successful auth requests clear the per-IP counter; repeated failures trigger a 30-minute lockout.

### CORS Configuration

```typescript
const allowedOrigins = [
  "http://localhost:3000",        // Development frontend
  "https://dcbrain.example.com",  // Production frontend
];

// Configured in Express CORS middleware:
// - origin: allowedOrigins
// - credentials: true (for HTTP-only refresh tokens)
// - methods: ["GET", "POST", "PUT", "DELETE"]
// - allowedHeaders: ["Content-Type", "Authorization"]
```

### HTTP Security Headers (Nginx)

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://generativelanguage.googleapis.com;" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## Audit Logging

All significant actions are logged to the `audit_log` table:

**Logged Events:**
- User login/logout/registration
- Document upload, delete, download
- Search queries
- Compliance check execution
- Schedule/procurement data imports
- Agent runs
- Role and permission changes
- Failed authentication attempts

**Log Format:**
```json
{
  "user_id": "uuid",
  "action": "document.upload",
  "resource_type": "document",
  "resource_id": "uuid",
  "details": {
    "file_name": "spec.pdf",
    "file_size": 2048000,
    "category": "specification"
  },
  "ip_address": "192.168.1.100",
  "timestamp": "2026-06-30T14:00:00Z"
}
```

---

## Dependency Security

- **Dependabot / Renovate** for automated dependency vulnerability scanning
- **No dependencies with known critical CVEs** in production
- **Lock files** (`package-lock.json`, `package.json`) committed and used for deterministic installs
- **Docker images** pinned to specific SHA digests in production

---

## Secret Management

| Secret | Storage Location | Rotation Frequency |
|--------|-----------------|-------------------|
| JWT_SECRET_KEY | Environment variable | 90 days |
| DATABASE_URL | Environment variable | On compromise |
| GEMINI_API_KEY | Environment variable | 90 days |
| REDIS_URL | Environment variable | On compromise |
| MINIO_SECRET_KEY | Environment variable | 90 days |
| GRAPH_DB_PASSWORD | Environment variable | On compromise |

- Development: `.env` file (git-ignored)
- Production: Cloud secret manager (AWS Secrets Manager / Azure Key Vault)
- See [ENVIRONMENT.md](./ENVIRONMENT.md) for variable reference

## Related Documents

- [ENVIRONMENT.md](./ENVIRONMENT.md) — Environment variable configuration
- [CODING_STANDARDS.md](./CODING_STANDARDS.md) — Security-related coding standards
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Production security configuration
- [API.md](./API.md) — API endpoint security details
