import { describe, expect, it } from "vitest";
import { detectSlotConflicts, isTimeRangeOverlapping, normalizeTimeToMinutes } from "@/server/services/conflicts";

describe("time overlap logic", () => {
  it("does not treat adjacent boundaries as a clash", () => {
    expect(isTimeRangeOverlapping("08:00", "10:00", "10:00", "12:00")).toBe(false);
    expect(isTimeRangeOverlapping("08:00", "09:00", "08:30", "10:00")).toBe(true);
  });

  it("normalizes times to minute precision for comparisons", () => {
    expect(normalizeTimeToMinutes("09:15")).toBe(555);
    expect(normalizeTimeToMinutes("13:05")).toBe(785);
  });
});

describe("slot conflict detection", () => {
  it("flags venue, lecturer, and cohort collisions when ranges overlap", () => {
    const conflicts = detectSlotConflicts([
      {
        id: "slot-1",
        day: "MONDAY",
        startTime: "09:00",
        endTime: "11:00",
        venueId: "venue-a",
        lecturerId: "lecturer-1",
        offeringId: "offering-1",
        cohortId: "cohort-1",
      },
      {
        id: "slot-2",
        day: "MONDAY",
        startTime: "10:30",
        endTime: "12:00",
        venueId: "venue-a",
        lecturerId: "lecturer-2",
        offeringId: "offering-2",
        cohortId: "cohort-1",
      },
      {
        id: "slot-3",
        day: "MONDAY",
        startTime: "10:00",
        endTime: "11:00",
        venueId: "venue-b",
        lecturerId: "lecturer-1",
        offeringId: "offering-3",
        cohortId: "cohort-2",
      },
    ]);

    expect(conflicts).toHaveLength(3);
    expect(conflicts.map((entry) => entry.type)).toEqual(
      expect.arrayContaining(["VENUE_CONFLICT", "LECTURER_CONFLICT", "COHORT_CONFLICT"]),
    );
  });

  it("detects venue capacity violations when cohort size exceeds room capacity", () => {
    const conflicts = detectSlotConflicts([
      {
        id: "slot-large",
        day: "TUESDAY",
        startTime: "08:00",
        endTime: "10:00",
        venueId: "lab-1",
        lecturerId: "lecturer-1",
        offeringId: "offering-1",
        cohortId: "cohort-big",
        venueCapacity: 40,
        cohortExpectedSize: 120,
      },
    ]);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("CAPACITY_CONFLICT");
    expect(conflicts[0].details).toContain("exceeds venue capacity");
  });

  it("detects student enrollment clashes when concurrent slots share enrolled students", () => {
    const conflicts = detectSlotConflicts([
      {
        id: "slot-elective-a",
        day: "WEDNESDAY",
        startTime: "14:00",
        endTime: "16:00",
        venueId: "room-1",
        lecturerId: "lecturer-1",
        offeringId: "offering-a",
        cohortId: "cohort-1",
        enrolledStudentIds: ["student-101", "student-102"],
      },
      {
        id: "slot-elective-b",
        day: "WEDNESDAY",
        startTime: "15:00",
        endTime: "17:00",
        venueId: "room-2",
        lecturerId: "lecturer-2",
        offeringId: "offering-b",
        cohortId: "cohort-2",
        enrolledStudentIds: ["student-102", "student-103"],
      },
    ]);

    const studentConflicts = conflicts.filter((c) => c.type === "STUDENT_ENROLLMENT_CONFLICT");
    expect(studentConflicts).toHaveLength(1);
    expect(studentConflicts[0].details).toContain("1 student(s) enrolled in both concurrent units");
  });
});
