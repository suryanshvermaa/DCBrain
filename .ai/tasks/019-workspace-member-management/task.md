# Task 019: Workspace Member Management

## Status: COMPLETED

## Objective
Enable Project Managers and Admins to invite, manage, and assign roles to subusers (Engineers, Viewers, Procurement, QA/QC) within a specific project workspace.

## Requirements
- **User Invitation & Role Mapping:**
  - Project Managers should be able to invite users to a project by their email address.
  - The system must correctly distinguish between the global `Role` (e.g., `ADMIN`, `PROJECT_MANAGER`, `ENGINEER`) and the workspace-specific `ProjectRole` (e.g., `OWNER`, `MANAGER`, `ENGINEER`, `PROCUREMENT`, `QA_QC`, `MEMBER`, `VIEWER`).
  - If the user already exists in the platform, they are immediately added to the `project_members` table with the assigned `ProjectRole`.
  - If the user does not exist, the system creates a new user account with a default global `Role` (like `VIEWER`) and assigns them the specified `ProjectRole` for this workspace. A temporary password or invite flow is triggered.
- **Member Management UI:**
  - Create a "Members" tab in the Project Dashboard or Settings page.
  - Display a table of current workspace members and their `ProjectRole`.
  - Allow Project Managers to change the `ProjectRole` of existing members.
  - Allow Project Managers to remove members from the workspace.
- **RBAC Enforcement:**
  - Ensure the backend API strictly validates that the requesting user has global `ADMIN` privileges OR a `ProjectRole` of `MANAGER` / `OWNER` on the target project before allowing member additions or modifications.

## Implementation Steps

### Backend
- [x] Add `POST /api/v1/projects/:id/members` endpoint to invite a user by email.
- [x] Add `PATCH /api/v1/projects/:id/members/:userId` to update a member's role.
- [x] Add `DELETE /api/v1/projects/:id/members/:userId` to remove a member.
- [x] Enforce project-level RBAC middleware on these new endpoints.

### Frontend
- [x] Create a `ProjectMembersList` component (implemented inline in members/page.tsx).
- [x] Create an `InviteMemberModal` component with a form (Email, Role dropdown).
- [x] Integrate these components into the project dashboard/settings layout (/members page + sidebar nav).
- [x] Handle UI states for successful invitations, errors, and loading.
