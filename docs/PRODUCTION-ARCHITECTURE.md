# TIMEY — Production Architecture Overview

## 1. System Topology & Technology Stack
- **Framework**: Next.js 14 App Router (React 18, TypeScript, Tailwind CSS v4).
- **Database Layer**: PostgreSQL managed via Prisma ORM v5 with serializable transaction isolation.
- **Security & Session Authentication**: Stateless 15-minute JWT access tokens (`HS256`), Bcrypt cost factor 12, and cryptographically secure random refresh token family rotation with automatic reuse invalidation.
- **Event Bus & Reliability**: Transactional Outbox pattern (`OutboxEvent`), decoupled post-commit side-effect execution, Server-Sent Events (SSE) with scoped authorization, and Web Push notifications (RFC 8291 / RFC 8292).
- **Storage Layer**: Environment-aware unified file storage provider (`LocalFileStorage` and `VercelBlobStorage`).

## 2. Core Operating Principle
> **The COD maintains academic structure and unit-to-cohort relationships. The Timetabler maintains the master schedule. Timey's reconciliation engine combines these sources into reliable, personalized academic schedules.**

## 3. Data & Operational Flow
```mermaid
flowchart TD
  Upload[Master Timetable File: CSV / XLSX / PDF] --> Parser[Format Detector & Ingestion Parser]
  Parser --> Staging[StagedTimetableEntry Table]
  Staging --> Reconciler[Academic Reconciliation Engine]
  Reconciler --> Catalog[(COD Academic Catalog: School / Dept / Programme / Cohort)]
  Reconciler --> ConflictEngine[Conflict Detection: Room / Faculty / Cohort / Capacity / Enrollment]
  ConflictEngine --> Review[Officer Resolution & Preview]
  Review --> Publish[Atomic Publication: TimetableEntry Master Slots]
  Publish --> Outbox[Transactional Outbox Pattern]
  Outbox --> Delivery[Multi-Channel Notification: In-App, Push, SSE]
```
