# TDR-001: Core Technology Stack Selection

- **Status**: ACCEPTED
- **Date**: 2026-09-24
- **Authors**: Group 26 Engineering Team / Technical Lead

---

## 1. Context & Problem Statement
Timy requires a robust, relational, performant web application serving three distinct user roles (Students, Lecturers, Administrators/Timetable Coordinators) at Kisii University.
Key requirements and environmental factors:
1. **Team Constraints**: 4 student developers divided into 2 frontend and 2 backend/platform specialists. The team needs minimal contract friction, shared types, and straightforward deployment.
2. **End-User Environment**: In Kenya, university students rely heavily on mobile devices on cellular networks and campus Wi-Fi. Fast page loads, minimal data transfer, and offline-accessible schedules (PWA) are critical.
3. **Domain Complexity**: Relational schedule data, timetable matrices, venue availability checking, file ingestion (Excel/PDF), and real-time conflict checking.

---

## 2. Considered Alternatives

### Alternative A: Decoupled Django (Python) REST Framework + React (Vite) SPA
- *Pros*: Python provides powerful scientific libraries (`pandas`, `pdfplumber`, `openpyxl`) for parsing messy university timetable spreadsheets.
- *Cons*: Two separate codebases; double the deployment complexity; type duplication across TypeScript and Python; harder for frontend devs to contribute to backend APIs.

### Alternative B: NestJS / Express Backend + React Native Mobile App
- *Pros*: Native mobile installation on Android devices.
- *Cons*: High overhead of building and reviewing native mobile builds (APK signing, app stores); admin/coordinator timetable matrix views are poorly suited to mobile screens; steep learning curve for a 4-person student team.

### Alternative C: Unified Next.js (App Router) + TypeScript + Prisma ORM + PostgreSQL (SELECTED)
- *Pros*:
  - Single repository with 100% end-to-end TypeScript type-safety (shared DTOs, Zod schemas, Prisma models).
  - React Server Components (`RSC`) deliver zero-bundle-size rendered schedules, drastically cutting data consumption for students on mobile.
  - Built-in API route handlers and Server Actions eliminate API boilerplate.
  - Next-PWA / Service Worker enables offline caching of student timetables immediately.
  - Native Excel parsing via `xlsx` (SheetJS) and `papaparse` in Node.js is mature and battle-tested.
  - Relational integrity guaranteed by PostgreSQL with Prisma migrations.

---

## 3. Decision Outcome
We choose **Alternative C: Next.js (App Router) + TypeScript + Prisma ORM + PostgreSQL**.

### Detailed Technology Choices:
1. **Frontend Framework**: Next.js 14+ (App Router), React 18/19.
2. **Language**: TypeScript (`strict: true`).
3. **Styling & Design**: Tailwind CSS + Radix UI accessible headless primitives + Lucide Icons.
4. **Data Management & ORM**: Prisma ORM with PostgreSQL.
5. **Validation**: Zod (runtime validation on forms and API route inputs).
6. **Parsing Engine**: `xlsx` (SheetJS) & `csv-parser` for spreadsheet ingestion; `pdf-parse` for PDF tables.
7. **Client State & Caching**: TanStack Query (React Query) for interactive dashboard tables; LocalStorage / IndexedDB for student offline timetable caching.
8. **Testing**: Vitest for unit & integration testing; Playwright for E2E flows.
9. **Deployment Target**: Vercel or containerized Docker on Render/Railway with a managed PostgreSQL database.

---

## 4. Consequences & Mitigations
- *Consequence*: Complex PDF timetable layouts can be difficult to parse deterministically in JavaScript compared to Python.
  - *Mitigation*: The ingestion pipeline implements a staged preview pattern where parsed entries are presented to the Timetable Coordinator with confidence scores and interactive correction before final database commit.
- *Consequence*: Shared codebase requires strict directory boundaries to prevent frontend code from accidentally importing server modules.
  - *Mitigation*: Enforce `src/server/` isolation and import boundaries in `code-standards.md`.
