import { NotificationType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/server/errors/app-error";
import { cursorPage } from "@/server/http/pagination";

export type NotificationSummary = {
  id: string;
  title: string;
  message: string;
  type: "SCHEDULE_CANCELLED" | "SCHEDULE_POSTPONED" | "SCHEDULE_RESCHEDULED" | "ANNOUNCEMENT";
  createdAt: Date;
  readAt: Date | null;
};

export type NormalizedNotification = {
  id: string;
  title: string;
  message: string;
  type: NotificationSummary["type"];
  createdAt: string;
  unread: boolean;
};

export function normalizeNotification(notification: NotificationSummary): NormalizedNotification {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    createdAt: notification.createdAt.toISOString(),
    unread: notification.readAt === null,
  };
}

export type NotificationListInput = {
  cursor?: string;
  limit: number;
  unreadOnly?: boolean;
  type?: NotificationType;
};

export async function createNotificationBatch(
  transaction: Prisma.TransactionClient,
  notifications: Array<{
    recipientId: string;
    sourceChangeId?: string;
    title: string;
    message: string;
    type: NotificationType;
  }>,
): Promise<number> {
  if (notifications.length === 0) return 0;
  const result = await transaction.notification.createMany({ data: notifications, skipDuplicates: true });
  return result.count;
}

export async function listNotifications(recipientId: string, input: NotificationListInput) {
  const where: Prisma.NotificationWhereInput = {
    recipientId,
    ...(input.unreadOnly ? { readAt: null } : {}),
    ...(input.type ? { type: input.type } : {}),
  };
  const [rows, unreadCount] = await db.$transaction([
    db.notification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      select: { id: true, title: true, message: true, type: true, createdAt: true, readAt: true },
    }),
    db.notification.count({ where: { recipientId, readAt: null } }),
  ]);
  return {
    ...cursorPage(rows.map(normalizeNotification), input.limit),
    unreadCount,
  };
}

export async function markNotificationRead(recipientId: string, notificationId: string) {
  const updated = await db.notification.updateMany({
    where: { id: notificationId, recipientId, readAt: null },
    data: { readAt: new Date() },
  });
  const notification = await db.notification.findFirst({
    where: { id: notificationId, recipientId },
    select: { id: true, readAt: true },
  });
  if (!notification) throw new AppError("NOT_FOUND", "Notification not found", 404);
  return { id: notification.id, readAt: notification.readAt, changed: updated.count === 1 };
}

export async function markAllNotificationsRead(recipientId: string) {
  const result = await db.notification.updateMany({
    where: { recipientId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updatedCount: result.count };
}
