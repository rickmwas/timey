# SPEC-002: Timetable Ingestion Pipeline & Parser

- **Module**: Data Ingestion & Transformation
- **Owner**: Dev 4 (Backend/Platform) with Dev 2 (Upload UI)
- **Status**: APPROVED

---

## 1. Problem & Architecture
Universities distribute master timetables as spreadsheets (`.xlsx`, `.csv`) or formatted PDFs. In practice, these files contain:
- Inconsistent headers (e.g., "Room" vs "Venue" vs "HALL").
- Venue aliases ("LH 26", "LH-26", "Lecture Hall 26", "Lab 1").
- Varied time formats ("8-11am", "08:00 - 11:00", "8.00-11.00").
- Merged cells and missing lecturer names.

To prevent corrupting active university schedules, the ingestion pipeline implements an **isolated staging pattern**.

```mermaid
flowchart TD
    Upload[1. Admin Uploads Spreadsheet] --> Parse[2. SheetJS / CSV Stream Parser]
    Parse --> Sanitize[3. Header & Row Sanitization]
    Sanitize --> Normalize[4. Entity Normalization & Alias Matching]
    Normalize --> Stage[5. Write to StagedTimetableEntries]
    Stage --> ConflictCheck[6. Conflict Engine Evaluation]
    ConflictCheck --> Preview[7. Staging Preview with Conflict Summary]
    Preview --> Decision{Coordinator Decision}
    Decision -->>|Reject / Fix| Discard[Discard Staging Batch]
    Decision -->>|Approve & Publish| Commit[8. Atomic DB Transaction Commit]
    Commit --> Notify[9. Dispatch Cohort Notifications]
```

---

## 2. Ingestion Stages & Mechanics

### Stage 1: Upload & Format Detection
- Accepts `.xlsx`, `.xls`, `.csv` (max 10MB).
- Validates file signatures (magic bytes) to prevent executable masquerading.
- Creates an `ImportJob` record with status `PROCESSING`.

### Stage 2: Tabular Extraction & Header Mapping
- Detects header aliases using regex mapping:
  - Course Code: `/(course|unit|code|subject)/i`
  - Course Title: `/(title|description|name)/i`
  - Venue: `/(venue|room|hall|location)/i`
  - Day: `/(day|weekday)/i`
  - Time: `/(time|slot|hours|period)/i`
  - Lecturer: `/(lecturer|instructor|teacher|staff|prof)/i`
  - Cohort / Class: `/(cohort|class|group|programme|prog|year)/i`

### Stage 3: Normalization & Alias Resolution
- **Days**: Map strings (`mon`, `monday`, `M`) to enum `MONDAY`.
- **Timeslots**: Parse `08:00 - 11:00` into discrete `startTime: "08:00"` and `endTime: "11:00"`.
- **Venues**: Query `VenueAlias` table (e.g. `LH-26` maps to `LH 26`). If unknown, flag for coordinator confirmation or auto-create with status `UNVERIFIED`.
- **Course Units**: Clean codes (e.g. `soen311` -> `SOEN 311`).

### Stage 4: Conflict Pre-Validation
Before presenting the preview, the `ConflictEngine` runs across all staged entries and against active published entries:
- Flags any duplicate venue booking in the batch.
- Flags any lecturer double-booking.
- Flags cohort time clashes.

### Stage 5: Atomic Transaction Commit
When the coordinator clicks "Publish Timetable":
```ts
await prisma.$transaction(async (tx) => {
  // 1. Archive or replace previous active timetable entries for this semester
  await tx.timetableEntry.updateMany({
    where: { academicPeriodId, status: "ACTIVE" },
    data: { status: "ARCHIVED" }
  });

  // 2. Insert new validated entries
  await tx.timetableEntry.createMany({
    data: normalizedEntries
  });

  // 3. Mark ImportJob as COMPLETED
  await tx.importJob.update({
    where: { id: jobId },
    data: { status: "COMPLETED", publishedAt: new Date() }
  });
});
```

---

## 3. Failure Handling & Edge Cases
1. **Unparseable Timeslots**: Mark row with status `FAILED_VALIDATION` and explanatory error message ("Cannot parse time 'TBD'").
2. **Missing Venue**: If venue is blank, allow staging with `VENUE_TBD` flag; require warning acknowledgement before publishing.
3. **Partial Batch Errors**: Show row-by-row error table in the admin UI allowing the coordinator to manually correct the 3 broken rows without re-uploading the 200 good rows.

---

## 4. Acceptance Criteria
- [ ] Uploading a valid `.xlsx` timetable creates an `ImportJob` and populates `StagedTimetableEntry`.
- [ ] Irregular time strings (`8:00am - 11:00am`, `08:00-11:00`) are normalized to standardized `HH:MM`.
- [ ] Conflicting rows in the file are identified and rendered with warning badges in the preview table.
- [ ] Publishing commits the entire batch atomically; any failure rolls back without leaving half-imported data.
- [ ] Ingestion job audit log records file name, uploader, record count, and publish timestamp.
