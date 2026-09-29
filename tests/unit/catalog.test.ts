import { describe, expect, it } from "vitest";
import { buildNotificationMessage, buildScheduleChangeMetadata, validateRescheduleProposal } from "@/server/services/schedule-ops";

describe("catalog and schedule helpers", () => {
  it("builds a time-reschedule metadata payload", () => {
    const metadata = buildScheduleChangeMetadata(
      {
        id: "entry-1",
        day: "MONDAY",
        startTime: "09:00",
        endTime: "10:00",
        venueId: "venue-1",
        lecturerId: "lecturer-1",
        offeringId: "offering-1",
        cohortId: "cohort-1",
      },
      {
        id: "entry-1",
        day: "MONDAY",
        startTime: "11:00",
        endTime: "12:00",
        venueId: "venue-2",
        lecturerId: "lecturer-1",
        offeringId: "offering-1",
        cohortId: "cohort-1",
      },
      "Department meeting",
    );

    expect(metadata.changeType).toBe("TIME_RESCHEDULE");
    expect(metadata.reason).toBe("Department meeting");
  });

  it("formats a readable notification message", () => {
    const message = buildNotificationMessage({
      changeType: "VENUE_SWAP",
      previous: { day: "MONDAY", startTime: "09:00", endTime: "10:00", venueId: "venue-a", lecturerId: "lecturer-a" },
      next: { day: "MONDAY", startTime: "09:00", endTime: "10:00", venueId: "venue-b", lecturerId: "lecturer-a" },
    });

    expect(message).toContain("VENUE_SWAP");
    expect(message).toContain("venue-b");
  });

  it("flags overlapping reschedule proposals as conflicts", () => {
    const result = validateRescheduleProposal(
      [
        {
          id: "entry-1",
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
        id: "entry-2",
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
    expect(result.conflicts.length).toBeGreaterThan(0);
  });
});
