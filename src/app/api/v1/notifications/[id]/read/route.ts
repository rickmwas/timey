import { NextRequest } from "next/server";
import { AppError } from "@/server/errors/app-error";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { requireUser } from "@/server/middleware/require-user";
import { assertSameOrigin } from "@/server/security/csrf";
import { markNotificationRead } from "@/server/services/notifications";

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const actor = await requireUser(request);
  const id = context.params.id;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new AppError("INVALID_ID", "Notification ID must be a UUID", 400);
  }
  return successResponse(await markNotificationRead(actor.id, id));
});