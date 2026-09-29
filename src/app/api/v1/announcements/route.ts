import { NextRequest } from "next/server";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { requirePermission } from "@/server/middleware/require-role";
import { requireUser } from "@/server/middleware/require-user";
import { AnnouncementListQuerySchema, CreateAnnouncementSchema } from "@/server/schemas/announcements";
import { assertSameOrigin } from "@/server/security/csrf";
import { createAnnouncement, listAnnouncements } from "@/server/services/announcements";

export const GET = apiHandler(async (request: NextRequest) => {
  const actor = await requireUser(request);
  const query = AnnouncementListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  return successResponse(await listAnnouncements(actor, query));
});

export const POST = apiHandler(async (request: NextRequest) => {
  assertSameOrigin(request);
  const actor = await requireUser(request);
  requirePermission(actor, "announcement:publish");
  const input = CreateAnnouncementSchema.parse(await request.json());
  return successResponse({ announcement: await createAnnouncement(actor, input) }, 201);
});