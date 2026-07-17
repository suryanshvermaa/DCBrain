# Dataset Relationships

This file describes how the independently generated tasks connect their data to simulate an interconnected EPC Project.

## Cross-Document Lineage Example: UPS System
1. **Design (DATA-TASK-02):** `SPEC-UPS-001.pdf` defines the 500kVA requirement.
2. **Procurement (DATA-TASK-05):** `PO-2025-0041.pdf` orders UPS-01 from VENDOR-SCHNEIDER-001. `Submittal-UPS-01.pdf` confirms specifications.
3. **Schedule (DATA-TASK-07):** `Schedule-Update-1.xml` tracks `ELE-UPS-120` (UPS Installation).
4. **QA/QC (DATA-TASK-06):** `INS-UPS-001.docx` and `SAT-UPS-001.pdf` record testing and commissioning of UPS-01.
5. **Issues (DATA-TASK-08):** `RFI-0012.docx` discusses clearance issues for UPS-01. `NCR-0005.pdf` documents a damaged panel on delivery.

## Failure Propagation Graph Dependencies
- **Nodes:** Equipment (UPS-01), Vendor (VENDOR-SCHNEIDER-001), Activity (ELE-UPS-120), Document (SPEC-UPS-001).
- **Edges:**
  - `UPS-01` `DEPENDS_ON` `VENDOR-SCHNEIDER-001`
  - `ELE-UPS-120` `DEPENDS_ON` `UPS-01`
  - `SPEC-UPS-001` `GOVERNS` `UPS-01`

Tasks must consistently use IDs from `ID_REGISTRY.md` so the backend GraphDB connects the nodes seamlessly.
