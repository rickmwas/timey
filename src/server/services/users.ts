import { Prisma, Role, UserStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/server/errors/app-error";
import { cursorPage } from "@/server/http/pagination";
import { createProvisionedUser, deactivateUser, updateProvisionedUser } from "@/server/services/auth";

export type UserListInput = {
  search?: string;
  role?: Role;
  status?: UserStatus;
  cursor?: string;
  limit: number;
};

const publicUserSelect = {
  id: true,
  email: true,
  institutionalId: true,
  fullName: true,
  role: true,
  status: true,
  mustChangePassword: true,
  cohort: { select: { id: true, code: true, name: true } },
  department: { select: { id: true, code: true, name: true } },
  createdAt: true,
} satisfies Prisma.UserSelect;

export async function listUsers(input: UserListInput) {
  const where: Prisma.UserWhereInput = {
    ...(input.role ? { role: input.role } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.search ? {
      OR: [
        { fullName: { contains: input.search, mode: "insensitive" } },
        { email: { contains: input.search.toLowerCase(), mode: "insensitive" } },
        { institutionalId: { contains: input.search, mode: "insensitive" } },
      ],
    } : {}),
  };
  const rows = await db.user.findMany({
    where,
    select: publicUserSelect,
    orderBy: { id: "asc" },
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });
  return cursorPage(rows, input.limit);
}

export async function createUser(input: Parameters<typeof createProvisionedUser>[0], actorId: string) {
  if (input.role === "STUDENT" && !input.cohortId) {
    throw new AppError("COHORT_REQUIRED", "Students must be assigned to a cohort", 400);
  }
  return createProvisionedUser(input, actorId);
}

export async function updateUser(
  targetId: string,
  input: Parameters<typeof updateProvisionedUser>[1],
  actorId: string,
) {
  return updateProvisionedUser(targetId, input, actorId);
}

export async function deactivateAccount(targetId: string, actorId: string) {
  return deactivateUser(targetId, actorId);
}

export type AuditListInput = { actorId?: string; action?: string; entityType?: string; cursor?: string; limit: number };

export async function listAuditLogs(input: AuditListInput) {
  const rows = await db.auditLog.findMany({
    where: {
      ...(input.actorId ? { actorId: input.actorId } : {}),
      ...(input.action ? { action: input.action } : {}),
      ...(input.entityType ? { entityType: input.entityType } : {}),
    },
    select: {
      id: true,
      actorId: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });
  return cursorPage(rows, input.limit);
}