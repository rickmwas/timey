import { NextRequest } from "next/server";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { requireUser } from "@/server/middleware/require-user";
import { assertSameOrigin } from "@/server/security/csrf";
import { markAllNotificationsRead } from "@/server/services/notifications";

export const POST = apiHandler(async (request: NextRequest) => {
  assertSameOrigin(request);
  const actor = await requireUser(request);
  return successResponse(await markAllNotificationsRead(actor.id));
});