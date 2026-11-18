import { NextRequest } from "next/server";
import { clearSessionCookies } from "@/server/auth/cookies";
import { assertSameOrigin } from "@/server/security/csrf";
import { requireUser } from "@/server/middleware/require-user";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { logout } from "@/server/services/auth";

export const POST = apiHandler(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requireUser(request, true);
  await logout(user.sessionId);
  const response = successResponse({ loggedOut: true });
  clearSessionCookies(response);
  return response;
});