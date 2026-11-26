import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Prisma, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/server/errors/app-error";
import { hashPassword, validatePassword, verifyPassword } from "@/server/auth/passwords";
import { createRefreshToken, hashRefreshToken, refreshExpiry, signAccessToken } from "@/server/auth/tokens";
import type { ChangePasswordInput, LoginInput, RegisterStudentInput } from "@/server/schemas/auth";

const userSelect = {
  id: true,
  email: true,
  institutionalId: true,
  fullName: true,
  role: true,
  status: true,
  mustChangePassword: true,
  cohortId: true,
  departmentId: true,
  createdAt: true,
  cohort: { select: { id: true, code: true, name: true } },
  department: { select: { id: true, code: true, name: true } },
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

function hashIp(ip: string | null): string | null {
  return ip ? createHash("sha256").update(ip).digest("hex") : null;
}

export async function login(input: LoginInput, metadata: { userAgent: string | null; ip: string | null }) {
  const account = await db.user.findFirst({
    where: {
      OR: [
        { email: input.identifier.toLowerCase() },
        { institutionalId: input.identifier },
      ],
    },
  });

  if (!account || account.status !== "ACTIVE" || !(await verifyPassword(input.password, account.passwordHash))) {
    throw new AppError("INVALID_CREDENTIALS", "Invalid identifier or password", 401);
  }

  const sessionId = randomUUID();
  const refreshToken = createRefreshToken();
  const now = new Date();
  const session = await db.authSession.create({
    data: {
      id: sessionId,
      userId: account.id,
      familyId: sessionId,
      refreshTokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshExpiry(now),
      userAgent: metadata.userAgent?.slice(0, 512) ?? null,
      ipHash: hashIp(metadata.ip),
    },
  });

  const accessToken = await signAccessToken({ userId: account.id, sessionId: session.id, role: account.role });
  const user = await db.user.findUniqueOrThrow({ where: { id: account.id }, select: userSelect });
  return { user, tokens: { accessToken, refreshToken } satisfies SessionTokens };
}

export async function registerStudent(input: RegisterStudentInput, metadata: { userAgent: string | null; ip: string | null }) {
  const existing = await db.user.findFirst({
    where: {
      OR: [
        { email: input.email.toLowerCase() },
        { institutionalId: input.institutionalId },
      ],
    },
  });

  if (existing) {
    throw new AppError("ACCOUNT_EXISTS", "A user with this email or admission number already exists", 409);
  }

  validatePassword(input.password, input.email, input.institutionalId);

  const cohort = await db.cohort.findUnique({
    where: { id: input.cohortId },
    select: { id: true, departmentId: true, isActive: true },
  });

  if (!cohort || !cohort.isActive) {
    throw new AppError("NOT_FOUND", "Selected academic cohort was not found or is inactive", 404);
  }

  const passwordHash = await hashPassword(input.password);

  const account = await db.user.create({
    data: {
      email: input.email.toLowerCase(),
      institutionalId: input.institutionalId,
      fullName: input.fullName,
      role: Role.STUDENT,
      status: "ACTIVE",
      mustChangePassword: false,
      cohortId: cohort.id,
      departmentId: cohort.departmentId,
      passwordHash,
    },
  });

  const sessionId = randomUUID();
  const refreshToken = createRefreshToken();
  const now = new Date();
  const session = await db.authSession.create({
    data: {
      id: sessionId,
      userId: account.id,
      familyId: sessionId,
      refreshTokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshExpiry(now),
      userAgent: metadata.userAgent?.slice(0, 512) ?? null,
      ipHash: hashIp(metadata.ip),
    },
  });

  const accessToken = await signAccessToken({ userId: account.id, sessionId: session.id, role: account.role });
  const user = await db.user.findUniqueOrThrow({ where: { id: account.id }, select: userSelect });
  return { user, tokens: { accessToken, refreshToken } satisfies SessionTokens };
}

export async function refresh(refreshToken: string, metadata: { userAgent: string | null; ip: string | null }) {
  const tokenHash = hashRefreshToken(refreshToken);
  const current = await db.authSession.findUnique({ where: { refreshTokenHash: tokenHash } });
  if (!current) throw new AppError("INVALID_SESSION", "Session is invalid", 401);

  if (current.revokedAt || current.expiresAt <= new Date()) {
    if (current.revokedAt) {
      await db.authSession.updateMany({
        where: { familyId: current.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    throw new AppError("INVALID_SESSION", "Session is invalid", 401);
  }

  const user = await db.user.findUnique({ where: { id: current.userId } });
  if (!user || user.status !== "ACTIVE") throw new AppError("INVALID_SESSION", "Session is invalid", 401);

  const nextSessionId = randomUUID();
  const nextRefreshToken = createRefreshToken();
  try {
    await db.$transaction(async (transaction) => {
      const update = await transaction.authSession.updateMany({
        where: { id: current.id, revokedAt: null, expiresAt: { gt: new Date() } },
        data: { revokedAt: new Date(), replacedById: nextSessionId },
      });
      if (update.count !== 1) throw new AppError("INVALID_SESSION", "Session is invalid", 401);
      await transaction.authSession.create({
        data: {
          id: nextSessionId,
          userId: current.userId,
          familyId: current.familyId,
          refreshTokenHash: hashRefreshToken(nextRefreshToken),
          expiresAt: refreshExpiry(),
          userAgent: metadata.userAgent?.slice(0, 512) ?? null,
          ipHash: hashIp(metadata.ip),
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof AppError || (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034")) {
      await db.authSession.updateMany({
        where: { familyId: current.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new AppError("INVALID_SESSION", "Session is invalid", 401);
    }
    throw error;
  }

  return {
    user: { id: user.id, role: user.role },
    tokens: {
      accessToken: await signAccessToken({ userId: user.id, sessionId: nextSessionId, role: user.role }),
      refreshToken: nextRefreshToken,
    } satisfies SessionTokens,
  };
}

export async function logout(sessionId: string): Promise<void> {
  await db.authSession.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function changePassword(userId: string, currentSessionId: string, input: ChangePasswordInput): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw new AppError("INVALID_CURRENT_PASSWORD", "Current password is incorrect", 401);
  }
  validatePassword(input.newPassword, user.email, user.institutionalId);
  const passwordHash = await hashPassword(input.newPassword);
  await db.$transaction(async (transaction) => {
    await transaction.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false, passwordChangedAt: new Date() },
    });
    await transaction.authSession.updateMany({
      where: { userId: user.id, id: { not: currentSessionId }, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await transaction.auditLog.create({
      data: { actorId: user.id, action: "PASSWORD_CHANGED", entityType: "User", entityId: user.id, metadata: {} },
    });
  });
}

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await db.user.findUnique({ where: { id: userId }, select: userSelect });
  if (!user) throw new AppError("NOT_FOUND", "User not found", 404);
  return user;
}

export function generateTemporaryPassword(): string {
  let password = randomBytes(24).toString("base64url");
  while (!/[A-Za-z]/.test(password) || !/\d/.test(password)) password = randomBytes(24).toString("base64url");
  return password;
}

export async function createProvisionedUser(input: {
  email: string;
  institutionalId: string;
  fullName: string;
  role: Role;
  cohortId?: string | null;
  departmentId?: string | null;
}, actorId: string) {
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const user = await db.$transaction(async (transaction) => {
    const created = await transaction.user.create({
      data: {
        email: input.email.toLowerCase(),
        institutionalId: input.institutionalId,
        fullName: input.fullName,
        role: input.role,
        cohortId: input.cohortId ?? null,
        departmentId: input.departmentId ?? null,
        passwordHash,
        mustChangePassword: true,
      },
      select: userSelect,
    });
    await transaction.auditLog.create({
      data: {
        actorId,
        action: "USER_CREATED",
        entityType: "User",
        entityId: created.id,
        metadata: { role: created.role },
      },
    });
    return created;
  });
  return { user, temporaryPassword };
}

export async function updateProvisionedUser(
  targetId: string,
  input: { fullName?: string; institutionalId?: string; role?: Role; status?: "ACTIVE" | "INACTIVE"; cohortId?: string | null; departmentId?: string | null },
  actorId: string,
) {
  if (targetId === actorId && input.status === "INACTIVE") {
    throw new AppError("SELF_ADMIN_CHANGE", "Administrators cannot change their own role or deactivate themselves", 400);
  }
  return db.$transaction(async (transaction) => {
    const before = await transaction.user.findUnique({ where: { id: targetId }, select: userSelect });
    if (!before) throw new AppError("NOT_FOUND", "User not found", 404);
    if (targetId === actorId && input.role !== undefined && input.role !== before.role) {
      throw new AppError("SELF_ADMIN_CHANGE", "Administrators cannot change their own role or deactivate themselves", 400);
    }
    const updated = await transaction.user.update({ where: { id: targetId }, data: input, select: userSelect });
    if (input.status === "INACTIVE" || input.role !== undefined) {
      await transaction.authSession.updateMany({ where: { userId: targetId, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    await transaction.auditLog.create({
      data: {
        actorId,
        action: "USER_UPDATED",
        entityType: "User",
        entityId: targetId,
        metadata: { previousRole: before.role, role: updated.role, status: updated.status },
      },
    });
    return updated;
  });
}

export async function deactivateUser(targetId: string, actorId: string): Promise<void> {
  if (targetId === actorId) throw new AppError("SELF_ADMIN_CHANGE", "Administrators cannot deactivate themselves", 400);
  await db.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!user) throw new AppError("NOT_FOUND", "User not found", 404);
    await transaction.user.update({ where: { id: targetId }, data: { status: "INACTIVE" } });
    await transaction.authSession.updateMany({ where: { userId: targetId, revokedAt: null }, data: { revokedAt: new Date() } });
    await transaction.auditLog.create({
      data: { actorId, action: "USER_DEACTIVATED", entityType: "User", entityId: targetId, metadata: {} },
    });
  });
}