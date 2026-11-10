import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireRole } from "@/server/middleware/require-role";
import { requireUser } from "@/server/middleware/require-user";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { UpdateUserSchema } from "@/server/schemas/user";
import { updateUser } from "@/server/services/users";
import { assertSameOrigin } from "@/server/security/csrf";
import { AppError } from "@/server/errors/app-error";

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const actor = await requireUser(request);
  requireRole(actor, Role.ADMIN);
  const id = context.params.id;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new AppError("INVALID_ID", "User ID must be a UUID", 400);
  }
  const input = UpdateUserSchema.parse(await request.json());
  return successResponse({ user: await updateUser(id, input, actor.id) });
});