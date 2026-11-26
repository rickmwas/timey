import { AnnouncementPriority, Prisma, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/server/errors/app-error";
import { cursorPage } from "@/server/http/pagination";
import type { AuthenticatedUser } from "@/server/middleware/require-user";
import { createNotificationBatch } from "@/server/services/notifications";

export type AnnouncementInput = {
  title: string;
  content: string;
  cohortId?: string | null;
  offeringId?: string | null;
  priority?: AnnouncementPriority;
  expiresAt?: string | null;
};

export type AnnouncementListInput = { cursor?: string; limit: number; cohortId?: string; offeringId?: string };

async function assertAudienceAccess(
  transaction: Prisma.TransactionClient,
  actor: AuthenticatedUser,
  target: { cohortId?: string | null; offeringId?: string | null },
) {
  if (Boolean(target.cohortId) === Boolean(target.offeringId)) {
    throw new AppError("INVALID_ANNOUNCEMENT_AUDIENCE", "Select exactly one cohort or course offering audience", 400);
  }

  if (target.offeringId) {
    const offering = await transaction.courseOffering.findUnique({
      where: { id: target.offeringId },
      select: { id: true, cohortId: true, isActive: true },
    });
    if (!offering || !offering.isActive) throw new AppError("NOT_FOUND", "Active course offering not found", 404);
    if (actor.role === Role.LECTURER) {
      const assigned = await transaction.timetableEntry.findFirst({
        where: { offeringId: offering.id, lecturerId: actor.id, status: "ACTIVE" },
        select: { id: true },
      });
      if (!assigned) throw new AppError("FORBIDDEN", "Lecturers may only address an offering they teach", 403);
    }
    return offering.cohortId;
  }

  const cohort = await transaction.cohort.findUnique({ where: { id: target.cohortId! }, select: { id: true, isActive: true } });
  if (!cohort || !cohort.isActive) throw new AppError("NOT_FOUND", "Active cohort not found", 404);
  if (actor.role === Role.LECTURER) {
    const assigned = await transaction.timetableEntry.findFirst({
      where: { lecturerId: actor.id, status: "ACTIVE", offering: { cohortId: cohort.id } },
      select: { id: true },
    });
    if (!assigned) throw new AppError("FORBIDDEN", "Lecturers may only address a cohort they teach", 403);
  }
  return cohort.id;
}

function canManage(actor: AuthenticatedUser, announcement: { authorId: string }): void {
  if (actor.role === Role.ADMIN || actor.role === Role.TIMETABLE_OFFICER || announcement.authorId === actor.id) return;
  throw new AppError("FORBIDDEN", "Only the author or timetable staff may change this announcement", 403);
}

function expiryDate(value: string | null | undefined): Date | null {
  if (value === undefined || value === null) return null;
  const expiresAt = new Date(value);
  if (expiresAt <= new Date()) throw new AppError("INVALID_EXPIRY", "Announcement expiry must be in the future", 400);
  return expiresAt;
}

export async function listAnnouncements(actor: AuthenticatedUser, input: AnnouncementListInput) {
  const now = new Date();
  const visibleWhere: Prisma.AnnouncementWhereInput = {
    archivedAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
  if (actor.role === Role.STUDENT) {
    if (!actor.cohortId || (input.cohortId && input.cohortId !== actor.cohortId)) {
      throw new AppError("FORBIDDEN", "Students may only view announcements for their cohort", 403);
    }
    visibleWhere.OR = [
      { cohortId: actor.cohortId },
      { offering: { cohortId: actor.cohortId } },
    ];
    visibleWhere.AND = [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }];
  } else if (actor.role === Role.LECTURER) {
    const offerings = await db.timetableEntry.findMany({
      where: { lecturerId: actor.id, status: "ACTIVE" },
      select: { offeringId: true, offering: { select: { cohortId: true } } },
      distinct: ["offeringId"],
    });
    visibleWhere.AND = [
      { OR: [
        { authorId: actor.id },
        { offeringId: { in: offerings.map((item) => item.offeringId) } },
        { cohortId: { in: [...new Set(offerings.map((item) => item.offering.cohortId))] } },
      ] },
      { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    ];
  } else if (actor.role !== Role.ADMIN && actor.role !== Role.TIMETABLE_OFFICER) {
    throw new AppError("FORBIDDEN", "You do not have permission to read announcements", 403);
  }

  const rows = await db.announcement.findMany({
    where: {
      ...visibleWhere,
      ...(input.offeringId ? { offeringId: input.offeringId } : {}),
      ...(input.cohortId ? { cohortId: input.cohortId } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    include: {
      author: { select: { id: true, fullName: true, role: true } },
      cohort: { select: { id: true, code: true, name: true } },
      offering: { include: { course: { select: { id: true, code: true, title: true } }, cohort: { select: { id: true, code: true, name: true } } } },
    },
  });
  return cursorPage(rows, input.limit);
}

export async function createAnnouncement(actor: AuthenticatedUser, input: AnnouncementInput) {
  if (actor.role !== Role.LECTURER && actor.role !== Role.TIMETABLE_OFFICER && actor.role !== Role.ADMIN) {
    throw new AppError("FORBIDDEN", "You may not publish announcements", 403);
  }
  const expiresAt = expiryDate(input.expiresAt);
  return db.$transaction(async (transaction) => {
    const cohortId = await assertAudienceAccess(transaction, actor, input);
    const announcement = await transaction.announcement.create({
      data: {
        title: input.title,
        content: input.content,
        authorId: actor.id,
        cohortId: input.cohortId ?? null,
        offeringId: input.offeringId ?? null,
        priority: input.priority ?? AnnouncementPriority.NORMAL,
        expiresAt,
      },
      include: {
        cohort: { select: { id: true, code: true, name: true } },
        offering: { include: { course: { select: { id: true, code: true, title: true } } } },
      },
    });
    const recipients = await transaction.user.findMany({
      where: { cohortId, role: Role.STUDENT, status: "ACTIVE" },
      select: { id: true },
    });
    await createNotificationBatch(transaction, recipients.map(({ id }) => ({
      recipientId: id,
      title: input.priority === AnnouncementPriority.URGENT ? `Urgent: ${input.title}` : input.title,
      message: input.content,
      type: "ANNOUNCEMENT" as const,
    })));
    await transaction.auditLog.create({
      data: { actorId: actor.id, action: "ANNOUNCEMENT_CREATED", entityType: "Announcement", entityId: announcement.id, metadata: { cohortId, offeringId: input.offeringId ?? null } },
    });
    return announcement;
  });
}

export async function updateAnnouncement(actor: AuthenticatedUser, announcementId: string, input: Partial<AnnouncementInput>) {
  return db.$transaction(async (transaction) => {
    const existing = await transaction.announcement.findUnique({ where: { id: announcementId } });
    if (!existing) throw new AppError("NOT_FOUND", "Announcement not found", 404);
    canManage(actor, existing);
    const nextAudience = {
      cohortId: input.cohortId !== undefined ? input.cohortId : existing.cohortId,
      offeringId: input.offeringId !== undefined ? input.offeringId : existing.offeringId,
    };
    if (input.cohortId !== undefined || input.offeringId !== undefined) {
      await assertAudienceAccess(transaction, actor, nextAudience);
    }
    const updated = await transaction.announcement.update({
      where: { id: announcementId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.content !== undefined ? { content: input.content } : {}),
        ...(input.cohortId !== undefined ? { cohortId: input.cohortId } : {}),
        ...(input.offeringId !== undefined ? { offeringId: input.offeringId } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.expiresAt !== undefined ? { expiresAt: expiryDate(input.expiresAt) } : {}),
      },
    });
    await transaction.auditLog.create({
      data: { actorId: actor.id, action: "ANNOUNCEMENT_UPDATED", entityType: "Announcement", entityId: announcementId, metadata: { cohortId: updated.cohortId, offeringId: updated.offeringId } },
    });
    return updated;
  });
}

export async function archiveAnnouncement(actor: AuthenticatedUser, announcementId: string) {
  return db.$transaction(async (transaction) => {
    const existing = await transaction.announcement.findUnique({ where: { id: announcementId } });
    if (!existing) throw new AppError("NOT_FOUND", "Announcement not found", 404);
    canManage(actor, existing);
    if (existing.archivedAt) return existing;
    const archived = await transaction.announcement.update({ where: { id: announcementId }, data: { archivedAt: new Date() } });
    await transaction.auditLog.create({
      data: { actorId: actor.id, action: "ANNOUNCEMENT_ARCHIVED", entityType: "Announcement", entityId: announcementId, metadata: {} },
    });
    return archived;
  });
}