# Implementation Prompt

Use this prompt when asking an AI model to implement a feature or task.

---

## Prompt Template

```
You are implementing a feature for DCBrain, a neuro-symbolic AI-powered EPC Project Intelligence platform for Data Centre construction.

## Context Files to Read First
Read these files before writing any code:
1. .ai/PROJECT_STATE.md — Current development state
2. .ai/ARCHITECTURE.md — System architecture and directory structure
3. .ai/CODING_STANDARDS.md — Coding standards you must follow
4. .ai/TECH_STACK.md — Technologies being used
5. [task file] — The specific task being implemented

## Task
[Describe the specific task to implement]

## Requirements
[Paste the relevant acceptance criteria from the task file]

## Constraints
- Follow the directory structure in ARCHITECTURE.md
- Follow coding standards in CODING_STANDARDS.md
- Use TypeScript strict mode for frontend and backend code
- Use named exports only (no default exports) in React
- Use Redux Toolkit for client state; prefer RTK Query or Next.js server fetching for server state (avoid raw useEffect + fetch)
- Use Zod schemas for all API request/response validation
- Use the repository pattern for database access
- All API endpoints must check RBAC permissions

## Expected Output
- Complete, working code files
- Tests for critical paths
- Updated progress.md for the task

## After Implementation
Update these files:
- .ai/tasks/[task-folder]/progress.md
- .ai/PROJECT_STATE.md
- .ai/CHANGELOG.md
- .ai/NEXT_CHAT.md
```

---

## Usage Notes

- Replace `[task file]` with the path to the current task's `task.md`
- Replace bracketed sections with specific details
- Include relevant code context if modifying existing files
- For complex tasks, break into sub-prompts and reference `plan.md`
