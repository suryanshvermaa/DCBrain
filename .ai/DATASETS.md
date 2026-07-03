# Datasets

## Expected Datasets
- **Project Documents:** Specifications, drawings, RFIs, submittals, commissioning logs.
- **Schedules:** Primavera P6 XML exports.
- **Procurement Logs:** CSV/Excel files tracking POs and delivery dates.

## Public Sources & Standards
- ASHRAE 90.4 (Energy Standard for Data Centers)
- TIA-942 (Telecommunications Infrastructure Standard)
- NFPA 75 (Fire Protection for IT Equipment)

## Synthetic Datasets (For Testing)
- Auto-generated mock engineering specifications.
- Simulated chat histories and RFI threads.
- Synthetic Primavera P6 XMLs with engineered delays for testing risk models.

## Document Formats & File Types
- **PDF:** Specs, Reports, Submittals.
- **DOCX:** Draft specifications, RFIs.
- **XLSX / CSV:** Procurement, BOQ, Schedules.
- **XML:** Primavera P6 schedule data.
- **DWG / Image:** Schematics, plans (future scope).

## Dataset Usage
- **RAG & Search:** Documents are chunked and embedded in ChromaDB for search.
- **Agent Context:** Datasets provide the ground truth for agent analysis (Compliance, Schedule).
- **Evaluation:** Synthetic datasets will be used to benchmark agent accuracy and prompt performance.
