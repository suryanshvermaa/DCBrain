# Task 017: Notifications, Audit Logs & Activity Timeline

## Overview
- **ID:** 017
- **Priority:** P1 (High)
- **Estimate:** 6 hours
- **Sprint:** 3
- **Dependencies:** 002 (Authentication), 009 (Dashboard)
- **Status:** Completed

## Objective

Build the cross-cutting platform services: real-time in-app notifications, comprehensive audit logging, and the activity timeline. These services support all other modules and are required for security, compliance, and user awareness.

## Acceptance Criteria

- [x] `audit_log` table capturing user actions: login/logout, document upload/delete, search queries, compliance checks, imports, agent runs, role changes
- [x] Audit log middleware auto-records API actions with user_id, action, resource_type, resource_id, details, ip_address, timestamp
- [x] `notifications` table with type, title, message, read status, link, created_at
- [x] WebSocket-based real-time notification delivery
- [x] Notification bell UI with unread count
- [x] Per-user notification preferences (in-app, email digest)
- [x] Activity timeline widget on dashboard showing last 20 actions
- [x] Activity timeline detail page with filtering
- [x] Rate-limiting and RBAC enforcement on audit log access (admin only)
- [x] Database migrations for `audit_log` and `notifications`
- [x] Frontend components: NotificationBell, NotificationPanel, ActivityFeed, ActivityTimeline
- [x] Integration tests for audit middleware and notification endpoints

## Required APIs

- `GET /api/v1/notifications`
- `PUT /api/v1/notifications/{id}/read`
- `PUT /api/v1/notifications/read-all`
- `GET /api/v1/notifications/preferences`
- `PUT /api/v1/notifications/preferences`
- `GET /api/v1/projects/{id}/activity` (project-scoped)
- `GET /api/v1/admin/audit-log` (admin only)

## Required Database Changes

- Create `audit_log` table
- Create `notifications` table
- Create `notification_preferences` table

## Required Tests

- Unit tests for audit log formatting
- Integration tests for notification CRUD
- API tests for admin-only audit log access
- E2E tests for notification bell and activity feed

## Required Documentation

- Update [SECURITY.md](../../SECURITY.md) audit logging section if needed
- Update [API.md](../../API.md) with notification and audit endpoints
- Update [DATABASE.md](../../DATABASE.md) with audit and notification schema
- Update [COMPONENTS.md](../../COMPONENTS.md) with notification/activity components

## Required Mermaid Diagram Updates

- Add Notifications / Audit flow to [ARCHITECTURE.md](../../ARCHITECTURE.md)

## Technical Details

- Audit middleware attached to all authenticated routes
- WebSocket notifications via Socket.io or native ws library
- Agent-generated notifications created by Task 014 Agent Framework
- Activity timeline reads from `audit_log` with project filtering
- Email digest is P2/future; in-app only for hackathon scope

## Reference Documents

- [SECURITY.md](../../SECURITY.md) — Audit logging requirements
- [REQUIREMENTS.md](../../REQUIREMENTS.md) — NFR-003 Security, FR-001 Auth
- [DATABASE.md](../../DATABASE.md) — Audit and notification schema
- [COMPONENTS.md](../../COMPONENTS.md) — UI components
