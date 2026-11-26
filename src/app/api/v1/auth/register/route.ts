import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { apiHandler } from "@/server/http/route";
import { failureResponse, successResponse } from "@/server/http/responses";
import { RegisterStudentSchema } from "@/server/schemas/auth";
import { registerStudent } from "@/server/services/auth";
import { loginRateLimiter } from "@/server/security/rate-limit";
import { setSessionCookies } from "@/server/auth/cookies";

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export const POST = apiHandler(async (request: NextRequest) => {
  const input = RegisterStudentSchema.parse(await request.json());
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const sourceKey = `register:source:${digest(ip)}`;
  const sourceLimit = loginRateLimiter.consume(sourceKey, 15, 15 * 60 * 1000);
  if (!sourceLimit.allowed) {
    const response = failureResponse("RATE_LIMITED", "Too many registration attempts from this network", 429);
    response.headers.set("Retry-After", String(sourceLimit.retryAfterSeconds));
    return response;
  }

  const result = await registerStudent(input, {
    userAgent: request.headers.get("user-agent"),
    ip,
  });

  const response = successResponse({ user: result.user }, 201);
  setSessionCookies(response, result.tokens);
  return response;
});
