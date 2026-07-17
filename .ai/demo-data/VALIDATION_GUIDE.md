# Dataset Validation Guide

Every generated task MUST pass these validation criteria before it is considered complete. The generator will produce a `TASK_VALIDATION_REPORT.md` documenting these checks.

## 1. File Integrity
- All PDF files can be opened by a standard PDF viewer (no corrupted binary streams).
- All DOCX/XLSX files conform to OpenXML standards.
- XML files (Primavera P6) parse correctly without schema errors.
- Image files are valid PNG/JPG/TIFF headers.

## 2. Path Compliance
- NO files were generated outside of `project-data/`.
- NO files were generated in unassigned directories for that specific task.

## 3. ID Consistency
- All referenced Equipment IDs match `ID_REGISTRY.md`.
- All referenced Vendor IDs match `ID_REGISTRY.md`.
- Project name/ID strictly matches `ORION-DC-P1` from `PROJECT_DATA_MASTER.md`.

## 4. Scenario Coverage
- Check if the task properly injected its portion of `DEMO_GROUND_TRUTH.md` (e.g., if Task 5 correctly generated a CSV showing the 25-day CRAC delay).

## 5. File Count and Sizing
- Task file count roughly matches estimates (+/- 20%).
- At least 1 "Large" file (e.g., > 10MB PDF) exists if the task dictates it (e.g., Task 1, 2, 3, or 7).
