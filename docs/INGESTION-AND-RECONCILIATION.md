# TIMEY — Timetable Ingestion, Reconciliation & Scheduling Engine Specification

## 1. Multi-Format Ingestion Pipeline
The ingestion pipeline supports university timetable files across CSV, XLSX, and PDF:

1. **CSV Parser**: PapaParse with UTF-8 verification, null-byte rejection, and ZIP/XLSX masquerading detection.
2. **Multi-Sheet XLSX Parser**: ExcelJS workbook traversal. Automatically scans across all worksheets in a workbook (e.g. separate sheets per department or study year), extracting tabular grids and converting Excel serial time values.
3. **PDF Ingestion & Scanned Document Detection**:
   - Inspects `%PDF-` binary signature.
   - Heuristically assesses character density. Scanned photocopies lacking selectable vector text are rejected with HTTP 422 `SCANNED_PDF_DETECTED`, prompting the timetable officer to export to structured CSV/Excel or run OCR.

## 2. Two-Phase Academic Reconciliation Engine
Every staged row undergoes deterministic entity resolution with full audit provenance:

### Resolution States
- `EXACT_MATCH`: Direct resolution against canonical course code, room code, or institutional ID.
- `ALIAS_MATCH`: Resolution through verified alias dictionaries (`VenueAlias`, `CourseAlias`, `LecturerAlias`).
- `AMBIGUOUS`: Multiple candidates within similarity thresholds.
- `UNMATCHED`: Entity not found in COD-approved academic catalog.
- `INVALID`: Syntactically illegal time ranges or days.
- `CONFLICT`: Overlaps with an existing or staged timetable slot.
- `VALIDATED`: Certified collision-free and ready for publication.

### Lecturer Token Resolution
- Honorific stripping: Removes `Prof.`, `Dr.`, `Mr.`, `Rev.`, etc.
- Inversion handling: Matches `Lastname, Initial` to `Firstname Lastname`.
- Traceability: Stored in `StagedTimetableEntry.resolutionTrace` containing candidate IDs and confidence provenance.

## 3. Multi-Dimensional Conflict Detection Engine (`conflicts.ts`)
Validates schedule slots with minute-level precision across 5 dimensions:
1. **Venue Collision (`VENUE_CONFLICT`)**: Two classes assigned to the same room with overlapping times on the same day. Adjacent slots (e.g. 08:00–10:00 and 10:00–12:00) are cleanly separated.
2. **Lecturer Collision (`LECTURER_CONFLICT`)**: Lecturer scheduled for multiple classes simultaneously.
3. **Cohort Collision (`COHORT_CONFLICT`)**: Student cohort scheduled for two lectures at once.
4. **Venue Capacity Warning (`CAPACITY_CONFLICT`)**: Cohort expected enrollment exceeds physical room seating capacity (`cohortExpectedSize > venueCapacity`).
5. **Student Enrollment Clash (`STUDENT_ENROLLMENT_CONFLICT`)**: Concurrent elective or retake course slots sharing enrolled students.

## 4. Recurring Templates vs Date-Specific Occurrences
- `TimetableEntry`: Stores the master weekly recurring schedule template.
- `ScheduleOverride`: Date-specific exceptions (`CANCELLED`, `POSTPONED`, `RESCHEDULED`, `LECTURER_SUBSTITUTION`).
- Concurrency & Idempotency: Optimistic version locking (`expectedVersion`) and serializable database isolation.
