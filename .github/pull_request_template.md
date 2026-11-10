## Description
<!-- Provide a clear, concise summary of the changes introduced in this pull request. -->

---

## Team Ownership & Role
<!-- Identify which developer role owns this change per AGENTS.md Section 3 -->
- [ ] **Dev 1 (Frontend)**: Student UX, Mobile Views, PWA & Offline Cache
- [ ] **Dev 2 (Frontend)**: Admin/COD/Officer Portal, Lecturer UI, Venue Booking UI
- [ ] **Dev 3 (Backend)**: Auth/RBAC, Prisma Schema, Core CRUD, Conflict Detection Engine
- [ ] **Dev 4 (Platform/Ops)**: Ingestion Pipeline, Notification Engine, CI/CD, DevOps

---

## Related Specification & Tracking
- **Spec**: `docs/specs/SPEC-00X-....md` <!-- e.g., SPEC-001, SPEC-002, SPEC-003, SPEC-004 -->
- **Milestone / Task**: <!-- e.g., Milestone 1.3, Milestone 1.4 -->

---

## Golden Rules Checklist
- [ ] **Read Spec First**: Read the corresponding feature specification in `docs/specs/` before writing code.
- [ ] **Strict Typing**: Zero `any` types introduced.
- [ ] **Validation at Boundaries**: All API routes and server mutations validated with Zod schemas.
- [ ] **Conflict Invariant**: Timetable slot updates do not bypass the Conflict Detection Engine.
- [ ] **Database Integrity**: Prisma migrations included if schema was modified.
- [ ] **Progress Updated**: `progress.md` updated with completed tasks and any newly introduced blockers.

---

## Type of Change
- [ ] 🚀 New feature (non-breaking change adding functionality)
- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] ⚡ Performance optimization
- [ ] 🛠️ DevOps / CI/CD / Configuration
- [ ] 📝 Documentation update
- [ ] 🗄️ Database migration / Seed update

---

## Verification & Testing
<!-- Describe the tests performed to verify these changes -->
- [ ] `npm run lint` passes (0 errors, 0 warnings)
- [ ] `npm run typecheck` passes (0 TypeScript errors)
- [ ] `npm test` passes (all unit and integration tests green)
- [ ] `npm run build` succeeds cleanly
- [ ] Manual verification performed (attach screenshot or video if UI change)

---

## Screenshots / Evidence (if applicable)
<!-- Attach screenshots, screen recordings, or terminal logs proving working behavior -->
