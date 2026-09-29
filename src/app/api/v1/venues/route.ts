import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { requireRole } from "@/server/middleware/require-role";
import { requireUser } from "@/server/middleware/require-user";
import { VenueInputSchema, VenueListQuerySchema } from "@/server/schemas/venue";
import { assertSameOrigin } from "@/server/security/csrf";
import { createVenue, listVenues } from "@/server/services/catalog";

export const GET = apiHandler(async (request: NextRequest) => {
  const actor = await requireUser(request);
  requireRole(actor, Role.STUDENT, Role.LECTURER, Role.TIMETABLE_OFFICER, Role.ADMIN);
  const query = VenueListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  return successResponse(await listVenues(query));
});

export const POST = apiHandler(async (request: NextRequest) => {
  assertSameOrigin(request);
  const actor = await requireUser(request);
  requireRole(actor, Role.TIMETABLE_OFFICER, Role.ADMIN);
  const input = VenueInputSchema.parse(await request.json());
  return successResponse({ venue: await createVenue(input, actor.id) }, 201);
});