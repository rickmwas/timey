# AI Agent & Developer Workflow Protocol — Timy

## 1. Core Operating Philosophy
Any AI agent or engineer contributing to Timy must act as a disciplined senior software engineer. Code generation without deep architectural alignment, specification verification, or testing is strictly prohibited.

---

## 2. The Standard Engineering Cycle
Every task or feature must follow this strict sequential lifecycle:

```text
1. Understand  --> Read user request, project vision in AGENTS.md & domain context
2. Inspect     --> Check existing code, types, migrations, and current progress.md
3. Plan        --> Verify or draft specification in docs/specs/ & outline steps
4. Implement   --> Write typed, tested, atomic increments adhering to code-standards.md
5. Validate    --> Run test suite, verify types (tsc), and check linting
6. Review      --> Audit code against acceptance criteria and security checks
7. Document    --> Record architectural pivots in docs/decisions/ or specs
8. Update      --> Record milestone progress in progress.md before finishing
```

---

## 3. The 15 Golden Rules of Engagement

1. **Read Context First**: Always read `AGENTS.md`, `architecture.md`, and `progress.md` at the start of any new session or feature task.
2. **Consult Feature Specs**: Before implementing any business logic, inspect the corresponding feature specification under `docs/specs/`. If no spec exists, ask or write one first.
3. **Inspect Before Modifying**: Never propose changes to an existing file without viewing its contents and inspecting its surrounding imports and usage.
4. **No Phantom Architecture**: Do not invent new APIs, mock database schemas, ad-hoc state managers, or new dependencies unless recorded in an approved Technology Decision Record (`docs/decisions/`).
5. **No Unnecessary Rewrites**: Keep edits surgical, incremental, and localized. Do not re-format or rewrite working modules unless explicitly tasked with refactoring.
6. **Preserve Existing Functionality**: Ensure existing tests pass before adding new code. Never break working student, lecturer, or admin workflows.
7. **Type-Safety Is Non-Negotiable**: Never use `any` or disable TypeScript lint checks. If external input is unknown, validate it with Zod.
8. **Deterministic Conflict Checking**: Never write timetable insertion or update logic that bypasses the `ConflictEngine`.
9. **Role-Based Security by Default**: Every API endpoint and Server Action must explicitly enforce authentication and verify user permissions (`STUDENT`, `LECTURER`, `ADMIN`, `TIMETABLE_OFFICER`).
10. **Validate Inputs at Boundaries**: All request bodies, route params, query strings, and imported file rows must be validated with Zod before processing.
11. **Run Tests After Changes**: Execute relevant unit/integration tests (`npm run test` or `vitest run`) after any code modification.
12. **Synchronize Documentation**: Whenever an API contract, schema, or system behavior changes, update the corresponding markdown documents immediately.
13. **Keep `progress.md` Truthful**: Accurately update the progress tracker with what was completed, what is in progress, and any discovered blockers. Never mark incomplete tasks as done.
14. **Highlight Assumptions Explicitly**: If a requirement is ambiguous or unspecified in the proposal, document the assumption in `docs/specs/` and announce it to the user.
15. **Respect Developer Ownership Boundaries**: Follow the team matrix in `AGENTS.md`. Do not duplicate work across frontend/backend boundaries without proper contract definitions.

---

## 4. Operational Skill Integration
The repository includes installed engineering skills (`.agents/skills/`):
- `/scope`: Run to define new slices, enroll features, or reconcile project scope.
- `/architect`: Run when making architectural stack or design decisions; records to `docs/specs/`.
- `/develop`: Run when implementing approved specifications into real code.
- `/check`: Run `/check verify` to prove behavior against spec, or `/check review` for senior code review.
- `/test`: Run to generate unit and regression tests for recent changes.
- `/debug`: Run to localize, reproduce, and fix failing tests or scheduling conflicts.
- `/sync`: Run to update durable knowledge, AGENTS.md, and progress.
