# Refactor Prompt

---

## Prompt Template

```
You are refactoring code in DCBrain. Read .ai/CODING_STANDARDS.md and .ai/ARCHITECTURE.md first.

## What to Refactor
[Describe the code or module to refactor]

## Why Refactor
[Describe the problem: duplication, poor separation, growing complexity, etc.]

## Refactoring Goals
- [ ] Reduce code duplication
- [ ] Improve separation of concerns
- [ ] Simplify complex functions
- [ ] Extract reusable utilities
- [ ] Improve type safety
- [ ] Align with ARCHITECTURE.md patterns

## Constraints
- All existing tests must continue to pass
- Public API contracts must not change (or changes must be documented)
- No functional behavior changes (unless explicitly requested)
- Update imports in all consuming files
- If the refactor reveals a design issue, document it in DECISIONS.md

## Output
- Refactored code files
- Updated tests if test structure changes
- List of files modified
- Explanation of changes made and why
```
