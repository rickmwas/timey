import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { hasPermission } from "@/server/auth/permissions";
import { BCRYPT_COST, validatePassword } from "@/server/auth/passwords";
import { AppError } from "@/server/errors/app-error";

describe("role permissions", () => {
  it("grants administrators all officer permissions", () => {
    expect(hasPermission(Role.ADMIN, "import:manage")).toBe(true);
    expect(hasPermission(Role.ADMIN, "venue:manage")).toBe(true);
    expect(hasPermission(Role.TIMETABLE_OFFICER, "announcement:publish")).toBe(true);
    expect(hasPermission(Role.TIMETABLE_OFFICER, "user:manage")).toBe(false);
    expect(hasPermission(Role.STUDENT, "timetable:write")).toBe(false);
  });
});

describe("password policy", () => {
  it("uses the required bcrypt work factor", () => {
    expect(BCRYPT_COST).toBe(12);
  });

  it("requires length, letters, digits, and rejects identity reuse", () => {
    expect(() => validatePassword("short1")).toThrow(AppError);
    expect(() => validatePassword("lettersonlypassword")).toThrow(AppError);
    expect(() => validatePassword("student@example.test", "student@example.test")).toThrow(AppError);
    expect(() => validatePassword("secure-pass-123")).not.toThrow();
  });
});