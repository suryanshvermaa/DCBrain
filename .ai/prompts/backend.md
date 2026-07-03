# Backend Prompt

---

## Prompt Template

```
You are building a backend feature for DCBrain using Express.js and Node.js 20+.

## Required Reading
1. .ai/ARCHITECTURE.md — System architecture, directory structure
2. .ai/CODING_STANDARDS.md — Backend coding standards
3. .ai/DATABASE.md — Database schema
4. .ai/API.md — REST API specification
5. .ai/SECURITY.md — Security requirements

## Feature to Build
[Describe the backend feature]

## Architecture Pattern
Follow this layered module pattern inside `backend/src/modules/`:
1. **Router** (`{domain}.routes.ts`) - Thin routes definition and middleware registration
2. **Controller** (`{domain}.controller.ts`) - Extract HTTP parameters, invoke service, format response
3. **Service** (`{domain}.service.ts`) - Execute business logic, orchestrate other domains/AI
4. **Repository** (`{domain}.repository.ts`) - Prisma client database access
5. **Schema / Validator** (`{domain}.validator.ts`) - Zod request/response validation schemas

## Coding Rules
- TypeScript type annotations on all parameters and return types
- JSDoc on all public methods and service functions
- Custom error classes extending DCBrainError
- Async functions for all I/O operations
- Modular imports with absolute paths configured
- Never use raw SQL with string formatting
- Validate all input with Zod schemas
- Return consistent response envelope: { success: boolean, data: any, message?: string }

## Security Rules
- Every endpoint must check authentication (`authenticate` middleware)
- Every endpoint must check RBAC permissions (`authorize` middleware)
- Log all mutations to audit_log
- Never log passwords, tokens, or document content
- Validate file uploads by content type (magic bytes)

## Output
- All required files (router, service, repository, model, schema)
- Unit tests for service layer
- Integration tests for API endpoints
```
