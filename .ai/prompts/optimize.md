# Optimize Prompt

Use this prompt when asking an AI model to optimize performance.

---

## Prompt Template

```
You are optimizing performance in DCBrain, an AI-powered EPC Project Intelligence platform.

## Context
1. .ai/ARCHITECTURE.md — System architecture
2. .ai/TECH_STACK.md — Technologies used
3. .ai/REQUIREMENTS.md — Performance requirements (NFR-001)

## Performance Issue
[Describe what is slow or resource-intensive]

## Current Performance
- Metric: [e.g., search response time]
- Current value: [e.g., 8 seconds]
- Target value: [e.g., under 5 seconds]
- Measurement method: [how you measured]

## Performance Targets (from REQUIREMENTS.md)
- Page load: < 2 seconds
- Search response: < 5 seconds (P95)
- Document processing: < 60 seconds average
- API response: < 500ms for non-search endpoints

## Optimization Approach
1. Profile the slow path to identify bottlenecks
2. Check for N+1 queries in database access
3. Check for missing database indexes
4. Check for unnecessary data loading (select only needed columns)
5. Check for caching opportunities (Redis)
6. Check for async opportunities (are we blocking on I/O?)
7. Check frontend bundle size and rendering performance
8. Propose optimizations with expected impact
9. Implement the optimization
10. Measure after optimization and verify improvement

## Constraints
- Do not sacrifice code readability for micro-optimizations
- Do not add caching without cache invalidation strategy
- Do not add database indexes without analyzing write impact
- Document any performance tradeoffs in DECISIONS.md
```
