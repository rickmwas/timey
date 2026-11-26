import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { successResponse, failureResponse } from "@/server/http/responses";
import { db } from "@/lib/db";
import { sendPushToCohort } from "@/server/push/web-push";

export const dynamic = "force-dynamic";

const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;

export async function GET(request: NextRequest) {
  // 1. Validate cron secret with timing-safe comparison
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.trim().length < 16) {
    if (process.env.NODE_ENV === "production") {
      return failureResponse("SERVER_CONFIGURATION_ERROR", "CRON_SECRET is not configured or too short", 500);
    }
  }

  const authHeader = request.headers.get("authorization");
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";

  let authorized = false;
  if (cronSecret && authHeader?.startsWith("Bearer ")) {
    const provided = Buffer.from(authHeader.slice(7));
    const expected = Buffer.from(cronSecret);
    if (provided.length === expected.length && crypto.timingSafeEqual(provided, expected)) {
      authorized = true;
    }
  } else if (isVercelCron && process.env.VERCEL) {
    authorized = true;
  } else if (process.env.NODE_ENV !== "production" && !cronSecret) {
    authorized = true; // Allow local manual dev testing only when secret is unconfigured
  }

  if (!authorized) {
    return failureResponse("UNAUTHORIZED", "Invalid or missing Cron authorization credentials", 401);
  }

  try {
    const now = new Date();
    // Accurate East Africa Time (UTC+3)
    const eatDateString = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Nairobi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now); // "YYYY-MM-DD"

    const eatParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Nairobi",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).formatToParts(now);

    const eatHour = parseInt(eatParts.find((p) => p.type === "hour")?.value || "0", 10);
    const eatMinute = parseInt(eatParts.find((p) => p.type === "minute")?.value || "0", 10);
    const currentMins = eatHour * 60 + eatMinute;

    const todayDateObj = new Date(`${eatDateString}T00:00:00.000Z`);
    const dayOfWeekIndex = new Date(`${eatDateString}T12:00:00.000Z`).getUTCDay();
    const currentDay = dayNames[dayOfWeekIndex];

    // Query active weekly slots for current day
    const weeklyEntries = await db.timetableEntry.findMany({
      where: {
        status: "ACTIVE",
        day: currentDay as any,
      },
      include: {
        offering: { include: { course: true } },
        venue: true,
        overrides: {
          where: {
            occurrenceDate: todayDateObj,
          },
          include: {
            replacementVenue: true,
          },
        },
      },
    });

    // Also query slots from other days that were rescheduled TO today's date
    const rescheduledToToday = await db.scheduleOverride.findMany({
      where: {
        type: "RESCHEDULED",
        replacementDate: todayDateObj,
      },
      include: {
        entry: {
          include: {
            offering: { include: { course: true } },
            venue: true,
          },
        },
        replacementVenue: true,
      },
    });

    // Effective occurrence map
    interface EffectiveOccurrence {
      entryId: string;
      courseCode: string;
      cohortId: string;
      startTime: string;
      venueCode: string;
      building: string;
    }

    const effectiveList: EffectiveOccurrence[] = [];

    // Process recurring entries
    for (const entry of weeklyEntries) {
      const override = entry.overrides[0];
      if (override) {
        if (override.type === "CANCELLED" || override.type === "POSTPONED") {
          continue; // Suppress cancelled or postponed classes
        }
        if (override.type === "RESCHEDULED" && override.replacementDate && override.replacementDate.getTime() !== todayDateObj.getTime()) {
          continue; // Moved to another date
        }
        // Rescheduled for today with replacement time/venue
        effectiveList.push({
          entryId: entry.id,
          courseCode: entry.offering.course.code,
          cohortId: entry.offering.cohortId,
          startTime: override.replacementStartTime || entry.startTime,
          venueCode: override.replacementVenue?.code || entry.venue.code,
          building: override.replacementVenue?.building || entry.venue.building,
        });
      } else {
        effectiveList.push({
          entryId: entry.id,
          courseCode: entry.offering.course.code,
          cohortId: entry.offering.cohortId,
          startTime: entry.startTime,
          venueCode: entry.venue.code,
          building: entry.venue.building,
        });
      }
    }

    // Process classes rescheduled TO today
    for (const override of rescheduledToToday) {
      effectiveList.push({
        entryId: override.entry.id,
        courseCode: override.entry.offering.course.code,
        cohortId: override.entry.offering.cohortId,
        startTime: override.replacementStartTime || override.entry.startTime,
        venueCode: override.replacementVenue?.code || override.entry.venue.code,
        building: override.replacementVenue?.building || override.entry.venue.building,
      });
    }

    let totalAlertsPushed = 0;

    for (const item of effectiveList) {
      const [sh, sm] = (item.startTime || "08:00").split(":").map(Number);
      const startMins = sh * 60 + sm;
      const diffMins = startMins - currentMins;

      // 30-minute reminder window (26 to 30 mins before start)
      if (diffMins <= 30 && diffMins > 25) {
        // Deduplication check via ClassReminderLog
        const alreadySent = await db.classReminderLog.findUnique({
          where: {
            entryId_occurrenceDate_windowType: {
              entryId: item.entryId,
              occurrenceDate: todayDateObj,
              windowType: "REMINDER_30M",
            },
          },
        });

        if (!alreadySent) {
          const pushed = await sendPushToCohort(item.cohortId, {
            title: `Upcoming: ${item.courseCode} in 30 mins`,
            message: `Class starts at ${item.startTime} in ${item.venueCode} (${item.building}).`,
            tag: `reminder-30m-${item.entryId}-${eatDateString}`,
          });
          await db.classReminderLog.create({
            data: {
              entryId: item.entryId,
              occurrenceDate: todayDateObj,
              windowType: "REMINDER_30M",
            },
          });
          totalAlertsPushed += pushed;
        }
      }

      // 10-minute urgent reminder window (6 to 10 mins before start)
      if (diffMins <= 10 && diffMins > 5) {
        const alreadySent = await db.classReminderLog.findUnique({
          where: {
            entryId_occurrenceDate_windowType: {
              entryId: item.entryId,
              occurrenceDate: todayDateObj,
              windowType: "REMINDER_10M",
            },
          },
        });

        if (!alreadySent) {
          const pushed = await sendPushToCohort(item.cohortId, {
            title: `🚨 Hurry: ${item.courseCode} starts in 10 mins!`,
            message: `Proceed to ${item.venueCode}. Lecture starts at ${item.startTime}.`,
            tag: `reminder-10m-${item.entryId}-${eatDateString}`,
          });
          await db.classReminderLog.create({
            data: {
              entryId: item.entryId,
              occurrenceDate: todayDateObj,
              windowType: "REMINDER_10M",
            },
          });
          totalAlertsPushed += pushed;
        }
      }
    }

    return successResponse({
      timestamp: now.toISOString(),
      eatDate: eatDateString,
      currentDay,
      eatTime: `${String(eatHour).padStart(2, "0")}:${String(eatMinute).padStart(2, "0")}`,
      effectiveClassesToday: effectiveList.length,
      alertsPushed: totalAlertsPushed,
    });
  } catch (error: any) {
    console.error("[CronClassReminders] Failure executing reminder check:", error);
    return failureResponse("CRON_EXECUTION_FAILED", error?.message || "Failed to process class reminders", 500);
  }
}
