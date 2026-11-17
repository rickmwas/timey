import { NextRequest } from "next/server";
import { successResponse, failureResponse } from "@/server/http/responses";
import { db } from "@/lib/db";
import { sendPushToCohort } from "@/server/push/web-push";

export const dynamic = "force-dynamic";

const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;

export async function GET(request: NextRequest) {
  // Validate cron secret if configured
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && request.headers.get("x-vercel-cron") !== "1") {
    return failureResponse("UNAUTHORIZED", "Invalid Cron authorization", 401);
  }

  try {
    const now = new Date();
    // Kisii University is in East Africa Time (UTC+3)
    const eatHour = (now.getUTCHours() + 3) % 24;
    const eatMinute = now.getUTCMinutes();
    const currentMins = eatHour * 60 + eatMinute;

    const currentDay = dayNames[now.getUTCDay()];

    // Find entries scheduled for today
    const entries = await db.timetableEntry.findMany({
      where: {
        status: "ACTIVE",
        day: currentDay as any,
      },
      include: {
        offering: { include: { course: true } },
        venue: true,
      },
    });

    let totalAlertsPushed = 0;

    for (const entry of entries) {
      const [sh, sm] = (entry.startTime || "08:00").split(":").map(Number);
      const startMins = sh * 60 + sm;
      const diffMins = startMins - currentMins;

      // 30-minute reminder window (26 to 30 mins before start)
      if (diffMins <= 30 && diffMins > 25) {
        const pushed = await sendPushToCohort(entry.offering.cohortId, {
          title: `Upcoming: ${entry.offering.course.code} in 30 mins`,
          message: `Class starts at ${entry.startTime} in ${entry.venue.code} (${entry.venue.building}).`,
          tag: `reminder-30m-${entry.id}`,
        });
        totalAlertsPushed += pushed;
      }

      // 10-minute urgent reminder window (6 to 10 mins before start)
      if (diffMins <= 10 && diffMins > 5) {
        const pushed = await sendPushToCohort(entry.offering.cohortId, {
          title: `🚨 Hurry: ${entry.offering.course.code} starts in 10 mins!`,
          message: `Proceed to ${entry.venue.code}. Lecture starts at ${entry.startTime}.`,
          tag: `reminder-10m-${entry.id}`,
        });
        totalAlertsPushed += pushed;
      }
    }

    return successResponse({
      timestamp: now.toISOString(),
      currentDay,
      eatTime: `${String(eatHour).padStart(2, "0")}:${String(eatMinute).padStart(2, "0")}`,
      entriesChecked: entries.length,
      alertsPushed: totalAlertsPushed,
    });
  } catch (error: any) {
    console.warn("[CronClassReminders] Error checking reminders:", error?.message);
    return successResponse({ checked: 0, offlineFallback: true });
  }
}
