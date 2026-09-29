# API Reference

The machine-readable route contract is [openapi.yaml](../openapi.yaml). All application routes use the `/api/v1` prefix except the readiness endpoint at `/api/health`.

| Area | Routes |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `PATCH /auth/password` |
| Admin | `GET/POST /admin/users`, `PATCH /admin/users/{id}`, `POST /admin/users/{id}/deactivate`, `GET /admin/audit-logs` |
| Timetables | `GET /timetables/me`, `POST /timetables/validate-slot`, `GET /timetable-entries`, `GET /timetable-entries/{id}` |
| Schedule changes | `POST /timetable-entries/{id}/reschedule`, `/cancel`, `/postpone` |
| Venues | `GET/POST /venues`, `PATCH/DELETE /venues/{id}`, `GET /venues/availability` |
| Imports | `GET/POST /imports`, `GET /imports/{id}`, `PATCH /imports/{id}/rows/{rowId}`, `POST /imports/{id}/validate`, `/publish`, `/discard` |
| Notifications | `GET /notifications`, `PATCH /notifications/{id}/read`, `POST /notifications/mark-all-read` |
| Announcements | `GET/POST /announcements`, `PATCH/DELETE /announcements/{id}` |

Protected routes use the `timy_access` cookie. Mutations using cookies require same-origin headers. Schedule changes require `Idempotency-Key`; import state changes require `expectedVersion`.