# Task 008: Schedule Risk Prediction

## Overview
- **ID:** 008
- **Priority:** P0 (Critical)
- **Estimate:** 8 hours
- **Sprint:** 3
- **Dependencies:** 001 (Project Setup)
- **Status:** Completed

## Objective

Build a schedule risk analysis module that imports Primavera P6 schedule data, identifies critical path activities, calculates risk scores, and predicts potential delays. Provides a risk heat map visualization and recommended mitigation actions.

## Acceptance Criteria

- [ ] P6 XML schedule import endpoint
- [ ] Parse activities, dependencies, dates, float, and resource assignments
- [ ] Critical path identification
- [ ] Risk score calculation (0-100) per activity based on: float consumption, RFI dependency, procurement lead time, historical patterns
- [ ] Schedule health indicators: SPI, float consumption rate, critical path changes
- [ ] Predicted completion date with confidence interval
- [ ] Risk heat map visualization (red/amber/green)
- [ ] Recommended mitigation actions per high-risk activity
- [ ] Alert when risk score exceeds configurable threshold
- [ ] Database migration for `schedule_activities` table
- [ ] Frontend schedule page with import, critical path view, and risk heat map

## Reference Documents
- [REQUIREMENTS.md](../../REQUIREMENTS.md) — FR-007 Schedule Risk
- [API.md](../../API.md) — Schedule endpoint specifications
- [DATABASE.md](../../DATABASE.md) — Schedule activities table
- [KNOWN_ISSUES.md](../../KNOWN_ISSUES.md) — ISSUE-E004 P6 XML format variations
