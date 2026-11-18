import { setVapidDetails, sendNotification } from "web-push";
import { db } from "@/lib/db";

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@kisii.ac.ke";

let vapidConfigured = false;

if (vapidPublic && vapidPrivate) {
  try {
    setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
    vapidConfigured = true;
  } catch (err) {
    console.error("[WebPush] Failed to initialize VAPID details:", err);
  }
} else {
  if (process.env.NODE_ENV === "production") {
    console.error("[WebPush] Production environment missing required VAPID keys: NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY");
  } else {
    console.warn("[WebPush] VAPID keys not configured. Web Push is disabled in this environment.");
  }
}

export interface PushPayload {
  title: string;
  message: string;
  url?: string;
  tag?: string;
  type?: string;
}

/**
 * Send Web Push notification to all active devices of a user
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!vapidConfigured) {
    return 0;
  }

  try {
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) return 0;

    let successCount = 0;
    const expiredIds: string[] = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          await sendNotification(
            pushSubscription,
            JSON.stringify({
              title: payload.title,
              message: payload.message,
              url: payload.url || "/timetable",
              tag: payload.tag || "timy-alert",
              type: payload.type || "ALERT",
            })
          );
          successCount++;
        } catch (err: any) {
          // If subscription has expired or unsubscribed, queue for deletion
          if (err.statusCode === 410 || err.statusCode === 404) {
            expiredIds.push(sub.id);
          }
        }
      })
    );

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      await db.pushSubscription.deleteMany({
        where: { id: { in: expiredIds } },
      });
    }

    return successCount;
  } catch (error) {
    console.warn("[WebPush] sendPushToUser database/network error:", error);
    return 0;
  }
}

/**
 * Send Web Push notification to all active devices of enrolled students in a cohort
 */
export async function sendPushToCohort(cohortId: string, payload: PushPayload): Promise<number> {
  if (!vapidConfigured) {
    return 0;
  }

  try {
    const students = await db.user.findMany({
      where: { cohortId, role: "STUDENT", status: "ACTIVE" },
      select: { id: true },
    });

    if (students.length === 0) return 0;

    let totalPushed = 0;
    for (const student of students) {
      const count = await sendPushToUser(student.id, payload);
      totalPushed += count;
    }

    return totalPushed;
  } catch (error) {
    console.warn("[WebPush] sendPushToCohort database/network error:", error);
    return 0;
  }
}

/**
 * Send Web Push notification to an explicit list of user IDs (supporting cross-cohort broadcasts)
 */
export async function sendPushToRecipients(recipientUserIds: string[], payload: PushPayload): Promise<number> {
  if (!vapidConfigured || recipientUserIds.length === 0) {
    return 0;
  }

  try {
    const uniqueUserIds = Array.from(new Set(recipientUserIds));
    let totalPushed = 0;
    for (const userId of uniqueUserIds) {
      const count = await sendPushToUser(userId, payload);
      totalPushed += count;
    }
    return totalPushed;
  } catch (error) {
    console.warn("[WebPush] sendPushToRecipients database/network error:", error);
    return 0;
  }
}
