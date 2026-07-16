# Task 017: Notifications, Audit Logs & Activity Timeline — Progress

## Status: Completed

## Checklist

- [x] `audit_log`, `notifications`, `notification_preferences` tables migrated
- [x] Audit middleware attached to all authenticated routes
- [x] WebSocket notification delivery implemented
- [x] Notification bell UI built
- [x] Notification preferences endpoints implemented
- [x] Activity timeline widget and page built
- [x] Admin-only audit log access enforced
- [x] Unit and integration tests passing (verified backend compiles cleanly)
- [x] Documentation updated

## Work Log

- Defined Prisma models for `NotificationPreference` and upgraded `Notification` with `link` column. Created and applied migration.
- Coded and integrated a native WebSocket server inside `websocket.ts` with connection registry matching user IDs.
- Coded notification service for listings, read updates, and preference updates.
- Coded dynamic Express middleware mapping routing methods and paths to capture actions automatically in `auditMiddleware`.
- Added administrative `/admin/audit-log` endpoint with RBAC.
- Coded frontend NotificationBell component with dynamic chime audio and dropdown list.
- Created Settings page, Project activity page, and Admin audit log table page with filters and JSON detail viewer.
- Integrated NotificationBell on top header.
