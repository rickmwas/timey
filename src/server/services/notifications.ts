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
