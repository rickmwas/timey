import { detectSlotConflicts, type SlotLike, type SlotConflict } from "@/server/services/conflicts";

export type ScheduleChangeType = "VENUE_SWAP" | "TIME_RESCHEDULE" | "POSTPONEMENT" | "CANCELLATION";

export type ScheduleStatusLike = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  venueId: string;
  lecturerId: string;
  offeringId: string;
  cohortId: string;
};

export type ScheduleChangeMetadata = {
  changeType: ScheduleChangeType;
  reason: string;
  previous: {
    day: string;
    startTime: string;
    endTime: string;
    venueId: string;
    lecturerId: string;
  };
  next: {
    day: string;
    startTime: string;
    endTime: string;
    venueId: string;
    lecturerId: string;
  };
};

export function buildScheduleChangeMetadata(
  previous: ScheduleStatusLike,
  next: ScheduleStatusLike,
  reason: string,
): ScheduleChangeMetadata {
  const sameVenue = previous.venueId === next.venueId;
  const sameTime = previous.day === next.day && previous.startTime === next.startTime && previous.endTime === next.endTime;

  let changeType: ScheduleChangeType = "VENUE_SWAP";
  if (!sameTime && !sameVenue) changeType = "TIME_RESCHEDULE";
  else if (!sameTime) changeType = "TIME_RESCHEDULE";
  else if (!sameVenue) changeType = "VENUE_SWAP";

  return {
    changeType,
    reason,
    previous: {
      day: previous.day,
      startTime: previous.startTime,
      endTime: previous.endTime,
      venueId: previous.venueId,
      lecturerId: previous.lecturerId,
    },
    next: {
      day: next.day,
      startTime: next.startTime,
      endTime: next.endTime,
      venueId: next.venueId,
      lecturerId: next.lecturerId,
    },
  };
}

export function buildNotificationMessage(input: {
  changeType: ScheduleChangeType;
  previous: { day: string; startTime: string; endTime: string; venueId: string; lecturerId: string };
  next: { day: string; startTime: string; endTime: string; venueId: string; lecturerId: string };
}): string {
  return [
    `Schedule update: ${input.changeType}`,
    `Previous: ${input.previous.day} ${input.previous.startTime}-${input.previous.endTime} at ${input.previous.venueId}`,
    `Updated: ${input.next.day} ${input.next.startTime}-${input.next.endTime} at ${input.next.venueId}`,
    `Lecturer changed from ${input.previous.lecturerId} to ${input.next.lecturerId}`,
  ].join(" | ");
}

export function validateRescheduleProposal(existingSlots: SlotLike[], candidate: SlotLike): { hasConflict: boolean; conflicts: SlotConflict[] } {
  const conflicts = detectSlotConflicts([...existingSlots, candidate]).filter(
    (conflict) => conflict.sourceId === candidate.id || conflict.targetId === candidate.id,
  );

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}
