# SPEC-001: Authentication & Role-Based Access Control (RBAC)

- **Module**: Identity & Access Management
- **Owner**: Dev 3 (Backend/Systems)
- **Status**: APPROVED

---

## 1. Purpose & Scope
Provide secure authentication and role-based authorization for Timy users at Kisii University:
1. Students (authenticated via student registration number e.g. `IN16/00015/24` or email).
2. Lecturers (authenticated via university email or staff number).
3. Timetable Coordinators & Administrators (authenticated via administrative credentials).

---

## 2. Actors & Permissions
- **`STUDENT`**: Read-only access to own cohort's timetable, venue availability lookups, receiving notifications and class announcements.
- **`LECTURER`**: View teaching timetable, request/execute venue swaps and time reschedules for assigned course units, post announcements to enrolled classes.
- **`TIMETABLE_OFFICER`**: Full timetable management (upload, stage, preview, publish, edit, delete), conflict overrides, venue creation and updates.
- **`ADMIN`**: User account management, role assignment, system audit logs.

---

## 3. Data Model Schema Requirements (Prisma)
```prisma
enum Role {
  STUDENT
  LECTURER
  TIMETABLE_OFFICER
  ADMIN
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  identifier    String    @unique // Registration No (e.g. IN16/00015/24) or Staff No
  fullName      String
  passwordHash  String
  role          Role      @default(STUDENT)
  cohortId      String?   // Linked cohort for Students (e.g. BSc SE Year 2)
  departmentId  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  cohort        Cohort?        @relation(fields: [cohortId], references: [id])
  department    Department?    @relation(fields: [departmentId], references: [id])
  notifications Notification[]
}
```

---

## 4. API Endpoints
- `POST /api/v1/auth/login`: Validates credentials (`identifier` + `password`), returns HTTP-only secure JWT session cookie.
- `POST /api/v1/auth/logout`: Clears session cookie.
- `GET /api/v1/auth/me`: Returns current authenticated user profile, cohort, and role.

---

## 5. Security & Session Invariants
1. Passwords must be hashed using `bcrypt` (cost 12) or `argon2id`.
2. Session cookies must be `HttpOnly`, `Secure` in production, `SameSite=Lax`.
3. API routes under `/api/v1/admin/*` and `/api/v1/ingest/*` must reject non-admin/officer tokens with `403 Forbidden`.
4. Password reset tokens must expire after 15 minutes.

---

## 6. Acceptance Criteria
- [ ] Student can log in with either registration number (`IN16/00015/24`) or email.
- [ ] Protected student routes redirect unauthenticated users to `/login`.
- [ ] Attempting to access admin ingestion endpoints with a student token returns `403 Forbidden`.
- [ ] Session persists across page refreshes.
- [ ] Password hashes are never returned in any API response or profile endpoint.
