# Documentation Knowledge Base — Timy

Welcome to the engineering documentation hub for **Timy**, the Academic Timetable and Venue Management System for Kisii University.

## Directory Structure & Index

- **[`decisions/`](file:///c:/Users/rickm/OneDrive/Desktop/timy/docs/decisions/)**: Technology Decision Records (TDRs). Architectural and stack selections with explicit rationales, tradeoffs, and consequences.
  - [TDR-001: Core Technology Stack](file:///c:/Users/rickm/OneDrive/Desktop/timy/docs/decisions/TDR-001-technology-stack.md)
- **[`scope/`](file:///c:/Users/rickm/OneDrive/Desktop/timy/docs/scope/)**: Living product scope boundaries.
  - [MVP Scope vs Phase 2 vs Future](file:///c:/Users/rickm/OneDrive/Desktop/timy/docs/scope/mvp-scope.md)
- **[`specs/`](file:///c:/Users/rickm/OneDrive/Desktop/timy/docs/specs/)**: Implementation-ready technical specifications.
  - [SPEC-001: Authentication & Role-Based Access Control](file:///c:/Users/rickm/OneDrive/Desktop/timy/docs/specs/SPEC-001-auth-and-rbac.md)
  - [SPEC-002: Timetable Ingestion Pipeline & Parser](file:///c:/Users/rickm/OneDrive/Desktop/timy/docs/specs/SPEC-002-timetable-ingestion-pipeline.md)
  - [SPEC-003: Venue Management & Conflict Detection Engine](file:///c:/Users/rickm/OneDrive/Desktop/timy/docs/specs/SPEC-003-venue-conflict-detection.md)
  - [SPEC-004: Class Rescheduling, Cancellations & Notification Engine](file:///c:/Users/rickm/OneDrive/Desktop/timy/docs/specs/SPEC-004-rescheduling-and-notifications.md)
- **[`reviews/`](file:///c:/Users/rickm/OneDrive/Desktop/timy/docs/reviews/)**: Historical records of architectural reviews, code reviews, and postmortems.
  - [README & Template](file:///c:/Users/rickm/OneDrive/Desktop/timy/docs/reviews/README.md)

## Governing Principles
1. Documentation must stay in sync with actual code. Never merge a PR that alters architecture without updating the relevant doc here.
2. Every major technical choice must have a corresponding TDR in `decisions/`.
3. Every feature must have an approved spec in `specs/` before implementation begins.
