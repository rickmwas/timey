import { NextRequest } from "next/server";
import { assertSameOrigin } from "@/server/security/csrf";
import { apiHandler } from "@/server/http/route";
import { failureResponse, successResponse } from "@/server/http/responses";
import { refresh } from "@/server/services/auth";
import { setSessionCookies } from "@/server/auth/cookies";

export const POST = apiHandler(async (request: NextRequest) => {
  assertSameOrigin(request);
  const refreshToken = request.cookies.get("timy_refresh")?.value;
  if (!refreshToken) return failureResponse("UNAUTHENTICATED", "Authentication is required", 401);
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const result = await refresh(refreshToken, { userAgent: request.headers.get("user-agent"), ip });
  const response = successResponse({ user: result.user });
  setSessionCookies(response, result.tokens);
  return response;
});