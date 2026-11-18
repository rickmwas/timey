# TIMEY — UX Architecture & Role-Specific Workflows

## 1. Visual Direction & Design System ("Timy DS")
The user interface reflects a prestigious, contemporary university platform tailored for Kisii University:
- **Primary Institutional Color**: Kisii Deep Navy (`#0d1b3e` / `#1a2f5c`).
- **Academic Accent Color**: Kisii University Crest Gold (`#c59b27` / `#dfb547`).
- **Typography Hierarchy**: Headers in `DM Serif Display` for institutional heritage; body and console in `Inter`; codes (unit, venue, reg number) in system monospace.
- **Tri-State Schedule Awareness**: In-Session (`currentClass`), Upcoming Countdown (`nextClass`), and Free Time / Completed states.

## 2. Role-Specific User Journeys

### 2.1 Student Journey
- **Home Dashboard**: Displays current lecture with live elapsed/remaining countdown, next class, and daily agenda.
- **Offline Resilience**: Timetable cached locally in IndexedDB / LocalStorage with synchronization timestamps.
- **Notifications**: Audio chime alarms and Web Push at 30-minute and 10-minute thresholds.
- **Schedule Views**: Daily agenda, full weekly matrix, and unit details.

### 2.2 Lecturer Journey
- **Teaching Studio**: Weekly schedule of assigned lectures, enrolled cohorts, and allocated venues.
- **Schedule Changes**: Authorized rescheduling, postponements, and cancellations with reason documentation and impact notification.

### 2.3 Chair of Department (COD) Workspace
- **Departmental Cockpit**: Overview of department programmes, student cohorts, active course offerings, and teaching staff roster.
- **Teaching Staff Allocation Matrix**: Monitors teaching load and contact hours per faculty member.
- **Change Approval Queue**: Real-time audit of cancellations, postponements, and room moves affecting department courses.

### 2.4 Timetable Officer Workspace
- **Master Timetable Manager**: Multi-format file ingestion (CSV, multi-sheet XLSX, PDF).
- **Ambiguity & Conflict Intelligence**: Live multi-dimensional conflict detection across room collisions, faculty clashes, cohort overlaps, and venue capacity constraints.
- **Publishing**: Atomic transition from staged entries to published master timetable.

### 2.5 Institution Administrator
- **Platform Diagnostics & Health**: Relational database status, Web Push configuration, cron heartbeat, and security middleware audit.
- **Academic Period Control**: Semester opening, closing, and calendar dates.
- **Audit Ledger**: Immutable event trail tracking all administrative actions.
