import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api-client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API client", () => {
  it("unwraps successful API responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: { id: "venue-1" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(apiRequest<{ id: string }>("/api/v1/venues")).resolves.toEqual({
      id: "venue-1",
    });
  });

  it("refreshes an expired session once and retries the original request", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: { items: [] } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest<{ items: unknown[] }>("/api/v1/notifications")).resolves.toEqual({
      items: [],
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/v1/auth/refresh");
  });

  it("preserves API error status and code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            error: { code: "INVALID_CREDENTIALS", message: "Invalid identifier or password" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(apiRequest("/api/v1/auth/login")).rejects.toMatchObject({
      status: 401,
      code: "INVALID_CREDENTIALS",
      message: "Invalid identifier or password",
    });
  });
});
