# AI Intelligence Platform — Project Memory System

## Purpose

This `.ai` folder is the **single source of truth** for the entire project. It replaces chat history, tribal knowledge, and undocumented decisions. Every AI model, every developer, and every future contributor should read this folder before writing any code.

## Why This Exists

This project is developed using **Vibe Coding** — multiple AI models (GPT, Claude, Gemini, Qwen, Cursor, Copilot, and others) collaborate across sessions. Chat history is **never reliable** between sessions. Therefore:

- Every architectural decision is documented in [DECISIONS.md](./DECISIONS.md)
- Every feature requirement is specified in [FEATURES.md](./FEATURES.md)
- The current state of development is tracked in [PROJECT_STATE.md](./PROJECT_STATE.md)
- The next steps for any AI are defined in [NEXT_CHAT.md](./NEXT_CHAT.md)

## How to Use This Memory System

### If You Are an AI Model Starting a New Session

1. **Read [NEXT_CHAT.md](./NEXT_CHAT.md) first** — it tells you exactly what to read and what to do
2. **Read [PROJECT_STATE.md](./PROJECT_STATE.md)** — it tells you where development stands right now
3. **Read [state/current_task.json](./state/current_task.json)** — it tells you the active task
4. **Read the active task folder** in `tasks/` — it contains the plan, progress, and review notes
5. **Read [ARCHITECTURE.md](./ARCHITECTURE.md)** — understand the system before changing it
6. **Read [CODING_STANDARDS.md](./CODING_STANDARDS.md)** — follow the conventions (alias: [CODING_RULES.md](./CODING_RULES.md))

### If You Are a Developer

1. Start with [PROJECT.md](./PROJECT.md) for project overview
2. Read [VISION.md](./VISION.md) to understand the product direction
3. Check [ROADMAP.md](./ROADMAP.md) for milestones and timeline
4. Review [TECH_STACK.md](./TECH_STACK.md) for technology choices

### If You Are Reviewing Code

1. Read [CODING_STANDARDS.md](./CODING_STANDARDS.md) for standards (alias: [CODING_RULES.md](./CODING_RULES.md))
2. Check [SECURITY.md](./SECURITY.md) for security requirements
3. Review [TESTING.md](./TESTING.md) for test expectations
4. Use [templates/pr.md](./templates/pr.md) for PR format

## Folder Structure

```
.ai/
├── README.md                    # This file — start here
├── PROJECT.md                   # Project overview and context
├── VISION.md                    # Product vision and goals
├── REQUIREMENTS.md              # Functional and non-functional requirements
├── TECH_STACK.md                # Technology choices with rationale
├── ARCHITECTURE.md              # Complete system architecture
├── DATABASE.md                  # Database schema and design
├── API.md                       # REST API endpoint definitions
├── FEATURES.md                  # Feature list with priority classification
├── UI_GUIDELINES.md             # UI/UX design system and guidelines (alias: UI_UX.md)
├── COMPONENTS.md                # Frontend component hierarchy
├── CODING_STANDARDS.md          # Coding standards and conventions (alias: CODING_RULES.md)
├── SECURITY.md                  # Security requirements and implementation
├── TESTING.md                   # Testing strategy and standards
├── DEPLOYMENT.md                # Deployment pipeline and infrastructure
├── ENVIRONMENT.md               # Environment variables and configuration
├── DECISIONS.md                 # Architectural Decision Records (ADRs)
├── PROJECT_STATE.md             # Current development state
├── CHANGELOG.md                 # Version history and changes
├── KNOWN_ISSUES.md              # Known bugs and limitations
├── LESSONS.md                   # Lessons learned during development
├── ROADMAP.md                   # Future milestones and timeline
├── GLOSSARY.md                  # Domain terminology and abbreviations
├── NEXT_CHAT.md                 # Instructions for the next AI session
│
├── memory/                      # Long-term memory storage
│   ├── conversation_summary.md  # Summary of key conversations
│   ├── architecture_history.md  # Evolution of architecture decisions
│   └── important_notes.md       # Critical notes that must persist
│
├── tasks/                       # Task management system
│   ├── backlog.md               # Prioritized backlog
│   ├── completed.md             # Completed tasks log
│   ├── sprint.md                # Current sprint tasks
│   └── 001-project-setup/       # Individual task folders
│       ├── task.md              # Task definition
│       ├── plan.md              # Implementation plan
│       ├── progress.md          # Progress tracking
│       └── review.md            # Review notes
│
├── prompts/                     # Reusable AI prompts
│   ├── implement.md             # Implementation prompt
│   ├── review.md                # Code review prompt
│   ├── debug.md                 # Debugging prompt
│   └── ...                      # Other specialized prompts
│
├── templates/                   # Document templates
│   ├── feature.md               # Feature specification template
│   ├── bug.md                   # Bug report template
│   ├── task.md                  # Task definition template
│   ├── decision.md              # ADR template
│   ├── api.md                   # API endpoint template
│   └── pr.md                    # Pull request template
│
└── state/                       # Machine-readable state files
    ├── state.json               # Overall project state
    ├── current_task.json        # Currently active task
    ├── completed_tasks.json     # Completed task registry
    └── versions.json            # Dependency versions
```

## Rules for Updating This Memory System

1. **Never delete information** — mark it as deprecated or superseded instead
2. **Always update PROJECT_STATE.md** when starting or completing work
3. **Always update NEXT_CHAT.md** at the end of every session
4. **Always update CHANGELOG.md** when shipping features
5. **Always update DECISIONS.md** when making architectural choices
6. **Always update state/*.json** to keep machine-readable state current
7. **Always update the active task's progress.md** during development
8. **Cross-reference files** — link to related documents whenever possible

## Quick Reference

| Question | File |
|----------|------|
| What is this project? | [PROJECT.md](./PROJECT.md) |
| What are we building? | [VISION.md](./VISION.md) |
| What tech do we use? | [TECH_STACK.md](./TECH_STACK.md) |
| How is the system designed? | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| What does the database look like? | [DATABASE.md](./DATABASE.md) |
| What APIs exist? | [API.md](./API.md) |
| What features are planned? | [FEATURES.md](./FEATURES.md) |
| What should the UI look like? | [UI_GUIDELINES.md](./UI_GUIDELINES.md) (alias: [UI_UX.md](./UI_UX.md)) |
| What components exist? | [COMPONENTS.md](./COMPONENTS.md) |
| How should I write code? | [CODING_STANDARDS.md](./CODING_STANDARDS.md) (alias: [CODING_RULES.md](./CODING_RULES.md)) |
| What are the security rules? | [SECURITY.md](./SECURITY.md) |
| How do I test? | [TESTING.md](./TESTING.md) |
| How do I deploy? | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| What env vars are needed? | [ENVIRONMENT.md](./ENVIRONMENT.md) |
| Why was this decision made? | [DECISIONS.md](./DECISIONS.md) |
| Where are we now? | [PROJECT_STATE.md](./PROJECT_STATE.md) |
| What changed recently? | [CHANGELOG.md](./CHANGELOG.md) |
| What's broken? | [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) |
| What have we learned? | [LESSONS.md](./LESSONS.md) |
| What's coming next? | [ROADMAP.md](./ROADMAP.md) |
| What does this term mean? | [GLOSSARY.md](./GLOSSARY.md) |
| What should I do right now? | [NEXT_CHAT.md](./NEXT_CHAT.md) |
