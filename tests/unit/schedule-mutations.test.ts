import { describe, expect, it } from "vitest";
import {
  buildNotificationMessage,
  buildScheduleChangeMetadata,
  validateRescheduleProposal,
} from "@/server/services/schedule-ops";

describe("schedule mutation utilities", () => {
  it("classifies a time and venue move as a time reschedule", () => {
    const metadata = buildScheduleChangeMetadata(
      {
        id: "entry-1",
        day: "MONDAY",
        startTime: "09:00",
        endTime: "10:00",
        venueId: "venue-a",
        lecturerId: "lecturer-a",
        offeringId: "offering-a",
        cohortId: "cohort-a",
      },
      {
        id: "entry-1",
        day: "TUESDAY",
        startTime: "11:00",
        endTime: "12:00",
        venueId: "venue-b",
        lecturerId: "lecturer-b",
        offeringId: "offering-a",
        cohortId: "cohort-a",
      },
      "Department meeting",
    );

    expect(metadata.changeType).toBe("TIME_RESCHEDULE");
    expect(metadata.reason).toBe("Department meeting");
    expect(metadata.previous.day).toBe("MONDAY");
    expect(metadata.next.day).toBe("TUESDAY");
  });

  it("builds a notification text with the old and new schedule details", () => {
    const message = buildNotificationMessage({
      changeType: "TIME_RESCHEDULE",
      previous: { day: "MONDAY", startTime: "09:00", endTime: "10:00", venueId: "venue-a", lecturerId: "lecturer-a" },
      next: { day: "MONDAY", startTime: "11:00", endTime: "12:00", venueId: "venue-b", lecturerId: "lecturer-b" },
    });

    expect(message).toContain("MONDAY");
    expect(message).toContain("09:00");
    expect(message).toContain("11:00");
    expect(message).toContain("venue-b");
  });

  it("rejects reschedule proposals when a venue or lecturer conflict exists", () => {
    const result = validateRescheduleProposal(
      [
        {
          id: "existing-1",
          day: "MONDAY",
          startTime: "09:00",
          endTime: "10:00",
          venueId: "venue-1",
          lecturerId: "lecturer-1",
          offeringId: "offering-1",
          cohortId: "cohort-1",
        },
      ],
      {
        id: "existing-2",
        day: "MONDAY",
        startTime: "09:30",
        endTime: "10:30",
        venueId: "venue-1",
        lecturerId: "lecturer-2",
        offeringId: "offering-2",
        cohortId: "cohort-2",
      },
    );

    expect(result.hasConflict).toBe(true);
    expect(result.conflicts.map((conflict) => conflict.type)).toContain("VENUE_CONFLICT");
  });
});
