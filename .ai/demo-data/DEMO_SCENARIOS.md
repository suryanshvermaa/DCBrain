# Demo Scenarios

These are the primary demonstration paths for the hackathon presentation. The dataset will be generated to naturally support these flows.

## Scenario 1: The Cascading Delay (Schedule Intelligence & Mitigation)
- **Trigger:** Procurement data (Task 5) shows a 3-week delay for the CRAC units (`CRAC-01`).
- **Graph Propagation:** Delay impacts schedule activity `MECH-CRAC-130` (Task 7).
- **Action:** Executive Copilot detects critical path threat, simulates alternatives, and recommends working weekend shifts.

## Scenario 2: The Silent Compliance Violation (Compliance Engine)
- **Trigger:** Generator submittal `Submittal-DG-01.pdf` (Task 2) specifies a Tier II emissions rating.
- **Action:** Compliance Agent cross-references this with `SPEC-DG-001.pdf` which strictly requires Tier III emissions per local regulations. Flagged as High Risk.

## Scenario 3: Automated Quality Health (AI Agents & RAG)
- **Trigger:** Multiple failing `NCRs` on the structural cabling (Task 6).
- **Action:** Dashboard Health Score drops. Querying the Chat interface: "Why is the quality score dropping?" returns a synthesized answer referencing the exact NCR documents and linking to the relevant cabling contractor.
