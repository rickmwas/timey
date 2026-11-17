import type { Role } from "@prisma/client";
import { hasPermission, type Permission } from "@/server/auth/permissions";
import { AppError } from "@/server/errors/app-error";
import type { AuthenticatedUser } from "@/server/middleware/require-user";

export function requireRole(user: AuthenticatedUser, ...roles: Role[]): void {
  if (!roles.includes(user.role)) throw new AppError("FORBIDDEN", "You do not have permission to perform this action", 403);
}

export function requirePermission(user: AuthenticatedUser, permission: Permission): void {
  if (!hasPermission(user.role, permission)) throw new AppError("FORBIDDEN", "You do not have permission to perform this action", 403);
}