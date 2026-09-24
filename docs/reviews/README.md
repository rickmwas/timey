# Engineering Reviews & Postmortems — Timy

This directory records historical engineering reviews, security audits, and postmortem analyses.

## Review Types & Triggers:
1. **Architecture Review**: Conducted before implementing major infrastructure (e.g. Ingestion Pipeline, Conflict Engine).
2. **Code Review**: Run via `/check review` before merging substantial feature pull requests.
3. **Verification Audit**: Run via `/check verify` to prove implementation behavior against spec acceptance criteria.
4. **Postmortem Analysis**: Required whenever a regression, parsing error, or scheduling clash escapes into the main branch.

---

## Review Record Template

```markdown
# [TYPE]-00X: Title of Review or Investigation
- **Date**: YYYY-MM-DD
- **Reviewer(s)**: [Developer / Lead]
- **Target Component / PR**: [e.g., Ingestion Pipeline / PR #12]
- **Outcome**: APPROVED | NEEDS_REVISION | REJECTED

### 1. Scope of Investigation
[What was evaluated and why]

### 2. Findings & Identified Risks
- **Issue 1**: [Description, severity, impact]
- **Issue 2**: [Description, severity, impact]

### 3. Verification Evidence
[Test results, logs, or benchmark metrics]

### 4. Required Action Items
- [ ] Action 1 (Owner: Dev X)
- [ ] Action 2 (Owner: Dev Y)
```
