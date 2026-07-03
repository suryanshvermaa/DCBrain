# Documentation Prompt

---

## Prompt Template

```
You are writing or updating documentation for DCBrain.

## Documentation Location
All project documentation lives in the .ai/ folder. Read .ai/README.md for the complete file map.

## What to Document
[Describe what needs documentation]

## Documentation Standards
- Professional tone, concise writing
- No placeholder text ("TODO", "TBD", "lorem ipsum")
- Every statement must be factual and current
- Cross-reference related documents using relative markdown links
- Include code examples where they aid understanding
- Tables for structured comparison data
- Diagrams (ASCII art or Mermaid) for system relationships

## Files to Update
Depending on the change, update the relevant files:
- New feature → FEATURES.md, COMPONENTS.md, API.md
- Architecture change → ARCHITECTURE.md, DECISIONS.md
- Bug fix → KNOWN_ISSUES.md, CHANGELOG.md
- Completed task → PROJECT_STATE.md, CHANGELOG.md, tasks/completed.md
- New technology → TECH_STACK.md, DECISIONS.md
- Security change → SECURITY.md
- Lesson learned → LESSONS.md

## Always Update
- CHANGELOG.md — what changed
- PROJECT_STATE.md — current state
- NEXT_CHAT.md — what the next AI session needs to know

## Output
- Updated documentation files
- All cross-references verified
- No broken links
```
