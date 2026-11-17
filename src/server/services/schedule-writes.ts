import {
  NotificationType,
  DayOfWeek,
  Prisma,
  Role,
  ScheduleOverrideType,
} from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/server/errors/app-error";
import type { AuthenticatedUser } from "@/server/middleware/require-user";
import { detectSlotConflicts, type SlotLike } from "@/server/services/conflicts";
import { buildNotificationMessage, buildScheduleChangeMetadata, type ScheduleChangeType as ScheduleChangeLabel } from "@/server/services/schedule-ops";
import { createNotificationBatch } from "@/server/services/notifications";

type MutationAction = "reschedule" | "cancel" | "postpone";
type MutationInput = {
  occurrenceDate: string;
  expectedVersion: number;
  reason: string;
  replacementDate?: string;
  startTime?: string;
  endTime?: string;
  venueId?: string;
};

const dayNames = [DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY];

function asDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function dayForDate(value: Date): DayOfWeek {
  return dayNames[value.getUTCDay()];
}

function dateLabel(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function authorize(actor: AuthenticatedUser, lecturerId: string): void {
  if (
    actor.role === Role.ADMIN ||
    actor.role === Role.TIMETABLE_OFFICER ||
    (actor.role === Role.LECTURER && actor.id === lecturerId)
  ) return;
  throw new AppError("FORBIDDEN", "Only the assigned lecturer or timetable staff can change this class", 403);
}

function conflictError(): AppError {
  return new AppError("SCHEDULE_CONFLICT", "The occurrence changed or conflicts with another class", 409);
}

async function findOccurrenceConflicts(
  transaction: Prisma.TransactionClient,
  input: {
    entryId: string;
    periodId: string;
    occurrenceDate: Date;
    candidate: SlotLike;
  },
) {
  const entries = await transaction.timetableEntry.findMany({
    where: { periodId: input.periodId, status: "ACTIVE" },
    select: {
      id: true,
      day: true,
      startTime: true,
      endTime: true,
      venueId: true,
      lecturerId: true,
      offeringId: true,
      offering: { select: { cohortId: true } },
      overrides: {
        where: { occurrenceDate: input.occurrenceDate },
        select: {
          type: true,
          replacementDate: true,
          replacementDay: true,
          replacementStartTime: true,
          replacementEndTime: true,
          replacementVenueId: true,
        },
      },
    },
  });
  const movedOverrides = await transaction.scheduleOverride.findMany({
    where: {
      replacementDate: input.occurrenceDate,
      type: { in: [ScheduleOverrideType.RESCHEDULED, ScheduleOverrideType.POSTPONED] },
      entry: { periodId: input.periodId, status: "ACTIVE" },
      occurrenceDate: { not: input.occurrenceDate },
    },
    select: {
      entryId: true,
      replacementDay: true,
      replacementStartTime: true,
      replacementEndTime: true,
      replacementVenueId: true,
      entry: {
        select: {
          id: true,
          lecturerId: true,
          offeringId: true,
          offering: { select: { cohortId: true } },
        },
      },
    },
  });

  const current: SlotLike[] = [];
  for (const entry of entries) {
    if (entry.id === input.entryId) continue;
    const override = entry.overrides[0];
    if (!override) {
      if (entry.day === input.candidate.day) current.push({ ...entry, cohortId: entry.offering.cohortId });
      continue;
    }
    if (
      override.replacementDate?.getTime() === input.occurrenceDate.getTime() &&
      override.replacementDay && override.replacementStartTime && override.replacementEndTime && override.replacementVenueId
    ) {
      current.push({
        id: entry.id,
        day: override.replacementDay,
        startTime: override.replacementStartTime,
        endTime: override.replacementEndTime,
        venueId: override.replacementVenueId,
        lecturerId: entry.lecturerId,
        offeringId: entry.offeringId,
        cohortId: entry.offering.cohortId,
      });
    }
  }

  for (const override of movedOverrides) {
    if (override.entryId === input.entryId) continue;
    if (!override.replacementDay || !override.replacementStartTime || !override.replacementEndTime || !override.replacementVenueId) continue;
    current.push({
      id: override.entry.id,
      day: override.replacementDay,
      startTime: override.replacementStartTime,
      endTime: override.replacementEndTime,
      venueId: override.replacementVenueId,
      lecturerId: override.entry.lecturerId,
      offeringId: override.entry.offeringId,
      cohortId: override.entry.offering.cohortId,
    });
  }

  return detectSlotConflicts([...current, input.candidate]).filter(
    (conflict) => conflict.sourceId === input.candidate.id || conflict.targetId === input.candidate.id,
  );
}

function scheduleChangeType(
  action: MutationAction,
  previous: { day: string; startTime: string; endTime: string; venueId: string; lecturerId: string },
  next: { day: string; startTime: string; endTime: string; venueId: string; lecturerId: string },
  dateChanged: boolean,
): ScheduleChangeLabel {
  if (action === "cancel") return "CANCELLATION";
  if (action === "postpone") return "POSTPONEMENT";
  if (dateChanged) return "TIME_RESCHEDULE";
  return buildScheduleChangeMetadata({ id: "", offeringId: "", cohortId: "", ...previous }, { id: "", offeringId: "", cohortId: "", ...next }, "").changeType === "VENUE_SWAP"
    ? "VENUE_SWAP"
    : "TIME_RESCHEDULE";
}

function notificationType(changeType: ScheduleChangeLabel): NotificationType {
  if (changeType === "CANCELLATION") return NotificationType.SCHEDULE_CANCELLED;
  if (changeType === "POSTPONEMENT") return NotificationType.SCHEDULE_POSTPONED;
  return NotificationType.SCHEDULE_RESCHEDULED;
}

function serializeSlot(slot: {
  date: Date;
  day: string;
  startTime: string | null;
  endTime: string | null;
  venueId: string | null;
  lecturerId: string;
  type?: ScheduleOverrideType;
}): Prisma.InputJsonObject {
  return {
    date: dateLabel(slot.date),
    day: slot.day,
    startTime: slot.startTime,
    endTime: slot.endTime,
    venueId: slot.venueId,
    lecturerId: slot.lecturerId,
    status: slot.type ?? "SCHEDULED",
  };
}

export async function writeScheduleChange(
  action: MutationAction,
  entryId: string,
  actor: AuthenticatedUser,
  input: MutationInput,
  idempotencyKey: string,
) {
  if (!idempotencyKey || idempotencyKey.length > 128) {
    throw new AppError("IDEMPOTENCY_KEY_REQUIRED", "Provide an Idempotency-Key header of at most 128 characters", 400);
  }

  try {
    return await db.$transaction(async (transaction) => {
      const entry = await transaction.timetableEntry.findUnique({
        where: { id: entryId },
        include: {
          offering: { include: { course: true } },
          period: true,
          venue: true,
        },
      });
      if (!entry || entry.status !== "ACTIVE") throw new AppError("NOT_FOUND", "Active timetable entry not found", 404);
      authorize(actor, entry.lecturerId);

      const occurrenceDate = asDate(input.occurrenceDate);
      if (occurrenceDate < entry.period.startDate || occurrenceDate > entry.period.endDate) {
        throw new AppError("INVALID_OCCURRENCE_DATE", "Occurrence date is outside the academic period", 400);
      }
      if (dayForDate(occurrenceDate) !== entry.day) {
        throw new AppError("INVALID_OCCURRENCE_DATE", "Occurrence date does not match the timetable entry day", 400);
      }

      const existingChange = await transaction.scheduleChange.findUnique({
        where: { actorId_idempotencyKey: { actorId: actor.id, idempotencyKey } },
        include: { override: true },
      });
      const expectedChangeTypes: readonly ScheduleChangeLabel[] = action === "cancel"
        ? ["CANCELLATION"]
        : action === "postpone"
          ? ["POSTPONEMENT"]
          : ["VENUE_SWAP", "TIME_RESCHEDULE"];
      if (existingChange) {
        if (existingChange.entryId !== entryId || !expectedChangeTypes.includes(existingChange.changeType as ScheduleChangeLabel)) {
          throw new AppError("IDEMPOTENCY_KEY_REUSED", "This Idempotency-Key was already used for a different operation", 409);
        }
        return { change: existingChange, override: existingChange.override, notificationCount: 0, replayed: true };
      }

      const currentOverride = await transaction.scheduleOverride.findUnique({
        where: { entryId_occurrenceDate: { entryId, occurrenceDate } },
      });
      const actualVersion = entry.version;
      if (input.expectedVersion !== actualVersion) throw conflictError();

      const replacementDateValue = action === "cancel"
        ? null
        : action === "postpone"
          ? asDate(input.replacementDate!)
          : asDate(input.replacementDate ?? input.occurrenceDate);
      if (replacementDateValue && (replacementDateValue < entry.period.startDate || replacementDateValue > entry.period.endDate)) {
        throw new AppError("INVALID_REPLACEMENT_DATE", "Replacement date is outside the academic period", 400);
      }
      const replacementDay = replacementDateValue ? dayForDate(replacementDateValue) : null;
      const hasCompleteReplacementTime = Boolean(input.startTime && input.endTime);
      const nextStartTime = action === "cancel" ? null : action === "postpone" && !hasCompleteReplacementTime ? null : input.startTime ?? entry.startTime;
      const nextEndTime = action === "cancel" ? null : action === "postpone" && !hasCompleteReplacementTime ? null : input.endTime ?? entry.endTime;
      const nextVenueId = action === "cancel" ? null : action === "postpone" && !input.venueId ? null : input.venueId ?? entry.venueId;
      const overrideType = action === "cancel"
        ? ScheduleOverrideType.CANCELLED
        : action === "postpone"
          ? ScheduleOverrideType.POSTPONED
          : ScheduleOverrideType.RESCHEDULED;

      if (action !== "cancel" && (action === "reschedule" || (nextStartTime && nextEndTime && nextVenueId))) {
        const candidate: SlotLike = {
          id: entry.id,
          day: replacementDay ?? entry.day,
          startTime: nextStartTime ?? entry.startTime,
          endTime: nextEndTime ?? entry.endTime,
          venueId: nextVenueId ?? entry.venueId,
          lecturerId: entry.lecturerId,
          offeringId: entry.offeringId,
          cohortId: entry.offering.cohortId,
        };
        const conflicts = await findOccurrenceConflicts(transaction, {
          entryId,
          periodId: entry.periodId,
          occurrenceDate: replacementDateValue ?? occurrenceDate,
          candidate,
        });
        if (conflicts.length > 0) throw new AppError("SCHEDULE_CONFLICT", "The proposed occurrence conflicts with another class", 409, conflicts);
      }

      const previous = {
        date: currentOverride?.replacementDate ?? occurrenceDate,
        day: currentOverride?.replacementDay ?? entry.day,
        startTime: currentOverride?.replacementStartTime ?? entry.startTime,
        endTime: currentOverride?.replacementEndTime ?? entry.endTime,
        venueId: currentOverride?.replacementVenueId ?? entry.venueId,
        lecturerId: entry.lecturerId,
        ...(currentOverride ? { type: currentOverride.type } : {}),
      };
      const next = {
        date: replacementDateValue ?? occurrenceDate,
        day: replacementDay ?? entry.day,
        startTime: nextStartTime,
        endTime: nextEndTime,
        venueId: nextVenueId,
        lecturerId: entry.lecturerId,
        type: overrideType,
      };
      const beforeJson = serializeSlot(previous);
      const afterJson = serializeSlot(next);

      const overrideData = {
        type: overrideType,
        replacementDate: replacementDateValue,
        replacementDay,
        replacementStartTime: nextStartTime,
        replacementEndTime: nextEndTime,
        replacementVenueId: nextVenueId,
        reason: input.reason,
        createdById: actor.id,
        version: (currentOverride?.version ?? 0) + 1,
      };
      const versionUpdate = await transaction.timetableEntry.updateMany({
        where: { id: entryId, version: actualVersion, status: "ACTIVE" },
        data: { version: { increment: 1 } },
      });
      if (versionUpdate.count !== 1) throw conflictError();

      const override = currentOverride
        ? await transaction.scheduleOverride.update({ where: { id: currentOverride.id }, data: overrideData })
        : await transaction.scheduleOverride.create({ data: { entryId, occurrenceDate, ...overrideData } });

      const previousMessageShape = {
        day: previous.day,
        startTime: previous.startTime ?? "TBD",
        endTime: previous.endTime ?? "TBD",
        venueId: previous.venueId ?? "TBD",
        lecturerId: previous.lecturerId,
      };
      const nextMessageShape = {
        day: next.day,
        startTime: next.startTime ?? "TBD",
        endTime: next.endTime ?? "TBD",
        venueId: next.venueId ?? "TBD",
        lecturerId: next.lecturerId,
      };
      const changeType = scheduleChangeType(
        action,
        previousMessageShape,
        nextMessageShape,
        dateLabel(previous.date) !== dateLabel(next.date),
      );
      const message = action === "cancel"
        ? `${entry.offering.course.code} on ${dateLabel(occurrenceDate)} is cancelled. ${input.reason}`
        : action === "postpone"
          ? `${entry.offering.course.code} on ${dateLabel(occurrenceDate)} is postponed to ${dateLabel(next.date)}. Time and venue: ${next.startTime && next.endTime && next.venueId ? `${next.startTime}-${next.endTime} at ${next.venueId}` : "TBD"}. ${input.reason}`
          : buildNotificationMessage({ changeType, previous: previousMessageShape, next: nextMessageShape });
      const change = await transaction.scheduleChange.create({
        data: {
          entryId,
          overrideId: override.id,
          idempotencyKey,
          changeType,
          before: beforeJson,
          after: afterJson,
          actorId: actor.id,
          reason: input.reason,
        },
      });
      await transaction.auditLog.create({
        data: {
          actorId: actor.id,
          action: `SCHEDULE_${changeType}`,
          entityType: "TimetableEntry",
          entityId: entryId,
          metadata: { occurrenceDate: input.occurrenceDate, overrideId: override.id, version: override.version },
        },
      });

      const recipients = await transaction.user.findMany({
        where: { cohortId: entry.offering.cohortId, role: Role.STUDENT, status: "ACTIVE" },
        select: { id: true },
      });
      const notificationTypeValue = notificationType(changeType);
      const notificationCount = await createNotificationBatch(transaction, recipients.map(({ id }) => ({
          recipientId: id,
          sourceChangeId: change.id,
          title: `${entry.offering.course.code}: ${changeType.replace(/_/g, " ").toLowerCase()}`,
          message,
          type: notificationTypeValue,
        })));

      return { change, override, notificationCount, replayed: false };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) {
      throw conflictError();
    }
    throw error;
  }
}