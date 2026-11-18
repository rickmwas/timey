import type { NextRequest } from "next/server";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/server/errors/app-error";
import { verifyAccessToken } from "@/server/auth/tokens";

export type AuthenticatedUser = {
  id: string;
  email: string;
  institutionalId: string;
  fullName: string;
  role: Role;
  cohortId: string | null;
  departmentId: string | null;
  mustChangePassword: boolean;
  sessionId: string;
};

export async function requireUser(request: NextRequest, allowPasswordChange = false): Promise<AuthenticatedUser> {
  const token = request.cookies.get("timy_access")?.value;
  if (!token) throw new AppError("UNAUTHENTICATED", "Authentication is required", 401);

  let claims;
  try {
    claims = await verifyAccessToken(token);
  } catch {
    throw new AppError("UNAUTHENTICATED", "Authentication is required", 401);
  }

  const session = await db.authSession.findUnique({
    where: { id: claims.sessionId },
    include: { user: true },
  });
  const now = new Date();
  if (
    !session || session.userId !== claims.userId || session.revokedAt || session.expiresAt <= now ||
    session.user.status !== "ACTIVE"
  ) {
    throw new AppError("UNAUTHENTICATED", "Authentication is required", 401);
  }
  if (!allowPasswordChange && session.user.mustChangePassword) {
    throw new AppError("PASSWORD_CHANGE_REQUIRED", "Change your temporary password to continue", 403);
  }

  return {
    id: session.user.id,
    email: session.user.email,
    institutionalId: session.user.institutionalId,
    fullName: session.user.fullName,
    role: session.user.role,
    cohortId: session.user.cohortId,
    departmentId: session.user.departmentId,
    mustChangePassword: session.user.mustChangePassword,
    sessionId: session.id,
  };
}