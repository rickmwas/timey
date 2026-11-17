import { DayOfWeek, Prisma, Role, ScheduleOverrideType } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/server/errors/app-error";
import { hasPermission } from "@/server/auth/permissions";
import type { AuthenticatedUser } from "@/server/middleware/require-user";
import type { TimetableReadQuery } from "@/server/schemas/timetable-reads";

const weekDays = [DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY];

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function withinRange(value: Date, start: Date, end: Date): boolean {
  return value >= start && value <= end;
}

function scopedWhere(actor: AuthenticatedUser, query: TimetableReadQuery, entryId?: string): Prisma.TimetableEntryWhereInput {
  const where: Prisma.TimetableEntryWhereInput = {
    status: "ACTIVE",
    ...(entryId ? { id: entryId } : {}),
    ...(query.periodId ? { periodId: query.periodId } : {}),
    ...(query.venueId ? { venueId: query.venueId } : {}),
  };

  if (actor.role === Role.STUDENT) {
    if (!actor.cohortId || (query.cohortId && query.cohortId !== actor.cohortId)) {
      throw new AppError("FORBIDDEN", "Students may only view their own cohort timetable", 403);
    }
    where.offering = { cohortId: actor.cohortId };
  } else if (actor.role === Role.LECTURER) {
    if (query.lecturerId && query.lecturerId !== actor.id) {
      throw new AppError("FORBIDDEN", "Lecturers may only view their own teaching timetable", 403);
    }
    where.lecturerId = actor.id;
  } else if (hasPermission(actor.role, "timetable:read")) {
    if (query.cohortId) where.offering = { cohortId: query.cohortId };
    if (query.lecturerId) where.lecturerId = query.lecturerId;
  } else {
    throw new AppError("FORBIDDEN", "You do not have permission to view timetable entries", 403);
  }

  return where;
}

function materializeEntry(
  entry: {
    id: string;
    day: DayOfWeek;
    startTime: string;
    endTime: string;
    version: number;
    offering: {
      cohortId: string;
      cohort: { id: string; code: string; name: string };
      course: { id: string; code: string; title: string };
    };
    lecturer: { id: string; fullName: string };
    venue: { id: string; code: string; name: string; building: string };
    overrides: Array<{
      id: string;
      occurrenceDate: Date;
      type: ScheduleOverrideType;
      replacementDate: Date | null;
      replacementDay: DayOfWeek | null;
      replacementStartTime: string | null;
      replacementEndTime: string | null;
      replacementVenueId: string | null;
      replacementVenue: { id: string; code: string; name: string; building: string } | null;
    }>;
  },
  rangeStart: Date,
  rangeEnd: Date,
) {
  const result: Array<Record<string, unknown>> = [];
  const overrideByOccurrence = new Map(entry.overrides.map((override) => [dateOnly(override.occurrenceDate), override]));

  for (let date = new Date(rangeStart); date <= rangeEnd; date.setUTCDate(date.getUTCDate() + 1)) {
    if (weekDays[date.getUTCDay()] !== entry.day) continue;
    const occurrenceDate = new Date(date);
    const override = overrideByOccurrence.get(dateOnly(occurrenceDate));

    if (!override) {
      result.push({
        entryId: entry.id,
        occurrenceDate: dateOnly(occurrenceDate),
        effectiveDate: dateOnly(occurrenceDate),
        day: entry.day,
        startTime: entry.startTime,
        endTime: entry.endTime,
        venue: entry.venue,
        status: "SCHEDULED",
        version: entry.version,
        course: entry.offering.course,
        cohort: entry.offering.cohort,
        lecturer: entry.lecturer,
      });
      continue;
    }

    if (override.type === ScheduleOverrideType.CANCELLED) {
      result.push({
        entryId: entry.id,
        overrideId: override.id,
        occurrenceDate: dateOnly(occurrenceDate),
        effectiveDate: dateOnly(occurrenceDate),
        day: entry.day,
        startTime: entry.startTime,
        endTime: entry.endTime,
        venue: entry.venue,
        status: "CANCELLED",
        version: entry.version,
        course: entry.offering.course,
        cohort: entry.offering.cohort,
        lecturer: entry.lecturer,
      });
      continue;
    }

    const effectiveDate = override.replacementDate ?? occurrenceDate;
    if (!withinRange(effectiveDate, rangeStart, rangeEnd)) continue;
    result.push({
      entryId: entry.id,
      overrideId: override.id,
      occurrenceDate: dateOnly(occurrenceDate),
      effectiveDate: dateOnly(effectiveDate),
      day: override.replacementDay ?? entry.day,
      startTime: override.replacementStartTime ?? entry.startTime,
      endTime: override.replacementEndTime ?? entry.endTime,
      venue: override.replacementVenue ?? entry.venue,
      status: override.type === ScheduleOverrideType.POSTPONED ? "POSTPONED" : "RESCHEDULED",
      version: entry.version,
      course: entry.offering.course,
      cohort: entry.offering.cohort,
      lecturer: entry.lecturer,
    });
  }

  for (const override of entry.overrides) {
    if (!override.replacementDate || withinRange(override.occurrenceDate, rangeStart, rangeEnd)) continue;
    if (!withinRange(override.replacementDate, rangeStart, rangeEnd)) continue;
    result.push({
      entryId: entry.id,
      overrideId: override.id,
      occurrenceDate: dateOnly(override.occurrenceDate),
      effectiveDate: dateOnly(override.replacementDate),
      day: override.replacementDay ?? entry.day,
      startTime: override.replacementStartTime ?? entry.startTime,
      endTime: override.replacementEndTime ?? entry.endTime,
      venue: override.replacementVenue ?? entry.venue,
      status: override.type === ScheduleOverrideType.POSTPONED ? "POSTPONED" : "RESCHEDULED",
      version: entry.version,
      course: entry.offering.course,
      cohort: entry.offering.cohort,
      lecturer: entry.lecturer,
    });
  }

  return result;
}

