import type { NextRequest } from "next/server";
import { env } from "@/server/config/env";
import { AppError } from "@/server/errors/app-error";

export function assertSameOrigin(request: NextRequest): void {
  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");
  const source = originHeader ?? refererHeader;
  if (!source) throw new AppError("CSRF_REJECTED", "Request origin is required", 403);

  let sourceOrigin: string;
  try {
    sourceOrigin = new URL(source).origin;
  } catch {
    throw new AppError("CSRF_REJECTED", "Request origin is invalid", 403);
  }

  if (sourceOrigin !== new URL(env.APP_URL).origin) {
    throw new AppError("CSRF_REJECTED", "Request origin is not allowed", 403);
  }
}