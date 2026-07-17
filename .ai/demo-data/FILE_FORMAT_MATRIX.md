# Supported File Formats & Dataset Matrix

| File Format | Extension | Supported by DCBrain | Parser Used | Feature Using It | Dataset Category | Planned File Count | Normal/Edge/Large |
|-------------|-----------|----------------------|-------------|------------------|------------------|--------------------|-------------------|
| PDF         | .pdf      | Yes                  | pdf-parse   | DocUpload, RAG, Compliance | Specs, Manuals, Reports | 300 | Normal & Large |
| MS Word     | .docx     | Yes                  | DOCX parser | DocUpload, RAG | RFIs, Minutes, Method Statements | 150 | Normal |
| MS Excel    | .xlsx     | Yes                  | xlsx        | DocUpload, Procurement | BOQ, Procurement Trackers | 50 | Normal & Large |
| CSV         | .csv      | Yes                  | xlsx/csv    | Procurement | Procurement Imports | 20 | Normal |
| XML         | .xml      | Yes                  | fast-xml-parser | Schedule | Primavera P6 Schedules | 10 | Normal & Large |
| Image       | .png      | Yes                  | tesseract OCR | DocUpload | Photos, Scanned Diagrams | 150 | Normal & Edge (noisy) |
| Image       | .jpg/.jpeg| Yes                  | tesseract OCR | DocUpload | Photos, Scanned Documents | 150 | Normal & Edge (rotated) |
| Image       | .tiff     | Yes                  | tesseract OCR | DocUpload | Engineering Scans | 50 | Edge |
| JSON        | .json     | Yes                  | native      | (Internal API/Tasks) | System logs, task manifests | 20 | Normal |
