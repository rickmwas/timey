# Technical Specifications — Timy

This directory contains implementation-ready technical specifications for the core modules of Timy.

## Index of Specifications:
- **[SPEC-001: Authentication & Role-Based Access Control](file:///c:/Users/rickm/OneDrive/Desktop/timy/docs/specs/SPEC-001-auth-and-rbac.md)** — User accounts, password hashing, JWT sessions, and role guards (`STUDENT`, `LECTURER`, `ADMIN`, `TIMETABLE_OFFICER`).
- **[SPEC-002: Timetable Ingestion Pipeline & Parser](file:///c:/Users/rickm/OneDrive/Desktop/timy/docs/specs/SPEC-002-timetable-ingestion-pipeline.md)** — Multi-stage parser, staging tables, normalization, preview, and atomic commit.
- **[SPEC-003: Venue Management & Conflict Detection Engine](file:///c:/Users/rickm/OneDrive/Desktop/timy/docs/specs/SPEC-003-venue-conflict-detection.md)** — Mathematical clash detection, venue availability index, and capacity checks.
- **[SPEC-004: Class Rescheduling, Cancellations & Notification Engine](file:///c:/Users/rickm/OneDrive/Desktop/timy/docs/specs/SPEC-004-rescheduling-and-notifications.md)** — Rescheduling workflows, audience resolution, and in-app notification dispatch.

## Spec Format:
Every spec must detail:
1. Feature Name & Purpose
2. Actors & Permissions
3. Preconditions & Invariants
4. Inputs & Processing
5. Data Model / Schema Impacts
6. Validation & Error Handling
7. Acceptance Criteria (Testable checklist)
