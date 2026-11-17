import { describe, expect, it } from "vitest";
import { getAppUrl } from "@/server/config/app-url";
import { parseEnvironment } from "@/server/config/env";
import { cursorPage } from "@/server/http/pagination";
import { failureResponse, successResponse } from "@/server/http/responses";

describe("API responses", () => {
  it("wraps successful data and optional messages", async () => {
    const response = successResponse({ id: "1" }, 201, "Created");

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { id: "1" },
      message: "Created",
    });
  });

  it("omits absent error details", async () => {
    const response = failureResponse("NOT_FOUND", "Missing", 404);

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: "Missing" },
    });
  });
});

describe("cursor pagination", () => {
  it("returns a next cursor only when another page exists", () => {
    expect(cursorPage([{ id: "a" }, { id: "b" }, { id: "c" }], 2)).toEqual({
      items: [{ id: "a" }, { id: "b" }],
      nextCursor: "b",
    });
    expect(cursorPage([{ id: "a" }], 2)).toEqual({ items: [{ id: "a" }], nextCursor: null });
  });
});

describe("environment validation", () => {
  it("validates the public site URL without requiring backend settings", () => {
    expect(getAppUrl({ APP_URL: "https://timy.example" })).toBe(
      "https://timy.example",
    );
    expect(getAppUrl({})).toBe("http://localhost:3000");
    expect(() => getAppUrl({ APP_URL: "not-a-url" })).toThrow();
  });

  it("rejects production secrets shorter than 32 characters", () => {
    expect(() =>
      parseEnvironment({
        DATABASE_URL: "postgresql://localhost/timy",
        AUTH_SECRET: "short",
        NODE_ENV: "production",
      }),
    ).toThrow("AUTH_SECRET must contain at least 32 characters in production");
  });

  it("provides local defaults", () => {
    expect(
      parseEnvironment({
        DATABASE_URL: "postgresql://localhost/timy",
        AUTH_SECRET: "development-secret",
        NODE_ENV: "test",
      }),
    ).toMatchObject({
      APP_URL: "http://localhost:3000",
      STORAGE_LOCAL_DIR: "../timy-local-storage",
      LOG_LEVEL: "info",
    });
  });
});