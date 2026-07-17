# Generation Tasks

The dataset is divided into 10 independent generation tasks. Each task generates a specific domain of documents and data.

## DATA-TASK-01 — Project Management & Engineering
- **Purpose:** Core project definitions, design basis, and meeting minutes.
- **Output Directories:** `project-data/01-project-management`, `project-data/02-design-engineering`
- **File Formats:** PDF, DOCX
- **Shared IDs:** N/A (Defines high-level project metadata)
- **Approx File Count:** 50
- **Size Estimate:** 25MB

## DATA-TASK-02 — Electrical Infrastructure
- **Purpose:** UPS, Generators, Transformers, Switchgear specifications and drawings.
- **Output Directories:** `project-data/03-electrical`
- **File Formats:** PDF, DOCX, PNG/JPG (Diagrams)
- **Shared IDs:** UPS-01..04, DG-01..02, SWG-01..02
- **Approx File Count:** 100
- **Size Estimate:** 80MB

## DATA-TASK-03 — Mechanical, HVAC & Cooling
- **Purpose:** CRAC, Chillers, Cooling Towers specifications and diagrams.
- **Output Directories:** `project-data/04-mechanical-hvac`
- **File Formats:** PDF, DOCX, PNG/JPG
- **Shared IDs:** CRAC-01..04
- **Approx File Count:** 100
- **Size Estimate:** 80MB

## DATA-TASK-04 — Fire, BMS, Security & Networking
- **Purpose:** Fire suppression, BMS logic, network rack layouts.
- **Output Directories:** `project-data/05-fire-bms-security`, `project-data/06-networking-it`
- **File Formats:** PDF, DOCX, PNG/JPG
- **Shared IDs:** VENDOR-VERTIV-001, VENDOR-SIEMENS-001
- **Approx File Count:** 100
- **Size Estimate:** 80MB

## DATA-TASK-05 — Procurement & Commercial
- **Purpose:** BOQs, Purchase Orders, Vendor Submittals, Procurement trackers.
- **Output Directories:** `project-data/07-procurement`
- **File Formats:** XLSX, CSV, PDF
- **Shared IDs:** PO-2025-0041..43, all Equipment IDs
- **Approx File Count:** 80
- **Size Estimate:** 30MB

## DATA-TASK-06 — QA/QC, Testing & Commissioning
- **Purpose:** Inspection reports, FAT, SAT, Commissioning certificates.
- **Output Directories:** `project-data/08-quality-commissioning`
- **File Formats:** PDF, DOCX, JPG (photos attached to reports)
- **Shared IDs:** INS-*, FAT-*, SAT-*, COMM-*
- **Approx File Count:** 120
- **Size Estimate:** 100MB

## DATA-TASK-07 — Schedule & Project Controls
- **Purpose:** Master schedules, daily/weekly progress reports.
- **Output Directories:** `project-data/09-project-controls`
- **File Formats:** XML (Primavera P6), PDF, DOCX
- **Shared IDs:** ELE-UPS-120, MECH-CRAC-130, GEN-DG-140
- **Approx File Count:** 40
- **Size Estimate:** 20MB

## DATA-TASK-08 — RFIs, Change Orders & Compliance
- **Purpose:** Simulates project friction via RFIs, COs, and NCRs mapping to ground truth issues.
- **Output Directories:** `project-data/12-rfis`, `project-data/11-change-orders`, `project-data/13-compliance`
- **File Formats:** PDF, DOCX
- **Shared IDs:** RFI-*, NCR-*, CO-*
- **Approx File Count:** 100
- **Size Estimate:** 50MB

## DATA-TASK-09 — Site Evidence, Images & OCR Dataset
- **Purpose:** Raw site photographs and noisy/rotated scans to test Tesseract OCR capabilities.
- **Output Directories:** `project-data/10-site-evidence`
- **File Formats:** PNG, JPG, TIFF, PDF (scanned)
- **Shared IDs:** All equipment
- **Approx File Count:** 150
- **Size Estimate:** 200MB

## DATA-TASK-10 — AI Evaluation & Integrated Test Dataset
- **Purpose:** Ground truth Q&A pairs for evaluating RAG and Agent routing accuracy.
- **Output Directories:** `project-data/10-site-evidence/OCR-test-documents` and generic system paths
- **File Formats:** JSON, TXT, PDF
- **Shared IDs:** Evaluates all scenarios
- **Approx File Count:** 60
- **Size Estimate:** 10MB
