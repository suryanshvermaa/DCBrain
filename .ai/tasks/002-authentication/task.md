# Task 002: Authentication

## Overview
- **ID:** 002
- **Priority:** P0 (Critical)
- **Estimate:** 6 hours
- **Sprint:** 1
- **Dependencies:** 001 (Project Setup)
- **Status:** Completed

## Objective

Implement user registration, login, JWT-based authentication, and role-based access control. After this task, users can create accounts, log in, and the API enforces permissions based on user roles.

## Acceptance Criteria

- [ ] User registration endpoint (`POST /api/v1/auth/register`)
- [ ] User login endpoint returning JWT tokens (`POST /api/v1/auth/login`)
- [ ] Token refresh endpoint (`POST /api/v1/auth/refresh`)
- [ ] Current user profile endpoint (`GET /api/v1/auth/me`)
- [ ] Password hashing with bcrypt (12 rounds)
- [ ] JWT access token (24h expiry) and refresh token (7d expiry)
- [ ] Role-based middleware checking permissions per endpoint
- [ ] Rate limiting on auth endpoints (5 attempts / 15 min)
- [ ] Frontend login page with form validation
- [ ] Frontend registration page
- [ ] Auth state management (Redux slice + token in memory)
- [ ] Protected route wrapper for authenticated pages
- [ ] Database migration for `users` table
- [ ] Unit tests for auth service
- [ ] Integration tests for auth endpoints

## Reference Documents
- [SECURITY.md](../../SECURITY.md) — JWT strategy, RBAC matrix, password requirements
- [API.md](../../API.md) — Auth endpoint specifications
- [DATABASE.md](../../DATABASE.md) — Users table schema
- [CODING_STANDARDS.md](../../CODING_STANDARDS.md) — Backend patterns
