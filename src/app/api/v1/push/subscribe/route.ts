import { NextRequest } from "next/server";
import { apiHandler } from "@/server/http/route";
import { successResponse, failureResponse } from "@/server/http/responses";
import { requireUser } from "@/server/middleware/require-user";
import { db } from "@/lib/db";
import { AppError } from "@/server/errors/app-error";

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireUser(request);
  const body = await request.json();

  // Accept either nested { subscription: { endpoint, keys } } or flat { endpoint, keys }
  const subscription = body.subscription || body;
  const endpoint = subscription.endpoint;
  const keys = subscription.keys;

  if (!endpoint || !keys) {
    return failureResponse("INVALID_SUBSCRIPTION", "Push subscription object is malformed", 400);
  }

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
    console.error("[PushSubscribe] DB error saving subscription:", error?.message);
    throw new AppError("INTERNAL_ERROR", "Failed to save push subscription to database", 500);
  }
});

export const DELETE = apiHandler(async (request: NextRequest) => {
  const user = await requireUser(request);
  const body = await request.json();
  const { endpoint } = body;

  if (!endpoint) {
    return failureResponse("VALIDATION_ERROR", "Endpoint is required for unsubscription", 400);
  }

  try {
    await db.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId: user.id,
      },
    });
  } catch (error: any) {
    console.error("[PushUnsubscribe] DB error removing subscription:", error?.message);
    throw new AppError("INTERNAL_ERROR", "Failed to remove push subscription", 500);
  }

  return successResponse({ unsubscribed: true });
});
