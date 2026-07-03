# Task 007: Compliance Checker

## Overview
- **ID:** 007
- **Priority:** P1 (High)
- **Estimate:** 10 hours
- **Sprint:** 3
- **Dependencies:** 005 (RAG Search)
- **Status:** Not Started

## Objective

Build an automated compliance validation engine that checks project specification documents against referenced industry standards (ASHRAE 90.4, NFPA 75, TIA-942, Uptime Institute). Uses the RAG pipeline to extract requirements from specifications and compare them against standard clauses, generating a compliance report with pass/fail/warning status per requirement.

## Acceptance Criteria

- [ ] Compliance check endpoint (`POST /api/v1/projects/{id}/compliance/check`)
- [ ] Parse specification documents to extract compliance-relevant clauses
- [ ] Map extracted requirements to referenced standards
- [ ] AI-powered comparison of specification vs standard requirements
- [ ] Compliance report with pass/fail/warning status per clause
- [ ] Evidence (exact quotes) for each finding
- [ ] Severity classification (critical, major, minor, observation)
- [ ] Compliance summary endpoint with overall percentage
- [ ] Database migration for `compliance_checks` table
- [ ] Frontend compliance overview page
- [ ] Compliance check runner form
- [ ] Findings table with expandable detail rows
- [ ] PDF-exportable compliance report

## Reference Documents
- [REQUIREMENTS.md](../../REQUIREMENTS.md) — FR-006 Compliance Validation
- [API.md](../../API.md) — Compliance endpoint specifications
- [DATABASE.md](../../DATABASE.md) — Compliance checks table
- [KNOWN_ISSUES.md](../../KNOWN_ISSUES.md) — ISSUE-E003 LLM hallucination mitigation
