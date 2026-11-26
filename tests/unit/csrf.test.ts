import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { AppError } from "@/server/errors/app-error";
import { assertSameOrigin } from "@/server/security/csrf";

const vercelEnvironmentKeys = [
  "VERCEL_ENV",
  "VERCEL_URL",
  "VERCEL_BRANCH_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
] as const;

const originalEnvironment = Object.fromEntries(
  vercelEnvironmentKeys.map((key) => [key, process.env[key]]),
);

afterEach(() => {
  for (const key of vercelEnvironmentKeys) {
    const value = originalEnvironment[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("assertSameOrigin", () => {
  it("accepts the current Vercel Preview deployment and branch URLs", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "timy-git-deploy-ready-example.vercel.app";
    process.env.VERCEL_BRANCH_URL = "timy-git-deploy-ready.vercel.app";

    expect(() =>
      assertSameOrigin(new NextRequest("https://timy-git-deploy-ready.vercel.app/api", {
        headers: { origin: "https://timy-git-deploy-ready.vercel.app" },
      })),
    ).not.toThrow();
  });

  it("does not allow the Production domain as a Preview origin", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "timy.example.com";

    expect(() =>
      assertSameOrigin(new NextRequest("https://timy-preview.vercel.app/api", {
        headers: { origin: "https://timy.example.com" },
      })),
    ).toThrow(AppError);
  });
});
