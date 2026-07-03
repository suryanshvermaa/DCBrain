# Frontend Prompt

---

## Prompt Template

```
You are building a frontend component for DCBrain.

## Required Reading
1. .ai/UI_GUIDELINES.md — Design tokens, colors, typography, spacing
2. .ai/COMPONENTS.md — Component hierarchy and props
3. .ai/CODING_STANDARDS.md — Frontend coding standards (TypeScript section)

## Component to Build
[Name and description of the component]

## Props Interface
[Define or reference from COMPONENTS.md]

## Design Requirements
- Use CSS custom properties from index.css (design tokens)
- Dark theme primary (--color-bg-primary: #0A0E1A)
- Font: Inter from Google Fonts
- Border radius: use --radius-md (8px) for cards, --radius-sm (4px) for badges
- Spacing: use --space-* tokens (multiples of 4px)
- Colors: use semantic tokens (--color-accent-blue, --color-status-pass, etc.)

## Coding Rules
- Functional component with named export
- Props interface named {ComponentName}Props
- No default exports
- No inline styles — use CSS modules or design tokens
- No business logic in components — extract to hooks
- Destructure props in function signature
- Use Redux Toolkit for client state and server-state caching via RTK Query where appropriate
- Use Next.js App Router patterns (server components by default, client components only when needed)

## Accessibility
- Interactive elements have aria-labels
- Keyboard navigation works
- Color contrast meets WCAG AA
- Focus indicators visible

## Output
- Component file (.tsx)
- Test file (.test.tsx)
- Type definitions if needed
```
