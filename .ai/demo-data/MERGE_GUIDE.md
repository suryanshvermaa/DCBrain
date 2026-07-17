# Dataset Merge Guide

Because generation tasks are executed independently on local machines and output to `project-data/` (which is git-ignored), you must manually merge the dataset before testing the full system.

## Merge Steps
1. Each team member completes their assigned `DATA-TASK-XX`.
2. Ensure every task outputs a `TASK_MANIFEST.json` and `TASK_VALIDATION_REPORT.md` at the root of `project-data/`.
3. Compress your local `project-data/` folder into a `.zip` (e.g., `DATA-TASK-05.zip`).
4. Share the `.zip` via your team's shared drive or internal communication tool.
5. On the host machine (where the hackathon demo will run), unzip all task archives into the single `project-data/` directory.

## Conflict Resolution
Because tasks output to explicitly separated subdirectories (e.g., `03-electrical` vs `07-procurement`), there should be **zero file-level conflicts**.

**Verification:**
After merging, check for accidental duplicate file names:
`find project-data -type f -printf "%f\n" | sort | uniq -d`

Intentional conflicts (like a Procurement spec mismatching a Design spec) are documented in `DEMO_GROUND_TRUTH.md` and are **expected**. Do not "fix" these files! They are necessary for testing DCBrain's AI anomaly detection.
