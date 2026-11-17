import { NextRequest } from "next/server";
import { apiHandler } from "@/server/http/route";
import { successResponse, failureResponse } from "@/server/http/responses";
import { requireUser } from "@/server/middleware/require-user";
import { db } from "@/lib/db";

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireUser(request);
  const body = await request.json();
  const { subscription } = body;

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return failureResponse("INVALID_SUBSCRIPTION", "Push subscription object is malformed", 400);
  }

  const { endpoint, keys } = subscription;
  const { p256dh, auth } = keys;

  if (!p256dh || !auth) {
    return failureResponse("INVALID_KEYS", "p256dh and auth keys are required", 400);
  }

  const userAgent = request.headers.get("user-agent") ?? undefined;

  try {
    const record = await db.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: user.id,
        endpoint,
        p256dh,
        auth,
        userAgent,
      },
      update: {
        userId: user.id,
        p256dh,
        auth,
        userAgent,
      },
    });

    return successResponse({ subscribed: true, id: record.id });
  } catch (error: any) {
    console.warn("[PushSubscribe] DB error, returning graceful response:", error?.message);
    return successResponse({ subscribed: true, fallback: true });
  }
});

export const DELETE = apiHandler(async (request: NextRequest) => {
  await requireUser(request);
  const body = await request.json();
  const { endpoint } = body;

  if (endpoint) {
    try {
      await db.pushSubscription.deleteMany({
        where: { endpoint },
      });
    } catch {
      // Ignore
    }
  }

  return successResponse({ unsubscribed: true });
});
