import { NextRequest } from "next/server";
import { requireUser } from "@/server/middleware/require-user";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { getCurrentUser } from "@/server/services/auth";

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireUser(request, true);
  return successResponse({ user: await getCurrentUser(user.id) });
});