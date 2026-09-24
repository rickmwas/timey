# SPEC-003: Venue Management & Conflict Detection Engine

- **Module**: Scheduling Core & Conflict Engine
- **Owner**: Dev 3 (Backend/Systems) with Dev 2 (Venue UI)
- **Status**: APPROVED

---

## 1. Problem Statement
At Kisii University, learning spaces (e.g. `LH 26`, Science Complex halls, computer labs) are shared across multiple departments. Because venues were previously managed via paper memos or verbal agreements, two classes are frequently assigned to the same room at the same time.

The `ConflictEngine` is a deterministic, high-performance rule engine that validates all scheduled and proposed slots against three collision dimensions.

---

## 2. Mathematical Definition of Clash
Two academic timetable slots $S_1$ and $S_2$ overlap in time if and only if:
$$\text{IsOverlapping}(S_1, S_2) = (S_1.\text{dayOfWeek} = S_2.\text{dayOfWeek}) \land (S_1.\text{startTime} < S_2.\text{endTime}) \land (S_1.\text{endTime} > S_2.\text{startTime})$$

### Collision Dimensions:
1. **Venue Clash**:
   $$\text{VenueConflict}(S_1, S_2) \iff \text{IsOverlapping}(S_1, S_2) \land (S_1.\text{venueId} = S_2.\text{venueId}) \land (S_1.\text{id} \neq S_2.\text{id})$$
   *Severity*: `BLOCKING`. The system must forbid saving or publishing unless explicitly overridden with administrative privilege.

2. **Lecturer Clash**:
   $$\text{LecturerConflict}(S_1, S_2) \iff \text{IsOverlapping}(S_1, S_2) \land (S_1.\text{lecturerId} = S_2.\text{lecturerId}) \land (S_1.\text{id} \neq S_2.\text{id})$$
   *Severity*: `WARNING` / `BLOCKING`. A lecturer cannot be physically present in two separate venues simultaneously.

3. **Cohort Clash**:
   $$\text{CohortConflict}(S_1, S_2) \iff \text{IsOverlapping}(S_1, S_2) \land (S_1.\text{cohortId} = S_2.\text{cohortId}) \land (S_1.\text{id} \neq S_2.\text{id})$$
   *Severity*: `BLOCKING`. A single student group cannot attend two classes at once.

---

## 3. Venue Availability API
To assist lecturers and coordinators when rescheduling a moved lecture, Timy provides real-time venue search:

### `GET /api/v1/venues/availability`
- **Query Params**:
  - `dayOfWeek`: `MONDAY` | `TUESDAY` | `WEDNESDAY` | `THURSDAY` | `FRIDAY` | `SATURDAY`
  - `startTime`: `HH:MM`
  - `endTime`: `HH:MM`
  - `minCapacity`: Optional number (e.g. 80 seats)
  - `building`: Optional filter
- **Response**:
```json
{
  "success": true,
  "data": {
    "availableVenues": [
      {
        "id": "v-101",
        "code": "LH 26",
        "name": "Lecture Hall 26",
        "capacity": 120,
        "building": "Main Academic Complex",
        "status": "AVAILABLE"
      }
    ],
    "occupiedVenues": [
      {
        "id": "v-102",
        "code": "LH 28",
        "name": "Lecture Hall 28",
        "occupiedBy": "COMP 210 - Computer Systems",
        "occupiedUntil": "12:00"
      }
    ]
  }
}
```

---

## 4. Conflict Resolution Workflow
1. User (Lecturer or Timetable Coordinator) inputs new time or room for a class.
2. Client performs debounced pre-check call to `POST /api/v1/timetables/validate-slot`.
3. If conflicts exist:
   - UI displays detailed conflict banner: *"Venue LH 26 is already booked by SOEN 311 on Monday between 10:00 and 12:00."*
   - Submission button is disabled.
4. Suggestions: The system offers an alternative available venue with sufficient capacity during the requested timeslot.

---

## 5. Acceptance Criteria
- [ ] Unit tests verify time overlap math correctly handles boundaries (e.g. 08:00–10:00 and 10:00–12:00 do NOT clash).
- [ ] Attempting to insert two overlapping slots in the same venue returns `409 Conflict` with error details.
- [ ] Lecturer availability check prevents assigning the same lecturer to multiple concurrent lectures.
- [ ] Venue availability endpoint returns only unbooked, non-maintenance rooms for any given time slice.
