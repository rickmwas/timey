import { NextRequest } from "next/server";
import { AppError } from "@/server/errors/app-error";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { requireUser } from "@/server/middleware/require-user";
import { TimetableReadQuerySchema } from "@/server/schemas/timetable-reads";
import { readEffectiveTimetable } from "@/server/services/timetable-reads";

export const GET = apiHandler(async (request: NextRequest, context) => {
  const actor = await requireUser(request);
  const entryId = context.params.id;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(entryId)) {
    throw new AppError("INVALID_ID", "Timetable entry ID must be a UUID", 400);
  }
  const query = TimetableReadQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  return successResponse(await readEffectiveTimetable(actor, query, entryId));
});