export type SlotConflictType =
  | "VENUE_CONFLICT"
  | "LECTURER_CONFLICT"
  | "COHORT_CONFLICT"
  | "CAPACITY_CONFLICT"
  | "STUDENT_ENROLLMENT_CONFLICT";

export type SlotLike = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  venueId: string;
  lecturerId: string;
  offeringId: string;
  cohortId: string;
  venueCapacity?: number;
  cohortExpectedSize?: number;
  enrolledStudentIds?: string[];
};

export type SlotConflict = {
  type: SlotConflictType;
  sourceId: string;
  targetId: string;
  day: string;
  startTime: string;
  endTime: string;
  venueId?: string;
  lecturerId?: string;
  cohortId?: string;
  details?: string;
};

export function normalizeTimeToMinutes(value: string): number {
  const [hourText, minuteText] = value.split(":");
  const hours = Number.parseInt(hourText ?? "0", 10);
  const minutes = Number.parseInt(minuteText ?? "0", 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new Error(`Invalid time value: ${value}`);
  }

  return hours * 60 + minutes;
}

export function isTimeRangeOverlapping(startA: string, endA: string, startB: string, endB: string): boolean {
  const startAInMinutes = normalizeTimeToMinutes(startA);
  const endAInMinutes = normalizeTimeToMinutes(endA);
  const startBInMinutes = normalizeTimeToMinutes(startB);
  const endBInMinutes = normalizeTimeToMinutes(endB);

  return startAInMinutes < endBInMinutes && endAInMinutes > startBInMinutes;
}

export function detectSlotConflicts(slots: SlotLike[]): SlotConflict[] {
  const conflicts: SlotConflict[] = [];

  // Check venue capacity violations individually
  for (const slot of slots) {
    if (slot.venueCapacity && slot.cohortExpectedSize && slot.cohortExpectedSize > slot.venueCapacity) {
      conflicts.push({
        type: "CAPACITY_CONFLICT",
        sourceId: slot.id,
        targetId: slot.id,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        venueId: slot.venueId,
        cohortId: slot.cohortId,
        details: `Cohort expected size (${slot.cohortExpectedSize}) exceeds venue capacity (${slot.venueCapacity})`,
      });
    }
  }

  for (let index = 0; index < slots.length; index += 1) {
    const current = slots[index];

    for (let nextIndex = index + 1; nextIndex < slots.length; nextIndex += 1) {
      const other = slots[nextIndex];
      if (current.day !== other.day) continue;
      if (!isTimeRangeOverlapping(current.startTime, current.endTime, other.startTime, other.endTime)) continue;

      if (current.venueId === other.venueId && current.id !== other.id) {
        conflicts.push({
          type: "VENUE_CONFLICT",
          sourceId: current.id,
          targetId: other.id,
          day: current.day,
          startTime: current.startTime,
          endTime: current.endTime,
          venueId: current.venueId,
        });
      }

      if (current.lecturerId === other.lecturerId && current.id !== other.id) {
        conflicts.push({
          type: "LECTURER_CONFLICT",
          sourceId: current.id,
          targetId: other.id,
          day: current.day,
          startTime: current.startTime,
          endTime: current.endTime,
          lecturerId: current.lecturerId,
        });
      }

      if (current.cohortId === other.cohortId && current.id !== other.id) {
        conflicts.push({
          type: "COHORT_CONFLICT",
          sourceId: current.id,
          targetId: other.id,
          day: current.day,
          startTime: current.startTime,
          endTime: current.endTime,
          cohortId: current.cohortId,
        });
      }

      // Check student enrollment intersection clash
      if (
        current.enrolledStudentIds &&
        other.enrolledStudentIds &&
        current.id !== other.id
      ) {
        const otherSet = new Set(other.enrolledStudentIds);
        const clashingStudents = current.enrolledStudentIds.filter((s) => otherSet.has(s));
        if (clashingStudents.length > 0) {
          conflicts.push({
            type: "STUDENT_ENROLLMENT_CONFLICT",
            sourceId: current.id,
            targetId: other.id,
            day: current.day,
            startTime: current.startTime,
            endTime: current.endTime,
            details: `${clashingStudents.length} student(s) enrolled in both concurrent units`,
          });
        }
      }
    }
  }

  return conflicts;
}
