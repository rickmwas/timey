import { NextRequest } from "next/server";
import { AppError } from "@/server/errors/app-error";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { requirePermission } from "@/server/middleware/require-role";
import { requireUser } from "@/server/middleware/require-user";
import { getImport } from "@/server/services/imports";

export const GET = apiHandler(async (_request: NextRequest, context) => {
  const actor = await requireUser(_request);
  requirePermission(actor, "import:manage");
  const id = context.params.id;
  if (!uuid(id)) throw new AppError("INVALID_ID", "Import ID must be a UUID", 400);
  return successResponse({ job: await getImport(id) });
});

function uuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}