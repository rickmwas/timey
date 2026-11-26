import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/server/errors/app-error";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "@/server/services/notifications";

afterAll(async () => {
  await db.$disconnect();
});

describe("notification recipient isolation", () => {
  it("lists, marks one, and marks all only for the authenticated recipient", async () => {
    const firstUserId = randomUUID();
    const secondUserId = randomUUID();
    const firstEmail = `notify-a-${firstUserId}@test.invalid`;
    const secondEmail = `notify-b-${secondUserId}@test.invalid`;
    const firstNotificationId = randomUUID();
    const secondNotificationId = randomUUID();
    const otherNotificationId = randomUUID();

    try {
      await db.user.createMany({
        data: [
          { id: firstUserId, email: firstEmail, institutionalId: `A-${firstUserId}`, fullName: "First Student", passwordHash: "unused", role: Role.STUDENT, mustChangePassword: false },
          { id: secondUserId, email: secondEmail, institutionalId: `B-${secondUserId}`, fullName: "Second Student", passwordHash: "unused", role: Role.STUDENT, mustChangePassword: false },
        ],
      });
      await db.notification.createMany({
        data: [
          { id: firstNotificationId, recipientId: firstUserId, title: "One", message: "First notification", type: "ANNOUNCEMENT" },
          { id: secondNotificationId, recipientId: firstUserId, title: "Two", message: "Second notification", type: "ANNOUNCEMENT" },
          { id: otherNotificationId, recipientId: secondUserId, title: "Other", message: "Other user's notification", type: "ANNOUNCEMENT" },
        ],
      });

      const feed = await listNotifications(firstUserId, { limit: 25 });
      expect(feed.items).toHaveLength(2);
      expect(feed.unreadCount).toBe(2);
      expect(feed.items.every((item) => item.unread)).toBe(true);

      await expect(markNotificationRead(secondUserId, firstNotificationId)).rejects.toBeInstanceOf(AppError);
      const marked = await markNotificationRead(firstUserId, firstNotificationId);
      expect(marked.changed).toBe(true);
      expect((await markNotificationRead(firstUserId, firstNotificationId)).changed).toBe(false);
      expect((await listNotifications(firstUserId, { limit: 25 })).unreadCount).toBe(1);

      const allRead = await markAllNotificationsRead(firstUserId);
      expect(allRead.updatedCount).toBe(1);
      expect((await listNotifications(firstUserId, { limit: 25 })).unreadCount).toBe(0);
      expect(await db.notification.count({ where: { recipientId: secondUserId, readAt: null } })).toBe(1);
    } finally {
      await db.notification.deleteMany({ where: { id: { in: [firstNotificationId, secondNotificationId, otherNotificationId] } } });
      await db.user.deleteMany({ where: { id: { in: [firstUserId, secondUserId] } } });
    }
  });
});