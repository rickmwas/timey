import { describe, expect, it } from "vitest";
import {
  getRouteRedirect,
  isPublicRoute,
  type UserRole,
} from "@/lib/auth/permissions";

describe("public route access", () => {
  it.each(["/", "/login", "/signup"])(
    "keeps %s public for signed out visitors",
    (pathname) => {
      expect(isPublicRoute(pathname)).toBe(true);
      expect(getRouteRedirect(undefined, pathname)).toBeNull();
    },
  );

  it("sends signed out visitors from protected pages to sign in", () => {
    expect(isPublicRoute("/dashboard")).toBe(false);
    expect(getRouteRedirect(undefined, "/dashboard")).toBe("/login");
  });

  it.each<UserRole>(["ADMIN", "TIMETABLE_OFFICER", "COD", "DEAN", "LECTURER", "STUDENT"])(
    "sends signed in %s users from public pages to their role home",
    (role) => {
      expect(getRouteRedirect(role, "/")).toBe("/dashboard");
      expect(getRouteRedirect(role, "/login")).toBe("/dashboard");
      expect(getRouteRedirect(role, "/signup")).toBe("/dashboard");
    },
  );

  it("keeps an authorized protected route available", () => {
    expect(getRouteRedirect("STUDENT", "/timetable")).toBeNull();
  });
});
