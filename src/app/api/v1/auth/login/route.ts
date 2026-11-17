import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { apiHandler } from "@/server/http/route";
import { failureResponse, successResponse } from "@/server/http/responses";
import { LoginSchema } from "@/server/schemas/auth";
import { login } from "@/server/services/auth";
import { loginRateLimiter } from "@/server/security/rate-limit";
import { setSessionCookies } from "@/server/auth/cookies";

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export const POST = apiHandler(async (request: NextRequest) => {
  const input = LoginSchema.parse(await request.json());
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const accountKey = `login:account:${digest(input.identifier.toLowerCase())}`;
  const sourceKey = `login:source:${digest(ip)}`;
  const accountLimit = loginRateLimiter.consume(accountKey, 5, 15 * 60 * 1000);
  const sourceLimit = loginRateLimiter.consume(sourceKey, 30, 15 * 60 * 1000);
  if (!accountLimit.allowed || !sourceLimit.allowed) {
    const response = failureResponse("RATE_LIMITED", "Too many login attempts", 429);
    response.headers.set("Retry-After", String(Math.max(accountLimit.retryAfterSeconds, sourceLimit.retryAfterSeconds)));
    return response;
  }

  try {
    const result = await login(input, {
      userAgent: request.headers.get("user-agent"),
      ip,
    });
    loginRateLimiter.reset(accountKey);
    const response = successResponse({ user: result.user });
    setSessionCookies(response, result.tokens);
    return response;
  } catch (error) {
    if (error instanceof Error && "statusCode" in error && error.statusCode === 401) {
      return failureResponse("INVALID_CREDENTIALS", "Invalid identifier or password", 401);
    }
    throw error;
  }
});