/**
 * Typed API Client for Timy
 * Connects frontend UI components to Next.js route handlers (/api/v1/*)
 * Handles session cookies (credentials: "include"), CSRF tokens, and standardized error parsing.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith("/api") ? endpoint : `/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Enforce HttpOnly session cookies
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = payload?.error || {
      code: `HTTP_${response.status}`,
      message: response.statusText || "Request failed",
    };
    throw new ApiError(error.code, error.message, response.status, error.details);
  }

  if (payload && typeof payload === "object" && "success" in payload) {
    if (!payload.success) {
      throw new ApiError(payload.error?.code || "ERROR", payload.error?.message || "Operation failed", response.status);
    }
    return payload.data as T;
  }

  return payload as T;
}

export const apiClient = {
  // Authentication & Session
  auth: {
    login: (identifier: string, password: string) =>
      apiFetch<{ user: any }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      }),

    logout: () =>
      apiFetch<{ message: string }>("/api/v1/auth/logout", {
        method: "POST",
      }),

    me: () =>
      apiFetch<{ user: any }>("/api/v1/auth/me", {
        method: "GET",
      }),

    changePassword: (currentPassword: string, nextPassword: string) =>
      apiFetch<{ message: string }>("/api/v1/auth/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, nextPassword }),
      }),
  },

  // Timetables & Scheduling
  timetables: {
    me: (params?: { date?: string; startDate?: string; endDate?: string; periodId?: string }) => {
      const qs = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : "";
      return apiFetch<{ items: any[]; nextCursor: string | null }>(`/api/v1/timetables/me${qs}`);
    },

    validateSlot: (slotData: {
      periodId: string;
      offeringId: string;
      lecturerId: string;
      venueId: string;
      day: string;
      startTime: string;
      endTime: string;
      excludeEntryId?: string;
    }) =>
      apiFetch<{ valid: boolean; conflicts: Array<{ type: string; description: string; blocking: boolean }> }>(
        "/api/v1/timetables/validate-slot",
        {
          method: "POST",
          body: JSON.stringify(slotData),
        }
      ),
  },

  // Timetable Entries CRUD & Mutations
  timetableEntries: {
    list: (query?: { periodId?: string; cohortId?: string; lecturerId?: string; venueId?: string; day?: string }) => {
      const qs = query ? `?${new URLSearchParams(query as Record<string, string>).toString()}` : "";
      return apiFetch<{ items: any[]; total: number }>(`/api/v1/timetable-entries${qs}`);
    },

    create: (data: {
      periodId: string;
      offeringId: string;
      lecturerId: string;
      venueId: string;
      day: string;
      startTime: string;
      endTime: string;
    }) =>
      apiFetch<any>("/api/v1/timetable-entries", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    get: (id: string) => apiFetch<any>(`/api/v1/timetable-entries/${id}`),

    update: (id: string, data: Partial<{ lecturerId: string; venueId: string; day: string; startTime: string; endTime: string }>) =>
      apiFetch<any>(`/api/v1/timetable-entries/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    reschedule: (id: string, data: {
      occurrenceDate: string;
      replacementDate?: string;
      replacementDay?: string;
      replacementStartTime: string;
      replacementEndTime: string;
      replacementVenueId?: string;
      reason: string;
      idempotencyKey?: string;
    }) =>
      apiFetch<any>(`/api/v1/timetable-entries/${id}/reschedule`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    cancel: (id: string, data: { occurrenceDate: string; reason: string; idempotencyKey?: string }) =>
      apiFetch<any>(`/api/v1/timetable-entries/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    postpone: (id: string, data: { occurrenceDate: string; reason: string; idempotencyKey?: string }) =>
      apiFetch<any>(`/api/v1/timetable-entries/${id}/postpone`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Venues & Availability
  venues: {
    list: (query?: { search?: string; building?: string; active?: boolean; limit?: number; cursor?: string }) => {
      const qs = query ? `?${new URLSearchParams(query as any).toString()}` : "";
      return apiFetch<{ items: any[] }>(`/api/v1/venues${qs}`);
    },

    get: (id: string) => apiFetch<any>(`/api/v1/venues/${id}`),

    create: (data: { code: string; name: string; building: string; floor?: number; capacity?: number }) =>
      apiFetch<any>("/api/v1/venues", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<{ name: string; building: string; floor: number; capacity: number; isActive: boolean; isUnderMaintenance: boolean }>) =>
      apiFetch<any>(`/api/v1/venues/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    availability: (query: { date?: string; dayOfWeek?: string; startTime: string; endTime: string; minCapacity?: number }) => {
      const qs = `?${new URLSearchParams(query as any).toString()}`;
      return apiFetch<{ availableVenues: any[]; occupiedVenues: any[] }>(`/api/v1/venues/availability${qs}`);
    },
  },

  // Notifications
  notifications: {
    list: (query?: { unreadOnly?: boolean; limit?: number; cursor?: string }) => {
      const qs = query ? `?${new URLSearchParams(query as any).toString()}` : "";
      return apiFetch<{ items: any[]; unreadCount: number; nextCursor: string | null }>(`/api/v1/notifications${qs}`);
    },

    markRead: (id: string) =>
      apiFetch<{ message: string }>(`/api/v1/notifications/${id}/read`, {
        method: "PATCH",
      }),

    markAllRead: () =>
      apiFetch<{ count: number }>("/api/v1/notifications/mark-all-read", {
        method: "POST",
      }),
  },

  // Announcements
  announcements: {
    list: (query?: { cohortId?: string; courseId?: string; limit?: number }) => {
      const qs = query ? `?${new URLSearchParams(query as any).toString()}` : "";
      return apiFetch<{ items: any[] }>(`/api/v1/announcements${qs}`);
    },

    get: (id: string) => apiFetch<any>(`/api/v1/announcements/${id}`),

    create: (data: { title: string; content: string; priority?: "NORMAL" | "URGENT"; cohortId?: string; offeringId?: string }) =>
      apiFetch<any>("/api/v1/announcements", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    archive: (id: string) =>
      apiFetch<any>(`/api/v1/announcements/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: true }),
      }),
  },

  // Ingestion & Imports (SPEC-002)
  imports: {
    upload: (file: File, periodId: string) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("periodId", periodId);
      return apiFetch<any>("/api/v1/imports", {
        method: "POST",
        body: formData,
      });
    },

    list: (query?: { limit?: number; cursor?: string }) => {
      const qs = query ? `?${new URLSearchParams(query as any).toString()}` : "";
      return apiFetch<{ items: any[]; nextCursor: string | null }>(`/api/v1/imports${qs}`);
    },

    get: (id: string) => apiFetch<any>(`/api/v1/imports/${id}`),

    validate: (id: string) =>
      apiFetch<any>(`/api/v1/imports/${id}/validate`, {
        method: "POST",
      }),

    editRow: (id: string, rowId: string, data: any) =>
      apiFetch<any>(`/api/v1/imports/${id}/rows/${rowId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    discard: (id: string) =>
      apiFetch<any>(`/api/v1/imports/${id}/discard`, {
        method: "POST",
      }),

    publish: (id: string, expectedVersion: number = 0) =>
      apiFetch<any>(`/api/v1/imports/${id}/publish`, {
        method: "POST",
        body: JSON.stringify({ expectedVersion }),
      }),
  },

  // Admin Management
  admin: {
    users: {
      list: (query?: { search?: string; role?: string; status?: string; limit?: number }) => {
        const qs = query ? `?${new URLSearchParams(query as any).toString()}` : "";
        return apiFetch<{ items: any[] }>(`/api/v1/admin/users${qs}`);
      },

      create: (data: { email: string; institutionalId: string; fullName: string; role: string; cohortId?: string; departmentId?: string }) =>
        apiFetch<any>("/api/v1/admin/users", {
          method: "POST",
          body: JSON.stringify(data),
        }),

      update: (id: string, data: Partial<{ fullName: string; role: string; status: string; cohortId: string | null; departmentId: string | null }>) =>
        apiFetch<any>(`/api/v1/admin/users/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),

      deactivate: (id: string) =>
        apiFetch<any>(`/api/v1/admin/users/${id}/deactivate`, {
          method: "POST",
        }),
    },

    auditLogs: {
      list: (query?: { actorId?: string; action?: string; targetType?: string; limit?: number }) => {
        const qs = query ? `?${new URLSearchParams(query as any).toString()}` : "";
        return apiFetch<{ items: any[] }>(`/api/v1/admin/audit-logs${qs}`);
      },
    },
  },
};