export async function readEffectiveTimetable(
  actor: AuthenticatedUser,
  query: TimetableReadQuery,
  entryId?: string,
) {
  const period = query.periodId
    ? await db.academicPeriod.findUnique({ where: { id: query.periodId } })
    : await db.academicPeriod.findFirst({ where: { isActive: true }, orderBy: { startDate: "desc" } });
  if (!period) throw new AppError("ACADEMIC_PERIOD_NOT_FOUND", "Academic period was not found", 404);

  const rangeStart = new Date(Math.max(parseDate(query.startDate).getTime(), period.startDate.getTime()));
  const rangeEnd = new Date(Math.min(parseDate(query.endDate).getTime(), period.endDate.getTime()));
  if (rangeStart > rangeEnd) return { items: [], nextCursor: null };

  const overridesWhere: Prisma.ScheduleOverrideWhereInput = {
    OR: [
      { occurrenceDate: { gte: rangeStart, lte: rangeEnd } },
      { replacementDate: { gte: rangeStart, lte: rangeEnd } },
    ],
  };
  const rows = await db.timetableEntry.findMany({
    where: { ...scopedWhere(actor, query, entryId), periodId: period.id },
    orderBy: { id: "asc" },
    take: entryId ? 1 : query.limit + 1,
    ...(query.cursor && !entryId ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: {
      offering: { include: { course: true, cohort: true } },
      lecturer: { select: { id: true, fullName: true } },
      venue: { select: { id: true, code: true, name: true, building: true } },
      overrides: {
        where: overridesWhere,
        include: { replacementVenue: { select: { id: true, code: true, name: true, building: true } } },
      },
    },
  });
  const hasMore = !entryId && rows.length > query.limit;
  const pageRows = hasMore ? rows.slice(0, query.limit) : rows;
  const items = pageRows.flatMap((entry) => materializeEntry(entry, rangeStart, rangeEnd));
  items.sort((left, right) => {
    const dateCompare = String(left.effectiveDate).localeCompare(String(right.effectiveDate));
    return dateCompare || String(left.startTime ?? "").localeCompare(String(right.startTime ?? ""));
  });

  return {
    items,
    nextCursor: hasMore ? pageRows.at(-1)?.id ?? null : null,
  };
}

export function assertPersonalTimetableRole(actor: AuthenticatedUser): void {
  if (actor.role !== Role.STUDENT && actor.role !== Role.LECTURER) {
    throw new AppError("FORBIDDEN", "Only students and lecturers have a personal timetable", 403);
  }
}