import { NextRequest } from "next/server";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { requireUser } from "@/server/middleware/require-user";
import { AppError } from "@/server/errors/app-error";
import { getActiveAcademicPeriod } from "@/server/services/catalog";

export const GET = apiHandler(async (request: NextRequest) => {
  await requireUser(request);
  const period = await getActiveAcademicPeriod();
  if (!period) throw new AppError("ACADEMIC_PERIOD_NOT_FOUND", "No active academic period was found", 404);
  return successResponse({ period });
});
