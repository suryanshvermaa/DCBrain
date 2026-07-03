# Debug Prompt

Use this prompt when asking an AI model to debug an issue.

---

## Prompt Template

```
You are debugging an issue in DCBrain, an AI-powered EPC Project Intelligence platform.

## Context
Read these files first:
1. .ai/ARCHITECTURE.md — Understand the system
2. .ai/KNOWN_ISSUES.md — Check if this is a known issue
3. .ai/TECH_STACK.md — Understand the technologies

## Problem Description
[Describe the bug or unexpected behavior]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Error Messages / Stack Trace
[Paste error output]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Environment
- OS: [operating system]
- Node version: [version]
- Docker: [yes/no, version]
- Browser: [if frontend issue]

## What I've Already Tried
[List debugging steps taken]

## Debugging Approach
1. Analyze the error message and stack trace
2. Identify the component and layer where the error occurs
3. Check for common causes in that layer
4. Propose a hypothesis for the root cause
5. Suggest a fix with code
6. Suggest a test to prevent regression

## After Fixing
- Add the issue and fix to .ai/KNOWN_ISSUES.md if it could recur
- Add a lesson to .ai/LESSONS.md if the root cause was non-obvious
- Add a regression test
```
