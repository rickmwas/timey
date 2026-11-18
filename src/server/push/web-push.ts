import { setVapidDetails, sendNotification } from "web-push";
import { db } from "@/lib/db";

// Default standard VAPID key pair (can be overridden in production via process.env)
const DEFAULT_VAPID_PUBLIC =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
const DEFAULT_VAPID_PRIVATE =
  process.env.VAPID_PRIVATE_KEY || "UUxI4b6s1x-qK9wz8O8e7y0p1R3t5u7w9y1A3b5c7d8";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@kisii.ac.ke";

try {
  setVapidDetails(VAPID_SUBJECT, DEFAULT_VAPID_PUBLIC, DEFAULT_VAPID_PRIVATE);
} catch (err) {
  console.warn("[WebPush] setVapidDetails notice:", err);
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
