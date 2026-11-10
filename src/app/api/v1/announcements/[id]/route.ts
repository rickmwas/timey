import { NextRequest } from "next/server";
import { AppError } from "@/server/errors/app-error";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { requirePermission } from "@/server/middleware/require-role";
import { requireUser } from "@/server/middleware/require-user";
import { UpdateAnnouncementSchema } from "@/server/schemas/announcements";
import { assertSameOrigin } from "@/server/security/csrf";
import { archiveAnnouncement, updateAnnouncement } from "@/server/services/announcements";

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const actor = await requireUser(request);
  requirePermission(actor, "announcement:publish");
  const id = context.params.id;
  if (!uuid(id)) throw new AppError("INVALID_ID", "Announcement ID must be a UUID", 400);
  const input = UpdateAnnouncementSchema.parse(await request.json());
  return successResponse({ announcement: await updateAnnouncement(actor, id, input) });
});

export const DELETE = apiHandler(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const actor = await requireUser(request);
  requirePermission(actor, "announcement:publish");
  const id = context.params.id;
  if (!uuid(id)) throw new AppError("INVALID_ID", "Announcement ID must be a UUID", 400);
  return successResponse({ announcement: await archiveAnnouncement(actor, id) });
});

function uuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}