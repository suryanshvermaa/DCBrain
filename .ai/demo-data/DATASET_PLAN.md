# Dataset Generation Plan

## Overview
This dataset simulates the Orion Data Centre Phase-1 project for the DCBrain hackathon. It provides the files necessary to demonstrate Document Upload, RAG, Knowledge Graph, Compliance, Procurement, Schedule Risk, Quality, and Agent orchestration.

## Total Scope
- **Independent Tasks:** 10
- **Total Estimated File Count:** ~900 files
- **Total Estimated Size:** ~500 MB to 1 GB

## Dataset Generation Strategy
The dataset will be generated across a maximum of 10 independent tasks. Each task generates files for a specific domain (e.g., Electrical, Mechanical, Procurement).
The generators must run independently on local machines. They will output to a shared `project-data/` folder structure, which is Git-ignored.

## Tasks summary
1. DATA-TASK-01 — Project Management & Engineering
2. DATA-TASK-02 — Electrical Infrastructure
3. DATA-TASK-03 — Mechanical, HVAC & Cooling
4. DATA-TASK-04 — Fire, BMS, Security & Networking
5. DATA-TASK-05 — Procurement & Commercial
6. DATA-TASK-06 — QA/QC, Testing & Commissioning
7. DATA-TASK-07 — Schedule & Project Controls
8. DATA-TASK-08 — RFIs, Change Orders & Compliance
9. DATA-TASK-09 — Site Evidence, Images & OCR Dataset
10. DATA-TASK-10 — AI Evaluation & Integrated Test Dataset
