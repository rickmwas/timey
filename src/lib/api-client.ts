import type { AuthUser, Role } from "@/types";

type ApiFailure = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

let refreshRequest: Promise<boolean> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (
    init.body &&
    !(typeof FormData !== "undefined" && init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const send = () => fetch(path, {
    ...init,
    credentials: "same-origin",
    headers,
  });
  let response = await send();

  if (
    response.status === 401 &&
    path !== "/api/v1/auth/login" &&
    path !== "/api/v1/auth/refresh" &&
    path !== "/api/v1/auth/logout"
  ) {
    if (!refreshRequest) {
      refreshRequest = fetch("/api/v1/auth/refresh", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      })
        .then(refreshResponse => refreshResponse.ok)
        .catch(() => false)
        .finally(() => {
          refreshRequest = null;
        });
    }

    if (await refreshRequest) response = await send();
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiRequestError(
      "The server returned an invalid response",
      response.status,
    );
  }

  if (
    isRecord(payload) &&
    payload.success === false &&
    isRecord(payload.error)
  ) {
    const failure = payload as ApiFailure;
    throw new ApiRequestError(
      failure.error?.message ?? "The request failed",
      response.status,
      failure.error?.code,
    );
  }

  if (
    !response.ok ||
    !isRecord(payload) ||
    payload.success !== true ||
    !("data" in payload)
  ) {
    throw new ApiRequestError(
      `The request failed with status ${response.status}`,
      response.status,
    );
  }

  return payload.data as T;
}

export type ApiUser = {
  id: string;
  email: string;
  institutionalId: string;
  fullName: string;
  role: Role;
  cohortId: string | null;
};

export function normalizeAuthUser(user: ApiUser): AuthUser {
  return {
    id: user.id,
    identifier: user.institutionalId,
    name: user.fullName,
    email: user.email,
    role: user.role,
    cohortId: user.cohortId ?? undefined,
  };
}
