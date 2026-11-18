import { NextRequest } from "next/server";
import { assertSameOrigin } from "@/server/security/csrf";
import { requireUser } from "@/server/middleware/require-user";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { ChangePasswordSchema } from "@/server/schemas/auth";
import { changePassword } from "@/server/services/auth";

export const PATCH = apiHandler(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requireUser(request, true);
  const input = ChangePasswordSchema.parse(await request.json());
  await changePassword(user.id, user.sessionId, input);
  return successResponse({ passwordChanged: true });
});