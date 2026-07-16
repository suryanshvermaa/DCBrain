# Task 019 Plan: Workspace Member Management

## Objective
Enable Project Managers and Admins to invite, manage, and assign roles to subusers within a specific project workspace.

## Scope

No Prisma migration needed — `ProjectMember` model and `ProjectRole` enum already existed.

## Backend Changes
- **schemas.ts**: Added `inviteMemberSchema`, `updateMemberRoleSchema`, `memberUserIdParamSchema`
- **projects/routes.ts**:
  - Extended GET /:id/members to include `globalRole` and `joinedAt`
  - Added POST /:id/members (invite by email, creates provisional account if new user)
  - Added PATCH /:id/members/:userId (update ProjectRole)
  - Added DELETE /:id/members/:userId (remove member)
  - All write endpoints require `manage_project_members` permission + project-level OWNER/MANAGER check

## Frontend Changes
- **api/projects.ts**: Extended `ProjectMember` interface; added `inviteProjectMember`, `updateProjectMemberRole`, `removeProjectMember` functions
- **app/members/page.tsx** (NEW): Member management UI — project selector, members table, invite modal, inline role selector, remove confirmation
- **components/layout/AppShell.tsx**: Added "Members" nav item linking to /members

## RBAC Rules
- Global ADMIN or PROJECT_MANAGER → always allowed
- Project OWNER or MANAGER → allowed on their projects
- Cannot assign or promote to OWNER role via the API
- Cannot remove or change role of the project OWNER
