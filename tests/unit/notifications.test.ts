import { describe, expect, it } from "vitest";
import { buildNotificationMessage, buildScheduleChangeMetadata } from "@/server/services/schedule-ops";
import { NotificationSummary, normalizeNotification} from "@/server/services/notifications";

describe("notification helpers", () => {
  it("keeps the schedule change payload readable and consistent", () => {
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
    expect(buildNotificationMessage(metadata)).toContain("venue-2");
  });

  it("normalizes notification summaries to a safe response shape", () => {
    const summary: NotificationSummary = {
      id: "n1",
      title: "Class moved",
      message: "Updated to room B",
      type: "SCHEDULE_RESCHEDULED",
      createdAt: new Date("2026-09-29T00:00:00.000Z"),
      readAt: null,
    };

    expect(normalizeNotification(summary)).toMatchObject({
      id: "n1",
      title: "Class moved",
      unread: true,
    });
  });
});
