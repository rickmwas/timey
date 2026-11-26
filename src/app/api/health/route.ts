import { db } from "@/lib/db";
import { failureResponse, successResponse } from "@/server/http/responses";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return successResponse({ status: "ok", database: "ready" });
  } catch {
    return failureResponse("SERVICE_UNAVAILABLE", "Database is unavailable", 503);
  }
}