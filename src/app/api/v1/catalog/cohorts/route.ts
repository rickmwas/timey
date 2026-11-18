import { NextRequest } from "next/server";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { listCohorts } from "@/server/services/catalog";

export const GET = apiHandler(async (_request: NextRequest) => {
  return successResponse({ items: await listCohorts() });
});

