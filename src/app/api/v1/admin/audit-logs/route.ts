import { Role } from "@prisma/client";
import { z } from "zod";
import { NextRequest } from "next/server";
import { requireRole } from "@/server/middleware/require-role";
import { requireUser } from "@/server/middleware/require-user";
import { apiHandler } from "@/server/http/route";
import { successResponse } from "@/server/http/responses";
import { listAuditLogs } from "@/server/services/users";

const AuditQuerySchema = z.object({
  actorId: z.string().uuid().optional(),
  action: z.string().trim().min(1).max(64).optional(),
  entityType: z.string().trim().min(1).max(64).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const GET = apiHandler(async (request: NextRequest) => {
  const actor = await requireUser(request);
  requireRole(actor, Role.ADMIN);
  const query = AuditQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  return successResponse(await listAuditLogs(query));
});