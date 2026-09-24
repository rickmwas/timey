# Code Standards & Engineering Guidelines — Timy

## 1. General Principles
- **Explicit over Implicit**: Code should be readable without guessing hidden magic or implicit global variables.
- **Fail Fast & Explicitly**: Validate all inputs at runtime using Zod before passing to internal services.
- **Strict Typing**: TypeScript `strict` mode is mandatory. Never use `any`. Use `unknown` with type guards or schemas when types are undetermined.
- **Zero Architectural Leakage**: UI components must never query Prisma directly. All DB operations belong in `src/server/services/` or `src/server/repositories/`.

---

## 2. Directory & File Organization
All application code resides under `src/`:

```text
src/
├── app/                  # Next.js App Router (pages, layouts, route handlers)
│   ├── (auth)/           # Route group for login, password reset
│   ├── (dashboard)/      # Route group for authenticated portal views
│   │   ├── student/      # Student-specific screens
│   │   ├── lecturer/     # Lecturer management screens
│   │   └── admin/        # Timetable coordinator & admin screens
│   └── api/              # HTTP API Route Handlers (/api/v1/...)
├── components/           # Reusable React components
│   ├── ui/               # Design-system primitives (Button, Modal, Input, Badge)
│   ├── timetable/        # Timetable grids, slot cards, filters, conflict banners
│   ├── venue/            # Venue occupancy indicators, floor maps
│   └── shared/           # Header, Sidebar, NotificationDropdown, LoadingSkeletons
├── lib/                  # Utilities, auth helpers, formatting, config
│   ├── auth.ts           # NextAuth/JWT options and session retrieval
│   ├── db.ts             # Prisma client singleton
│   ├── date-utils.ts     # Day of week, academic calendar & time helpers
│   └── utils.ts          # Classnames/tailwind-merge helper
├── server/               # Pure backend domain logic (isolated from React)
│   ├── services/         # TimetableService, ConflictEngine, IngestionPipeline
│   ├── schemas/          # Zod validation schemas shared between client & server
│   └── types/            # Domain & DTO TypeScript interfaces
└── hooks/                # Custom React client hooks
```

---

## 3. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| **Files (Components)** | PascalCase | `TimetableGrid.tsx`, `VenueBadge.tsx` |
| **Files (Utilities / Hooks / Services)** | kebab-case | `timetable-service.ts`, `use-timetable.ts` |
| **Folders** | kebab-case | `conflict-detection/`, `student-views/` |
| **React Components** | PascalCase | `function ScheduleCard({ entry }: Props)` |
| **TypeScript Types & Interfaces**| PascalCase | `TimetableSlot`, `ConflictReport` |
| **Functions & Methods** | camelCase | `calculateConflicts()`, `resolveCohort()` |
| **Variables & Object Keys** | camelCase | `startTime`, `hasClash` |
| **Constants / Enums** | UPPER_SNAKE_CASE | `MAX_FILE_SIZE_BYTES`, `DAYS_OF_WEEK` |
| **Database Tables / Models** | PascalCase (Prisma) | `model TimetableEntry { ... }` |
| **Database Columns** | camelCase (Prisma schema) | `startTime`, `academicYearId` |

---

## 4. TypeScript & Validation Rules

### 4.1 Strict Typing
- Never write `any`. If parsing external or unknown data, type it as `unknown` and validate immediately:
  ```ts
  // BAD:
  function parseRow(data: any) { ... }

  // GOOD:
  function parseRow(data: unknown): TimetableRowDTO {
    return TimetableRowSchema.parse(data);
  }
  ```
- All exported functions and service methods must specify explicit return types.

### 4.2 Zod Schemas as Single Source of Truth
Define validation schemas in `src/server/schemas/` and infer TypeScript types directly:
```ts
import { z } from "zod";

export const CreateTimetableEntrySchema = z.object({
  courseUnitId: z.string().uuid(),
  venueId: z.string().uuid(),
  lecturerId: z.string().uuid().optional(),
  cohortId: z.string().uuid(),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format must be HH:MM"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format must be HH:MM"),
  academicPeriodId: z.string().uuid(),
}).refine(data => data.startTime < data.endTime, {
  message: "Start time must precede end time",
  path: ["endTime"],
});

export type CreateTimetableEntryInput = z.infer<typeof CreateTimetableEntrySchema>;
```

---

## 5. API Design & Response Envelope
All API Route Handlers must return responses wrapped in the standard API envelope:

```ts
export type ApiResponse<T> =
  | {
      success: true;
      data: T;
      message?: string;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    };
```

HTTP Status Codes to follow:
- `200 OK`: Successful read or update.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure (Zod error details attached).
- `401 Unauthorized`: Not authenticated.
- `403 Forbidden`: Authenticated, but lacking role permission.
- `404 Not Found`: Entity not found.
- `409 Conflict`: Business rule or timetable scheduling conflict.
- `500 Internal Server Error`: Unexpected unhandled error.

---

## 6. Error Handling
- Never silently swallow errors in `catch` blocks.
- Throw custom `AppError` instances with known codes:
  ```ts
  export class AppError extends Error {
    constructor(
      public readonly code: string,
      message: string,
      public readonly statusCode: number = 400,
      public readonly details?: unknown
    ) {
      super(message);
      this.name = "AppError";
    }
  }
  ```

---

## 7. Database & Transaction Guidelines
- All database operations are done via the Prisma singleton (`import { prisma } from "@/lib/db"`).
- Any multi-entity mutation (such as committing a batch of timetable entries or processing an ingestion job) **must** run within a Prisma transaction (`prisma.$transaction`).
- Always create database indexes on foreign keys and frequently queried fields (`[cohortId, dayOfWeek]`, `[venueId, dayOfWeek]`, `[lecturerId, dayOfWeek]`).

---

## 8. React & Component Standards
- Components must be functional components with typed props.
- Keep components focused: one responsibility per component. If a component exceeds 150 lines, decompose it into smaller sub-components.
- Use Server Components (`RSC`) by default in the `app/` directory for data fetching. Add `"use client"` only when interactivity, local state, or browser APIs are required.
- Do not make direct client-side fetch calls in `useEffect` without proper caching or error boundaries. Prefer TanStack Query / React Query or Server Actions.

---

## 9. Testing & Git Commit Rules
- Unit test all pure logic (parsers, conflict detection, time calculations) using Vitest. Target 85%+ coverage on `src/server/services/`.
- Commit message format following Conventional Commits:
  - `feat(timetable): add venue clash detection engine`
  - `fix(parser): handle trailing spaces in course codes`
  - `docs(arch): add data flow diagram`
  - `test(conflict): verify boundary timeslot overlap logic`
- Branch naming: `feat/<developer-id>-<feature-description>` (e.g. `feat/dev1-student-grid`).
