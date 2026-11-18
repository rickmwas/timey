---
name: Timetable Conflict / Data Ingestion Issue
about: Report a detected room collision, lecturer double-booking, or spreadsheet parsing anomaly
title: '[CONFLICT]: '
labels: ['conflict', 'data-anomaly']
assignees: ''
---

### Conflict Type
- [ ] Venue Double-Booking (e.g. LH 26 booked by two units simultaneously)
- [ ] Lecturer Time Clash (same lecturer assigned to concurrent slots)
- [ ] Cohort Clashing (same student cohort booked for 2 classes at once)
- [ ] Parsing / Normalization Error (spreadsheet row failed to map venue/time)

### Conflict Details
- **Venue Involved**: e.g., LH 26
- **Day of Week**: e.g., Monday
- **Time Slot**: e.g., 10:00 - 12:00
- **Competing Course Unit 1**: e.g., SOEN 311 (Cohort: IN16-Y2-S1, Lecturer: Dr. Ouma)
- **Competing Course Unit 2**: e.g., COMP 210 (Cohort: IN14-Y2-S1, Lecturer: Prof. Jane)

### Observed System Behavior
Did the Conflict Detection Engine catch this as BLOCKING, or was it mistakenly permitted?

### Expected Resolution
What is the desired scheduling outcome or conflict rule adjustment?
