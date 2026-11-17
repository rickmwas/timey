import { NextRequest } from "next/server";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { requireUser } from "@/server/middleware/require-user";
import { listCohorts } from "@/server/services/catalog";

export const GET = apiHandler(async (request: NextRequest) => {
  await requireUser(request);
  return successResponse({ items: await listCohorts() });
});
