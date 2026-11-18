import { NextRequest } from "next/server";
import { AppError } from "@/server/errors/app-error";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { requirePermission } from "@/server/middleware/require-role";
import { requireUser } from "@/server/middleware/require-user";
import { ImportVersionSchema } from "@/server/schemas/imports";
import { assertSameOrigin } from "@/server/security/csrf";
import { publishImport } from "@/server/services/imports";

export const POST = apiHandler(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const actor = await requireUser(request);
  requirePermission(actor, "import:manage");
  const id = context.params.id;
  if (!uuid(id)) throw new AppError("INVALID_ID", "Import ID must be a UUID", 400);
  const { expectedVersion } = ImportVersionSchema.parse(await request.json());
  return successResponse(await publishImport(id, actor, expectedVersion));
});

function uuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}