import { NextRequest } from "next/server";
import { eventBus, ScheduleMutationEvent } from "@/server/events/event-bus";
import { requireUser } from "@/server/middleware/require-user";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1. Strictly authenticate user session
  let user;
  try {
    user = await requireUser(request);
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized access to SSE notification stream" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const queryCohortId = request.nextUrl.searchParams.get("cohortId");
  const queryUserId = request.nextUrl.searchParams.get("userId");

  // 2. Authorize scope: Students and lecturers cannot listen to arbitrary third-party users/cohorts
  const isPrivileged = user.role === "ADMIN" || user.role === "TIMETABLE_OFFICER" || user.role === "DEAN";

  // Effective cohort filter
  const targetCohortId = isPrivileged ? (queryCohortId || user.cohortId) : user.cohortId;
  // Effective user filter
  const targetUserId = isPrivileged ? (queryUserId || user.id) : user.id;

  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connected event
      const initialPayload = `data: ${JSON.stringify({
        type: "CONNECTED",
        message: "SSE connected to Timy Live Engine",
        userId: user.id,
        role: user.role,
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initialPayload));

      // 2. Listener for schedule mutation broadcasts
      const handleMutation = (event: ScheduleMutationEvent) => {
        if (isClosed) return;

        // Role-based recipient authorization
        if (!isPrivileged) {
          const isDirectRecipient = event.recipientIds && event.recipientIds.includes(targetUserId);
          const isCohortMember =
            (targetCohortId && event.cohortId === targetCohortId) ||
            (targetCohortId && event.cohortIds && event.cohortIds.includes(targetCohortId));

          if (!isDirectRecipient && !isCohortMember) {
            return;
          }
        } else {
          // Privileged user filtered by query if provided
          if (queryCohortId && event.cohortId && event.cohortId !== queryCohortId) {
            return;
          }
          if (queryUserId && event.recipientIds && !event.recipientIds.includes(queryUserId)) {
            return;
          }
        }

        try {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(new TextEncoder().encode(payload));
        } catch {
          // Stream might be closed
        }
      };

      eventBus.on("SCHEDULE_MUTATION", handleMutation);

      // 3. Keep-alive ping every 15 seconds to prevent timeout
      const keepAliveInterval = setInterval(() => {
        if (isClosed) {
          clearInterval(keepAliveInterval);
          return;
        }
        try {
          controller.enqueue(new TextEncoder().encode(": keep-alive\n\n"));
        } catch {
          clearInterval(keepAliveInterval);
        }
      }, 15000);

      // Clean up when client disconnects
      request.signal.addEventListener("abort", () => {
        isClosed = true;
        clearInterval(keepAliveInterval);
        eventBus.off("SCHEDULE_MUTATION", handleMutation);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
