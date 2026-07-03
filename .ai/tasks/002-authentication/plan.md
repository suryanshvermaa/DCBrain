# Task 002: Authentication — Implementation Plan

## Execution Order

### Step 1: Backend Auth Models & Service (90 min)
1. Create `users` and `project_members` table migrations via Prisma Migrate.
2. Define Zod schemas: `RegisterRequest`, `LoginRequest`, `TokenResponse`, `UserResponse`.
3. Create `src/modules/auth/security.ts` (bcrypt password hashing, JWT create/verify).
4. Create `src/modules/auth/service.ts` (register, login, refresh, getCurrentUser).
5. Create `src/modules/auth/repository.ts` (user CRUD operations).
6. Define RBAC permission map per [SECURITY.md](../../SECURITY.md).

### Step 2: Backend Auth Endpoints (60 min)
1. Create `src/modules/auth/routes.ts` router with register/login/refresh/me endpoints.
2. Create `src/modules/auth/middleware.ts` (`requireAuth`, `requireRole`).
3. Register router in the Express app factory.
4. Add rate limiting middleware for auth endpoints (5 attempts / 15 min).
5. Add audit logging for login/logout/register events.

### Step 3: Backend Tests (45 min)
1. Create test fixtures for users.
2. Write unit tests for security functions (hash, verify, JWT).
3. Write integration tests for auth endpoints.
4. Verify rate limiting returns 429 after 5 failed attempts.

### Step 4: Frontend Auth (90 min)
1. Create `src/store/authSlice.ts` (Redux Toolkit slice for auth state).
2. Create `src/lib/api/auth.ts` (API client for auth endpoints).
3. Create `src/app/login/page.tsx` with form validation.
4. Create `src/app/register/page.tsx` with form validation.
5. Create `src/components/auth/ProtectedRoute.tsx` wrapper.
6. Configure Next.js App Router route groups for protected pages.
7. Attach access token to API client headers.

## Validation
- Register a new user → receive 201.
- Login → receive access token (memory) and refresh token (HttpOnly cookie).
- Access protected endpoint with token → 200.
- Access protected endpoint without token → 401.
- Access admin endpoint as engineer → 403.
- 6th login attempt within 15 min → 429.
