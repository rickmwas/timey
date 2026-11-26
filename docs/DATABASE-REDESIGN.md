# TIMEY — Database Architecture Redesign & Academic Domain Specification

## 1. Domain Overview & Problem Statement
The legacy Timey data schema featured a flattened, brittle academic structure where:
1. `School` existed solely as a raw text string on `Department`.
2. Degree programmes (e.g. B.Sc. Software Engineering vs B.Sc. Computer Science) were bypassed entirely, with `Cohort` linked directly to `Department`.
3. `Student` was hardcoded to a single `Cohort`, making individual course registrations, electives, and carryover/retake units impossible.
4. Lecturers existed only as foreign keys on physical timetable slots (`TimetableEntry`), without an independent `TeachingAssignment` record.
5. Role authorization lacked `COD` (Chair/Head of Department) and `DEAN` (Dean of School), preventing departmental and school-level data isolation.

## 2. University Academic Hierarchy
The updated domain model enforces the true university operational structure:

```
University
  └── School (e.g. School of Information Science and Technology)
        └── Department (e.g. Department of Computing Sciences)
              ├── Programme (e.g. IN16 - B.Sc. Software Engineering)
              │     └── Cohort (e.g. IN16-Y2)
              └── Course / CourseUnit (e.g. COMP 210 - Data Structures)
                    └── CourseOffering (Academic Period: 2026/2027 Sem 1)
                          ├── TeachingAssignment (Lecturer allocated by COD)
                          ├── TimetableEntry (Venue, Day, Time)
                          └── StudentEnrollment (Regular, Elective, Retake)
```

## 3. New Models & Relational Design

### 3.1 School
- `id`: UUID Primary Key
- `code`: Unique institutional code (e.g. `SCIT`)
- `name`: Full school name
- `description`: Optional text
- `isActive`: Boolean flag

### 3.2 Programme & ProgrammeCourse
- `Programme`: Represents academic qualifications with `degreeLevel` (`CERTIFICATE`, `DIPLOMA`, `UNDERGRADUATE`, `POSTGRADUATE`, `DOCTORAL`) and `durationYears`.
- `ProgrammeCourse`: Represents curriculum matrices (core vs elective per year and semester).

### 3.3 TeachingAssignment
- Connects `CourseOffering` and `User` (Lecturer) independently of physical timetable entries.
- Fields: `role` (`PRIMARY`, `CO_LECTURER`, `ASSISTANT`, `LAB_INSTRUCTOR`), `workloadHours`, `status` (`ASSIGNED`, `CONFIRMED`, `DECLINED`), `assignedById`.

### 3.4 StudentEnrollment
- Connects `User` (Student) and `CourseOffering` for an `AcademicPeriod`.
- Fields: `status` (`ENROLLED`, `DROPPED`, `COMPLETED`, `AUDIT`), `enrollmentType` (`REGULAR`, `ELECTIVE`, `RETAKE`).
- Allows personalized timetable queries for students taking units across streams.

### 3.5 OutboxEvent
- Transactional outbox table to guarantee at-least-once delivery of notifications, Web Push, and SSE broadcasts without executing side-effects inside database transactions.
- Fields: `aggregateType`, `aggregateId`, `eventType`, `payload`, `status` (`PENDING`, `PROCESSING`, `PUBLISHED`, `FAILED`), `attempts`, `nextRetryAt`.

### 3.6 ClassReminderLog
- Idempotency ledger for automated class alarms.
- Composite unique key: `@@unique([entryId, occurrenceDate, windowType])`.

### 3.7 CourseAlias & LecturerAlias
- Institutional dictionaries mapping spelling variants and abbreviations to canonical entities.

## 4. Additive Migration Strategy
All changes were applied non-destructively:
- No existing columns were dropped.
- Foreign keys added to existing tables (`schoolId` on `Department`, `programmeId` on `Cohort`, `schoolId` on `User`) are nullable.
- SQL migration script: `prisma/migrations/20261118180000_academic_domain_expansion/migration.sql`.
