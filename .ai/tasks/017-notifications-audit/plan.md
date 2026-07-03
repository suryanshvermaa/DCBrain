# Task 017: Notifications, Audit Logs & Activity Timeline — Implementation Plan

## Execution Order

### Step 1: Schema (60 min)
1. Define `audit_log`, `notifications`, and `notification_preferences` Prisma models.
2. Run migrations.

### Step 2: Audit Middleware (90 min)
1. Build Express middleware to capture user actions.
2. Include user_id, action, resource_type, resource_id, details, ip, timestamp.
3. Ensure no secrets or PII beyond email/name are logged.

### Step 3: Notifications API (90 min)
1. Implement notification CRUD and mark-read endpoints.
2. Build WebSocket delivery using Socket.io or native ws.
3. Add notification preferences endpoints.

### Step 4: Activity Timeline (60 min)
1. Build project-scoped activity query from audit log.
2. Add dashboard widget and full timeline page.

### Step 5: UI (90 min)
1. Build notification bell with unread count.
2. Build notification panel and preferences.
3. Build ActivityFeed and ActivityTimeline components.

### Step 6: Tests & Docs (60 min)
1. Unit tests for audit log formatting.
2. Integration tests for notifications and WebSocket.
3. Update SECURITY.md, API.md, DATABASE.md, COMPONENTS.md.

## Validation

- Upload a document and verify an audit log entry and notification are created.
- Confirm admin can access audit log; non-admin cannot.
- Verify WebSocket notifications arrive in real time.
