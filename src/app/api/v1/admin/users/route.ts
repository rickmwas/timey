import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireRole } from "@/server/middleware/require-role";
import { requireUser } from "@/server/middleware/require-user";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { CreateUserSchema, UserListQuerySchema } from "@/server/schemas/user";
import { createUser, listUsers } from "@/server/services/users";
import { assertSameOrigin } from "@/server/security/csrf";

export const GET = apiHandler(async (request: NextRequest) => {
  const actor = await requireUser(request);
  requireRole(actor, Role.ADMIN);
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = UserListQuerySchema.parse(params);
  return successResponse(await listUsers(query));
});

export const POST = apiHandler(async (request: NextRequest) => {
  assertSameOrigin(request);
  const actor = await requireUser(request);
  requireRole(actor, Role.ADMIN);
  const input = CreateUserSchema.parse(await request.json());
  const result = await createUser(input, actor.id);
  return successResponse(result, 201, "User created. Provide the temporary password securely.");
});