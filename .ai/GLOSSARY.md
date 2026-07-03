# Glossary

Domain-specific terminology, abbreviations, and technical terms used throughout the DCBrain project. Understanding these terms is essential for any AI model or developer working on the codebase.

---

## EPC Industry Terms

| Term | Full Form | Definition |
|------|-----------|-----------|
| **EPC** | Engineering, Procurement, and Construction | A project delivery method where a single contractor is responsible for the complete design, procurement of materials, and construction of a facility. |
| **Data Centre** | — | A facility housing computer systems, storage, and networking equipment. Classified by tier level for redundancy and availability. |
| **Tier I** | — | Basic capacity. Single path for power and cooling, no redundancy. 99.671% uptime. |
| **Tier II** | — | Redundant capacity components. Single distribution path. 99.741% uptime. |
| **Tier III** | — | Concurrently maintainable. Multiple distribution paths, one active. N+1 redundancy. 99.982% uptime. |
| **Tier IV** | — | Fault tolerant. Multiple active distribution paths. 2N redundancy. 99.995% uptime. |
| **RFI** | Request for Information | A formal question submitted during construction when the contractor needs clarification on design documents, specifications, or drawings. |
| **Submittal** | — | A document submitted by a contractor or vendor for engineer's review and approval before materials are manufactured or installed. |
| **P6** | Primavera P6 | Oracle's project management software used for scheduling in EPC projects. Exports schedule data as XML or XER files. |
| **BIM** | Building Information Modeling | 3D digital representation of a facility that contains spatial and metadata information about building components. |
| **QA/QC** | Quality Assurance / Quality Control | QA focuses on preventing defects through process. QC focuses on detecting defects through inspection. |
| **ITP** | Inspection and Test Plan | A document listing all inspections and tests required during construction, with hold/witness/review point classifications. |
| **NCR** | Non-Conformance Report | A report documenting a deviation from specifications, drawings, or standards. |
| **WBS** | Work Breakdown Structure | A hierarchical decomposition of project work into manageable sections. Used to organize schedule activities. |
| **PO** | Purchase Order | A commercial document authorizing a purchase from a vendor at an agreed price and delivery schedule. |
| **BOQ** | Bill of Quantities | A document listing materials, parts, and labor with quantities and costs for a construction project. |
| **As-Built** | — | Drawings modified to reflect actual constructed conditions, including all field changes and modifications. |
| **Commissioning** | — | The process of testing and verifying that all building systems are installed correctly and operate according to specifications. |
| **Punch List** | — | A list of items that need to be completed or corrected before a project phase is considered finished. |
| **Float** | — | The amount of time a schedule activity can be delayed without delaying the project completion date. Zero float = critical path. |
| **Critical Path** | — | The longest sequence of dependent activities that determines the minimum project duration. Any delay on the critical path delays the project. |
| **SPI** | Schedule Performance Index | A measure of schedule efficiency. SPI = Earned Value / Planned Value. SPI < 1.0 means behind schedule. |
| **CPI** | Cost Performance Index | A measure of cost efficiency. CPI = Earned Value / Actual Cost. CPI < 1.0 means over budget. |
| **Lead Time** | — | The elapsed time between ordering a material and receiving it on site. Critical for long-lead items like switchgear and generators. |
| **Long-Lead Item** | — | Equipment or materials with procurement lead times exceeding 12-16 weeks (e.g., transformers, generators, UPS systems, chillers). |

---

## Industry Standards Referenced

| Code | Full Name | Relevance |
|------|-----------|-----------|
| **ASHRAE 90.4** | Energy Standard for Data Centers | Energy efficiency requirements for data centre HVAC and power systems |
| **TIA-942** | Telecommunications Infrastructure Standard for Data Centers | Physical infrastructure design including space, cabling, tiering, and redundancy |
| **NFPA 75** | Standard for the Fire Protection of IT Equipment | Fire detection, suppression, and prevention for IT spaces |
| **NFPA 76** | Standard for the Fire Protection of Telecommunications Facilities | Fire protection specific to telecommunications facilities |
| **Uptime Institute** | Data Center Tier Standards | Tier classification system (I-IV) defining redundancy and availability requirements |
| **IEEE 3006** | Power Systems Design and Analysis | Recommended practices for power systems reliability, grounding, and protection |
| **IEC 62040** | Uninterruptible Power Systems (UPS) | Standards for UPS classification, performance, and testing |
| **EN 50600** | Information Technology — Data Centre Facilities and Infrastructures | European standard for data centre design and operations |

