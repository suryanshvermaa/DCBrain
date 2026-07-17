# Demo Ground Truth

This document centrally defines the intentional "errors", "conflicts", and "issues" injected into the dataset to demonstrate DCBrain's AI capabilities. 
Independent tasks will generate their portion of these scenarios.

## SCENARIO-001: CRAC Unit Procurement Delay
- **Equipment:** CRAC-01
- **DATA-TASK-03:** Mechanical Spec requires delivery by 15-Sep-2026.
- **DATA-TASK-05:** Vendor tracker CSV shows actual projected delivery is 10-Oct-2026 (25-day delay).
- **DATA-TASK-07:** Activity `MECH-CRAC-130` (Installation) starts 20-Sep-2026 and has 0 days of float (Critical Path).
- **Expected DCBrain Finding:** Schedule Risk Agent flags `MECH-CRAC-130` due to procurement delay of `CRAC-01`.

## SCENARIO-002: Generator Compliance Mismatch
- **Equipment:** DG-01
- **DATA-TASK-01:** Design Basis dictates all generators must be Tier III compliant.
- **DATA-TASK-02:** `Submittal-DG-01.pdf` from Cummins clearly states "Tier II Emissions standard".
- **Expected DCBrain Finding:** Compliance engine detects contradiction between submittal and design basis.

## SCENARIO-003: Unresolved Change Order blocking SAT
- **Equipment:** UPS-01
- **DATA-TASK-02:** Original capacity: 500kVA.
- **DATA-TASK-08:** `CO-0002.pdf` changes requirement to 600kVA, but is marked as `Pending Approval`.
- **DATA-TASK-05:** `PO-2025-0041` was issued for 600kVA.
- **DATA-TASK-06:** SAT checklist fails because nameplate shows 600kVA but original IFC drawing says 500kVA.
- **Expected DCBrain Finding:** RAG resolves the discrepancy by linking the failed SAT, the pending Change Order, and the updated PO.
