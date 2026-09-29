import { NextRequest } from "next/server";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { requireUser } from "@/server/middleware/require-user";
import { TimetableReadQuerySchema } from "@/server/schemas/timetable-reads";
import { readEffectiveTimetable } from "@/server/services/timetable-reads";

export const GET = apiHandler(async (request: NextRequest) => {
  const actor = await requireUser(request);
  const query = TimetableReadQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  return successResponse(await readEffectiveTimetable(actor, query));
});