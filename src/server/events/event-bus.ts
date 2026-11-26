import { EventEmitter } from "node:events";

export interface ScheduleMutationEvent {
  type: "RESCHEDULED" | "CANCELLED" | "MOVED" | "ANNOUNCEMENT" | "PUBLISHED";
  entryId?: string;
  courseCode?: string;
  courseTitle?: string;
  oldVenue?: string;
  newVenue?: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  cohortId?: string;
  cohortIds?: string[];
  recipientIds?: string[];
  message: string;
  timestamp: string;
}

class TimyEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  emitMutation(event: Omit<ScheduleMutationEvent, "timestamp">) {
    const fullEvent: ScheduleMutationEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    this.emit("SCHEDULE_MUTATION", fullEvent);
  }
}

// Global singleton to persist across Next.js dev reloads
const globalForEvents = globalThis as unknown as { timyEventBus?: TimyEventBus };

export const eventBus = globalForEvents.timyEventBus ?? new TimyEventBus();

if (process.env.NODE_ENV !== "production") {
  globalForEvents.timyEventBus = eventBus;
}
