# AGENTS.md — System Master Context

## 1. Project Overview & Identity
- **Project Name**: Timy (Academic Timetable and Venue Management System)
- **Institution**: Kisii University (School of Information Science and Technology, Dept. of Computing Sciences)
- **Team**: Group 26 (4 Developers: Dev 1 Frontend Student, Dev 2 Frontend Admin/Lecturer, Dev 3 Backend/Systems, Dev 4 Backend/Platform/DevOps)
- **Supervising Faculty**: Dr. Gordon Ouma
- **Core Purpose**: Transform unstructured institutional timetable schedules (PDF, Excel, CSV, manual entries) into validated, conflict-free, relational, searchable, and personalized schedules with real-time change notifications.
- **Repository Location**: `c:\Users\rickm\OneDrive\Desktop\timy`

---

## 2. Core Problem We Are Solving
In universities like Kisii University, class scheduling changes, venue swaps, cancellations, and postponements occur continuously throughout each semester. Currently:
1. Changes circulate haphazardly via unofficial WhatsApp groups, class reps, verbal remarks, and screenshots.
2. Students arrive at wrong lecture halls (e.g., LH 26) or miss rescheduled classes entirely.
3. Lecturers double-book rooms because there is no synchronized venue availability check.
4. Timetable coordinators lack automated conflict validation.

**Timy** eliminates this breakdown by providing an institutional single source of truth for all lecture sessions, venues, lecturer assignments, and instant notifications to affected cohorts.

---

## 3. Team Structure & Ownership Matrix

| Area / Workstream | Dev 1 (Frontend) | Dev 2 (Frontend) | Dev 3 (Backend) | Dev 4 (Platform/Ops) |
|---|:---:|:---:|:---:|:---:|
| **Student UX & Mobile Views** | **Primary** | - | Support (API) | - |
| **PWA & Offline Schedule Cache** | **Primary** | - | - | Support |
| **Admin / COD / Timetable Officer UX** | - | **Primary** | Support (API) | - |
| **Lecturer Management Portal UX** | - | **Primary** | Support (API) | - |
| **Venue Availability Grid & Booking UI**| - | **Primary** | Support (API) | - |
| **Auth, RBAC & Session Management** | Client Integration | Client Integration | **Primary** | Security Review |
| **Relational Data Model & Prisma ORM** | - | - | **Primary** | Review |
| **Core Timetable CRUD & Rescheduling Logic** | - | - | **Primary** | - |
| **Venue Conflict Detection Engine** | - | - | **Primary** | Support |
| **Ingestion Pipeline (PDF/Excel Parser)** | - | File Upload UI | Support | **Primary** |
| **Normalization, Mapping & Staging** | - | - | Support | **Primary** |
| **Notification Engine (In-App / Email / Push)** | Toast / Feed UI | Feed UI | Trigger Hooks | **Primary** |
| **CI/CD, Docker & Deployment Setup** | - | - | - | **Primary** |
| **Automated Testing (Unit, E2E, Regress)** | Component Tests | Component Tests | API / Service Tests | E2E / Ingestion Tests |

---

## 4. Key Documentation Index
- [architecture.md](file:///c:/Users/rickm/OneDrive/Desktop/timy/architecture.md): System topology, data flow, ingestion pipeline, entity relationships, and security architecture.
- [code-standards.md](file:///c:/Users/rickm/OneDrive/Desktop/timy/code-standards.md): Code conventions, naming standards, error formatting, validation schemas, and TypeScript rules.
- [ai-workflow.md](file:///c:/Users/rickm/OneDrive/Desktop/timy/ai-workflow.md): Rules of engagement for AI coding assistants and developers.
- [design.md](file:///c:/Users/rickm/OneDrive/Desktop/timy/design.md): Design tokens, typography, visual hierarchy, and university theme principles.
- [ui-registry.md](file:///c:/Users/rickm/OneDrive/Desktop/timy/ui-registry.md): Reusable UI component specifications and layout patterns.
- [progress.md](file:///c:/Users/rickm/OneDrive/Desktop/timy/progress.md): Live tracker of phases, milestones, active tasks, and blockers.
- [docs/decisions/](file:///c:/Users/rickm/OneDrive/Desktop/timy/docs/decisions/): Technology Decision Records (TDRs).
- [docs/scope/](file:///c:/Users/rickm/OneDrive/Desktop/timy/docs/scope/): Scope boundaries (MVP vs. Phase 2 vs. Future).
- [docs/specs/](file:///c:/Users/rickm/OneDrive/Desktop/timy/docs/specs/): Technical specifications for each feature.
- [docs/reviews/](file:///c:/Users/rickm/OneDrive/Desktop/timy/docs/reviews/): Architecture, code review, and postmortem records.

---

## 5. Technology Stack Summary
- **Frontend**: Next.js 14+ (App Router), React 18+, TypeScript, Tailwind CSS, Lucide Icons, TanStack Query, Radix UI primitives.
- **Backend / API**: Next.js API Routes / Server Actions, Node.js runtime, Zod validation.
- **Database & ORM**: PostgreSQL with Prisma ORM (relational integrity, foreign key cascades, migration history).
- **File Parsing & Ingestion**: SheetJS (`xlsx`) for Excel/CSV; `pdf-parse` / `pdf2json` with tabular normalization for PDF ingestion.
- **Authentication**: NextAuth.js / Jose JWT with strict Role-Based Access Control (`STUDENT`, `LECTURER`, `ADMIN`, `TIMETABLE_OFFICER`).
- **Notifications**: In-App notification feed (Database-backed), Web Push API / Service Workers, Email via Resend/Nodemailer.
- **Testing**: Vitest for unit & integration testing, Playwright for end-to-end user journey validation.

---

## 6. Golden Rules for Developers & AI Agents
1. **Never build features without reading the corresponding spec in `docs/specs/`.**
2. **Never break type-safety or introduce untyped `any`.**
3. **Always validate incoming payloads using Zod schemas at API boundaries.**
4. **Never bypass conflict detection when assigning or updating a timetable slot.**
5. **Always update `progress.md` before concluding any session.**
