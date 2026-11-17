import { NextRequest } from "next/server";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { requireUser } from "@/server/middleware/require-user";
import { NotificationQuerySchema } from "@/server/schemas/notifications";
import { listNotifications } from "@/server/services/notifications";

export const GET = apiHandler(async (request: NextRequest) => {
  const actor = await requireUser(request);
  const query = NotificationQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  return successResponse(await listNotifications(actor.id, query));
});