import { NextRequest } from "next/server";
import { AppError } from "@/server/errors/app-error";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { requirePermission } from "@/server/middleware/require-role";
import { requireUser } from "@/server/middleware/require-user";
import { ImportRowCorrectionSchema } from "@/server/schemas/imports";
import { assertSameOrigin } from "@/server/security/csrf";
import { correctImportRow } from "@/server/services/imports";

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const actor = await requireUser(request);
  requirePermission(actor, "import:manage");
  const { id, rowId } = context.params;
  if (!uuid(id) || !uuid(rowId)) throw new AppError("INVALID_ID", "Import and row IDs must be UUIDs", 400);
  const input = ImportRowCorrectionSchema.parse(await request.json());
  return successResponse({ row: await correctImportRow(id, rowId, input) });
});

function uuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}