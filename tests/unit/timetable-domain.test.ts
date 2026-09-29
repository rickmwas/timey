import { describe, expect, it } from "vitest";
import { isTimeRangeOverlapping } from "@/server/services/conflicts";
import { findAvailableVenues, validateSlotForConflicts } from "@/server/services/timetable";

describe("timetable domain", () => {
  it("ignores boundary-touching times as non-overlapping", () => {
    expect(isTimeRangeOverlapping("08:00", "10:00", "10:00", "12:00")).toBe(false);
    expect(isTimeRangeOverlapping("09:00", "11:00", "10:00", "12:00")).toBe(true);
  });

  it("filters unavailable venues while returning occupied details", () => {
    const result = findAvailableVenues(
      {
        dayOfWeek: "MONDAY",
        startTime: "09:00",
        endTime: "11:00",
        minCapacity: 60,
        building: "Main Academic Complex",
      },
      [
        { id: "v-1", code: "LH 26", name: "Lecture Hall 26", building: "Main Academic Complex", capacity: 120, isActive: true },
        { id: "v-2", code: "LH 28", name: "Lecture Hall 28", building: "Main Academic Complex", capacity: 80, isActive: true },
        { id: "v-3", code: "CS LAB 1", name: "Computer Lab 1", building: "Science Block", capacity: 60, isActive: true },
      ],
      [
        {
          id: "slot-1",
          day: "MONDAY",
          startTime: "09:30",
          endTime: "10:30",
          venueId: "v-1",
          lecturerId: "l-1",
          offeringId: "o-1",
          cohortId: "c-1",
        },
      ],
    );

    expect(result.availableVenues.map((venue) => venue.id)).toEqual(["v-2"]);
    expect(result.occupiedVenues).toEqual([
      expect.objectContaining({ id: "v-1", code: "LH 26", occupiedBy: "slot-1" }),
    ]);
  });

  it("detects overlapping venue and lecturer conflicts on a proposed slot", () => {
    const conflicts = validateSlotForConflicts(
      [
        {
          id: "slot-1",
          day: "MONDAY",
          startTime: "09:00",
          endTime: "10:00",
          venueId: "v-1",
          lecturerId: "l-1",
          offeringId: "o-1",
          cohortId: "c-1",
        },
      ],
      {
        id: "slot-2",
        day: "MONDAY",
        startTime: "09:30",
        endTime: "10:30",
        venueId: "v-1",
        lecturerId: "l-1",
        offeringId: "o-2",
        cohortId: "c-2",
      },
    );

    expect(conflicts.map((conflict) => conflict.type)).toEqual(
      expect.arrayContaining(["VENUE_CONFLICT", "LECTURER_CONFLICT"]),
    );
  });
});
