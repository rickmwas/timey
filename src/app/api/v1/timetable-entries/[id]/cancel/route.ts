import { NextRequest } from "next/server";
import { AppError } from "@/server/errors/app-error";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { requireUser } from "@/server/middleware/require-user";
import { CancelScheduleSchema } from "@/server/schemas/schedule-changes";
import { assertSameOrigin } from "@/server/security/csrf";
import { writeScheduleChange } from "@/server/services/schedule-writes";

export const POST = apiHandler(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const actor = await requireUser(request);
  const entryId = context.params.id;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(entryId)) {
    throw new AppError("INVALID_ID", "Timetable entry ID must be a UUID", 400);
  }
  const input = CancelScheduleSchema.parse(await request.json());
  return successResponse(await writeScheduleChange("cancel", entryId, actor, input, request.headers.get("idempotency-key") ?? ""));
});