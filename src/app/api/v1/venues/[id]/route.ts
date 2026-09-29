import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { AppError } from "@/server/errors/app-error";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { requireRole } from "@/server/middleware/require-role";
import { requireUser } from "@/server/middleware/require-user";
import { UpdateVenueSchema } from "@/server/schemas/venue";
import { assertSameOrigin } from "@/server/security/csrf";
import { deactivateVenue, updateVenue } from "@/server/services/catalog";

function validateVenueId(id: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new AppError("INVALID_ID", "Venue ID must be a UUID", 400);
  }
}

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const actor = await requireUser(request);
  requireRole(actor, Role.TIMETABLE_OFFICER, Role.ADMIN);
  const id = context.params.id;
  validateVenueId(id);
  const input = UpdateVenueSchema.parse(await request.json());
  return successResponse({ venue: await updateVenue(id, input, actor.id) });
});

export const DELETE = apiHandler(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const actor = await requireUser(request);
  requireRole(actor, Role.TIMETABLE_OFFICER, Role.ADMIN);
  const id = context.params.id;
  validateVenueId(id);
  return successResponse({ venue: await deactivateVenue(id, actor.id) });
});