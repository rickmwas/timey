# Backend Implementation Decisions

This file records implementation defaults selected by the backend build prompt.

| Decision | Selected value | Reason |
|---|---|---|
| Application architecture | Next.js 14 App Router, route handlers, TypeScript, Prisma, PostgreSQL, Zod | Existing project stack and implementation prompt. |
| Roles | `STUDENT`, `LECTURER`, `TIMETABLE_OFFICER`, `ADMIN`; admin inherits officer permissions | Explicit product decision. |
| Account provisioning | Admin-only creation, generated one-time temporary password, forced password change | No self-registration or external identity verification is in scope. |
| Password hashing | `bcryptjs`, cost 12 | Explicit security decision. |
| Sessions | 15-minute signed access cookie and rotating, persisted, hashed refresh session with 7-day expiry | Allows revocation and replay detection. |
| Time handling | University local time `Africa/Nairobi`; instants stored as UTC | Explicit product decision. |
| Schedule changes | Recurring entry is immutable template; changes are dated overrides | Supports one-occurrence cancellation/rescheduling. |
| Conflict policy | Venue, lecturer, and cohort conflicts block writes; no override | Prevents schedule inconsistency. |
| Conflict concurrency | PostgreSQL serializable transaction with bounded retry | Keeps conflict check and write atomic. |
| Interval semantics | Half-open intervals; adjacent meetings do not conflict | Standard interval behavior specified by the product prompt. |
| Days | Monday through Sunday | Explicit product decision. |
| Announcement audience | Cohort and course offering; no individual enrollment | Enrollment is out of scope. |
| Notifications | In-app only; notification rows created transactionally | Email, push, and SMS are out of scope. |
| File storage | Local filesystem adapter outside the web root, configured by `STORAGE_LOCAL_DIR` | Required interface with no external storage provider. |
| Import formats | CSV and XLSX only; PDF is out of scope | MVP scope and implementation prompt. |
| XLSX parser | ExcelJS | Supports workbook parsing in the existing Node.js stack. |
| CSV parser | PapaParse | Supports strict tabular parsing. |
| Lint stack | ESLint 8 with `eslint-config-next` 14 | Compatible with the project's Next.js 14 `next lint` command. |
| Security advisories | Keep the required Next 14 major; latest compatible patch used. Remaining advisory recorded as a production risk pending approved major upgrade. | Prompt prohibits a Next major upgrade. |

The production audit still reports a critical advisory affecting Next.js 14. The project must not be deployed publicly until the team approves a compatible patched major version or verifies an available supported mitigation.

| Decision | Selected value | Reason |
|---|---|---|
| Original build prompt location | Not found in repo root, docs, or prompts directory | The prompt text was unavailable in the repository, so the resume used the repository specification and the attached prompt as the reference. |
| PostgreSQL testing runtime | Local PostgreSQL started from the installed PostgreSQL toolkit | Required to validate DB-backed phases against a live database instead of relying only on unit tests. |
| Cohort lookup for timetable entries | Resolve `cohortId` from the related `CourseOffering` record | The `TimetableEntry` model does not store a direct `cohortId`, and this is the correct relational path. |
| Time overlap semantics | Half-open interval check with `A.start < B.end && A.end > B.start` | Matches the product requirement and the conflict engine tests. |
| Venue availability query semantics | Filter venues by capacity and optional building, then exclude overlapping active slots | Keeps the API aligned with the conflict and availability specification. |
| Schedule-change classification | Time changes prefer `TIME_RESCHEDULE`; venue-only changes prefer `VENUE_SWAP` | Produces a clear audit trail for change events. |
| In-memory rate limiter | Interface + in-memory implementation | Keeps the pilot scope within a single-instance design until a shared store is introduced. |
| OpenAPI contract | Partial API surface stored in `openapi.yaml` | Required to document the current implementation while the build remains in progress. |
| Schedule replacement date | Store `replacementDate` on a dated override; `occurrenceDate` remains the original occurrence date | Supports moving a one-off class to another calendar date without mutating the recurring timetable template. |
| Postponement semantics | A postponement requires a replacement calendar date; replacement time and venue may be omitted while it remains TBD | Follows the spec's postponed-to-a-later-date/time-TBD behavior and keeps the original recurring slot intact. |
| Schedule write idempotency | Use a caller-supplied `Idempotency-Key`, persist it with the override, and enforce uniqueness in PostgreSQL | Makes safe retries explicit while preserving immutable `ScheduleChange` history. |
| Import checksum | SHA-256 of the uploaded bytes, unique within the academic period | Rejects duplicate source files deterministically. |
| Import publish version | Require the current `ImportJob.version` and increment it on row correction or publish/discard | Prevents stale previews from publishing or overwriting newer corrections. |
| Announcement visibility | Students see active, unexpired announcements for their cohort; offering announcements resolve visibility through the student's cohort | Enrollment-level targeting is out of MVP scope. |
| Announcement archive | Archive is an explicit timestamped mutation; expired announcements are hidden by query and may be archived by the maintenance operation | Expiry should not require a read request to mutate data. |