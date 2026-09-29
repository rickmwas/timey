import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/server/middleware/require-role";
import { requireUser } from "@/server/middleware/require-user";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { ValidateSlotSchema } from "@/server/schemas/timetable";
import { validateSlotForConflicts } from "@/server/services/timetable";

export const POST = apiHandler(async (request: NextRequest) => {
  const actor = await requireUser(request, true);
  requirePermission(actor, "timetable:write");

  const input = ValidateSlotSchema.parse(await request.json());

  const existingSlots = await db.timetableEntry.findMany({
    where: {
      status: "ACTIVE",
      day: input.day,
    },
    select: {
      id: true,
      day: true,
      startTime: true,
      endTime: true,
      venueId: true,
      lecturerId: true,
      offeringId: true,
      offering: {
        select: { cohortId: true },
      },
    },
  });

  const candidate = {
    id: input.id,
    day: input.day,
    startTime: input.startTime,
    endTime: input.endTime,
    venueId: input.venueId,
    lecturerId: input.lecturerId,
    offeringId: input.offeringId,
    cohortId: input.cohortId,
  };

  const mappedExistingSlots = existingSlots.map((slot) => ({
    id: slot.id,
    day: slot.day,
    startTime: slot.startTime,
    endTime: slot.endTime,
    venueId: slot.venueId,
    lecturerId: slot.lecturerId,
    offeringId: slot.offeringId,
    cohortId: slot.offering.cohortId,
  }));

  const conflicts = validateSlotForConflicts(mappedExistingSlots, candidate);

  return successResponse({
    valid: conflicts.length === 0,
    conflicts,
  });
});
