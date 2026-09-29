import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/server/middleware/require-role";
import { requireUser } from "@/server/middleware/require-user";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { AvailabilityQuerySchema } from "@/server/schemas/timetable";
import { findAvailableVenues } from "@/server/services/timetable";

export const GET = apiHandler(async (request: NextRequest) => {
  const actor = await requireUser(request, true);
  requirePermission(actor, "timetable:read");

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = AvailabilityQuerySchema.parse(params);

  const [venues, timetableEntries] = await Promise.all([
    db.venue.findMany({
      where: {
        ...(query.building ? { building: query.building } : {}),
        ...(query.minCapacity !== undefined ? { capacity: { gte: query.minCapacity } } : {}),
      },
      select: {
        id: true,
        code: true,
        name: true,
        building: true,
        capacity: true,
        isActive: true,
      },
    }),
    db.timetableEntry.findMany({
      where: {
        status: "ACTIVE",
        day: query.dayOfWeek,
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
    }),
  ]);

  return successResponse(
    findAvailableVenues(
      query,
      venues,
      timetableEntries.map((slot) => ({
        id: slot.id,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        venueId: slot.venueId,
        lecturerId: slot.lecturerId,
        offeringId: slot.offeringId,
        cohortId: slot.offering.cohortId,
      })),
    ),
  );
});
