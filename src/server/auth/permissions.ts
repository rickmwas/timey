import type { Role } from "@prisma/client";

export type Permission =
  | "timetable:read"
  | "timetable:write"
  | "import:manage"
  | "venue:manage"
  | "user:manage"
  | "audit:read"
  | "announcement:publish";

const permissions: Record<Role, readonly Permission[]> = {
  STUDENT: ["timetable:read"],
  LECTURER: ["timetable:read", "announcement:publish"],
  TIMETABLE_OFFICER: ["timetable:read", "timetable:write", "import:manage", "venue:manage"],
  ADMIN: [
    "timetable:read",
    "timetable:write",
    "import:manage",
    "venue:manage",
    "user:manage",
    "audit:read",
    "announcement:publish",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return permissions[role].includes(permission);
}

export function roleHasAnyPermission(role: Role, required: readonly Permission[]): boolean {
  return required.some((permission) => hasPermission(role, permission));
}