---

## Technical Terms

| Term | Definition |
|------|-----------|
| **RAG** | Retrieval-Augmented Generation. An AI pattern that retrieves relevant documents and uses them as context for LLM answer generation. Reduces hallucination by grounding responses in source data. |
| **Embedding** | A numerical vector representation of text that captures semantic meaning. Similar texts have similar embeddings (close in vector space). Used for similarity search. |
| **Vector Database** | A database optimized for storing and querying high-dimensional vectors. Supports approximate nearest neighbor (ANN) search for finding similar embeddings. |
| **Chunking** | The process of splitting a large document into smaller, overlapping text segments for embedding generation. Chunk size affects retrieval quality. |
| **BM25** | Best Matching 25. A keyword-based ranking function used in information retrieval. Ranks documents by term frequency and inverse document frequency. |
| **RRF** | Reciprocal Rank Fusion. A method for combining ranked results from multiple search systems. Score = 1/(k + rank) summed across systems. |
| **Hybrid Search** | Combining semantic search (vector similarity) with keyword search (BM25) for more robust retrieval. |
| **Top-K** | The number of most relevant results returned from a search query. Higher K means more context for the LLM but also more noise. |
| **Confidence Score** | A numerical score (0-1) indicating the LLM's confidence in its generated answer based on the relevance of retrieved context. |
| **OCR** | Optical Character Recognition. Converting images of text (scanned documents) into machine-readable text. |
| **JWT** | JSON Web Token. A compact, URL-safe token format for transmitting claims between parties. Used for authentication. |
| **RBAC** | Role-Based Access Control. Authorization model where permissions are assigned to roles, and roles are assigned to users. |
| **CORS** | Cross-Origin Resource Sharing. A security mechanism that allows or restricts web page requests from different origins. |
| **ORM** | Object-Relational Mapping. A technique for converting between database records and programming language objects (e.g., Prisma). |
| **ADR** | Architectural Decision Record. A document capturing a significant architectural decision with context, options, and rationale. |
| **HMR** | Hot Module Replacement. A development feature that updates modules in a running application without a full page reload. |
| **SPA** | Single-Page Application. A web application that loads a single HTML page and dynamically updates content via JavaScript. |
| **SSR** | Server-Side Rendering. Rendering web pages on the server before sending to the client. Improves SEO and initial load time. |
| **CSP** | Content Security Policy. An HTTP header that restricts which resources a browser can load for a page. Prevents XSS attacks. |

---

## Project-Specific Terms

| Term | Definition |
|------|-----------|
| **DCBrain** | The codename for this AI Intelligence Platform |
| **Document Processing Pipeline** | The async workflow: upload → text extraction → chunking → embedding → vector storage |
| **Compliance Check** | An automated analysis comparing a project document against industry standard requirements |
| **Risk Score** | A 0-100 score assigned to schedule activities indicating delay probability. Higher = more likely to delay. |
| **Agent** | An autonomous AI routine that runs on a schedule to monitor project data and generate alerts |
| **Project Health Score** | A composite metric (0-100) combining schedule, cost, quality, and compliance indicators |
| **Source Citation** | A reference linking an AI-generated answer to the specific document, page, and section it was derived from |
| **NCR** | Non-Conformance Report. A document detailing a deviation from expected standards or specifications. |
| **Change Order** | Authorized changes to project scope, schedule, or cost parameters. |
| **Failure Propagation** | The cascading impact of a single delay/failure across the dependency graph in the Simulation Engine. |

## Related Documents

- [PROJECT.md](./PROJECT.md) — Project context
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Technical architecture
- [REQUIREMENTS.md](./REQUIREMENTS.md) — Feature requirements using these terms
