import type { Notification } from "@/types";

export type ApiNotification = {
  id: string;
  title: string;
  message: string;
  type: "SCHEDULE_CANCELLED" | "SCHEDULE_POSTPONED" | "SCHEDULE_RESCHEDULED" | "ANNOUNCEMENT";
  createdAt: string;
  unread: boolean;
};

const notificationTypes: Record<ApiNotification["type"], Notification["type"]> = {
  SCHEDULE_CANCELLED: "CLASS_CANCELLED",
  SCHEDULE_POSTPONED: "CLASS_RESCHEDULED",
  SCHEDULE_RESCHEDULED: "CLASS_RESCHEDULED",
  ANNOUNCEMENT: "ANNOUNCEMENT",
};

export function toNotification(notification: ApiNotification): Notification {
  return {
    id: notification.id,
    userId: "",
    type: notificationTypes[notification.type],
    title: notification.title,
    message: notification.message,
    read: !notification.unread,
    createdAt: notification.createdAt,
  };
}
