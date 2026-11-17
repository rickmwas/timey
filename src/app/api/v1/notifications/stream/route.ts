import { NextRequest } from "next/server";
import { eventBus, ScheduleMutationEvent } from "@/server/events/event-bus";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cohortId = request.nextUrl.searchParams.get("cohortId");
  const userId = request.nextUrl.searchParams.get("userId");

  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connected event
      const initialPayload = `data: ${JSON.stringify({ type: "CONNECTED", message: "SSE connected to Timy Live Engine" })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initialPayload));

      // 2. Listener for schedule mutation broadcasts
      const handleMutation = (event: ScheduleMutationEvent) => {
        if (isClosed) return;
        // Filter by cohort if specified
        if (cohortId && event.cohortId && event.cohortId !== cohortId) {
          return;
        }
        // Filter by recipient if specified
        if (userId && event.recipientIds && !event.recipientIds.includes(userId)) {
          return;
        }

        try {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(new TextEncoder().encode(payload));
        } catch {
          // Stream might be closed
        }
      };

      eventBus.on("SCHEDULE_MUTATION", handleMutation);

      // 3. Keep-alive ping every 15 seconds to prevent mobile timeout
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
