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
});
