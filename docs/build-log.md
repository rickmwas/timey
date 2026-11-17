# Timy backend build log

## Audit entry: 2026-09-29

### Repository snapshot
- Branch: master tracking origin/master
- Modified tracked files: .env.example, package-lock.json, package.json, prisma/schema.prisma, tsconfig.json
- Untracked files: .eslintrc.json, docs/decisions.md, next-env.d.ts, prisma/migrations/, prisma/seed.ts, src/app/api/, src/server/, tests/, vitest.config.ts
- Recent git log:
  - afee29a chore: ignore tsbuildinfo cache files
  - 214b874 feat(core): initialize minimal baseline setup, Prisma relational schema, and dependencies
  - 0c1bcc3 docs: advance project lifecycle to Phase 1 (Core Scaffolding & Data Modeling)
  - 486b8cd docs: establish context-driven development foundation and engineering specs

### Prompt audit
- Search for the original prompt titled "Timy Backend: Agent Build Prompt" in the repo root, docs, prompts, and .agents returned no match.
- Based on the repo documentation and the prompt included in this session, the project defaults were reconstructed from AGENTS.md, architecture.md, docs/scope/mvp-scope.md, docs/specs/SPEC-001 to SPEC-004, and prisma/schema.prisma.

### Health checks performed
1. `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/timy_test npm run test:integration`
   - Initial result on 2026-09-29: failed with exit code 1 after connecting to the live PostgreSQL listener. Vitest reported `No test files found` for filter `tests/integration`; the repository had no integration tests.
   - Repair: added a PostgreSQL integration check for connection and required schedule, import, notification, and announcement tables. The post-repair result will be recorded after execution.
2. `npx prisma validate`
   - Result: failed immediately with `Environment variable not found: DATABASE_URL.`
3. `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/timy_test; npx prisma validate; npx prisma generate; npx prisma migrate status`
   - Result: schema valid; Prisma client generated successfully; migration status failed with `P1001: Can't reach database server at localhost:5432`.
4. `npm run typecheck; npm run lint`
   - Initial result: failed on route field mismatch (`cohortId` not found on TimetableEntry selects).
   - After fix: typecheck passed and lint passed.
5. `npm run test:unit -- --run tests/unit`
   - Result: passed, 5 files, 17 tests.

### Stabilization work completed
- Fixed the timetable route contract mismatch by loading `cohortId` from the related offering instead of directly from `TimetableEntry`.
- Added working scheduling domain utilities and new tests for boundary overlap and schedule mutation validation.
- Verified the backend foundation and scheduling logic are green under unit tests.

### Current status
- Foundation: partial to complete, depending on whether the local Postgres state is available.
- Scheduling domain: implemented and unit-tested.
- Full pilot readiness: not yet achieved; persisted migration and integration checks still need a live PostgreSQL instance and broader endpoint coverage.

### Notes
- The local Postgres server is not running, so migration and integration validation are blocked until a DB is started or the env is pointed at an available instance.
- The repo is not yet in final phase-complete state against the full 11-phase checklist in the build prompt.

## Integration rerun: 2026-09-29

- Command: `$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5432/timy_test'; npm run test:integration`
- First attempt at 08:00:41 failed: `PrismaClientInitializationError: Can't reach database server at localhost:5432` (1 test failed).
- Restarted the existing local cluster with `pg_ctl -D .postgres-data -l .postgres-data/server.log start`.
- Readiness check: `pg_isready -h localhost -p 5432` reported `localhost:5432 - accepting connections`.
- Rerun at 08:02:33 passed: 1 test file, 1 test passed, duration 4.07s.
- Vitest emitted a non-failing Vite config-loader warning about ESM syntax in `vitest.config.ts`.
- This verifies database connectivity and required table presence only; it does not constitute schedule-write concurrency or broader feature integration coverage.
