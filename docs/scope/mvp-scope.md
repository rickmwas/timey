# MVP Scope vs. Future Phases — Timy

## 1. MVP (Minimum Viable Product) Boundaries
The MVP delivers an end-to-end working system directly satisfying all 6 specific objectives of the Kisii University proposal.

| Feature Area | MVP Deliverable | Target User | Owner |
|---|---|---|---|
| **Authentication & RBAC** | Email/Registration number login with role-based routing (`STUDENT`, `LECTURER`, `ADMIN`). Protected sessions. | All | Dev 3 |
| **Ingestion Pipeline** | Upload `.xlsx` and `.csv` timetable files. Parse, validate against schema, stage in DB, display preview with conflict warnings, and atomic publish. | Timetable Coordinator | Dev 4 |
| **Conflict Engine** | Detect venue double-bookings, lecturer clashes, and cohort overlaps. Flag blocking conflicts before publish or reschedule. | Coordinator, Lecturer | Dev 3 |
| **Student Timetable** | Responsive mobile agenda view, day selector (Mon–Sat), current lecture indicator, full details (time, venue, lecturer, course code). | Student | Dev 1 |
| **Offline Cache** | Client-side caching (LocalStorage/IndexedDB) so students can view their timetable even with poor or zero campus connectivity. | Student | Dev 1 |
| **Lecturer Portal** | View assigned lectures; submit class time change, venue move, cancellation, or postponement with automatic affected cohort detection. | Lecturer | Dev 2 |
| **Venue Management** | Venue catalog (name, code, capacity, building/floor). Real-time availability inspection for any timeslot. | Coordinator, Lecturer | Dev 2 |
| **Notifications** | In-app notification feed + badge for students when their lecture is moved, cancelled, or rescheduled. | Student | Dev 4 |
| **Academic Announcements**| Department/lecturer broadcast announcements tied to specific courses or venues. | Student, Lecturer | Dev 4 |

---

## 2. Phase 2 Enhancements (Post-MVP)
Features that add significant value but are not required for initial system validation:
1. **Direct PDF Timetable Ingestion**: Heuristic text-table parser for university PDF timetable matrices.
2. **Web Push & Mobile SMS Integration**: Integration with SMS gateways (e.g. Africa's Talking) for critical emergency venue swaps when students lack active data bundles.
3. **Elective Course Self-Enrollment**: Allow students taking irregular or retake units to construct a personalized composite timetable across multiple cohorts.
4. **Google Calendar / iCal Export**: Export weekly timetable to student's personal phone calendar.
5. **Lecturer Attendance Check-in**: Simple QR-code or geolocation check-in confirming the lecturer has occupied the assigned venue.

---

## 3. Explicitly Out-of-Scope
As formally stipulated in Section 7 of the Project Proposal:
- ❌ **Course Registration**: Student course enrollment and fee clearing remain on the official university ERP portal.
- ❌ **Examination Timetabling & Invigilation**: Examination room allocation and exam conflict resolution have distinct constraints and are excluded.
- ❌ **Financial / Fee Management**: Fee statements, payment integration, and bursary records are outside Timy's domain.
- ❌ **Grading and Transcripts**: Academic grading, marks entry, and GPA calculations are excluded.

## 4. Public Product Experience

### Timy public landing page

**Intent**: Introduce Timy to visitors before they enter the existing university portal, while preserving authentication, role access, and current system behavior.

**Status**: in-progress

**Spec**: [SPEC-005](../specs/SPEC-005-public-timy-landing-page.md)

**Done when**: Visitors can understand Timy's current capabilities and reach sign in or account access guidance. Existing users still reach the role appropriate dashboard, and public content remains responsive, accessible, and accurate about API only capabilities.

- [x] Design it (spec)
- [ ] Build it: `/develop Timy public landing page`
  - [ ] Public routes and authentication redirects are preserved (AC-1 to AC-5).
  - [ ] The product story, verified feature sections, and safe demonstrations are in place (AC-6 to AC-9).
  - [ ] Responsive images, navigation, and reduced motion behavior are complete (AC-9 to AC-11).
  - [ ] Metadata, crawler rules, and focused test coverage are complete (AC-1 to AC-12).
- [ ] Verify it: `/check verify Timy public landing page`
- [ ] Test it: `/test Timy public landing page`
