import type { Role } from "@prisma/client";
import { AppError } from "@/server/errors/app-error";

export type Permission =
  | "timetable:read"
  | "timetable:write"
  | "timetable:publish"
  | "import:manage"
  | "venue:manage"
  | "user:manage"
  | "audit:read"
  | "announcement:publish"
  | "department:manage"
  | "programme:manage"
  | "teaching-assignment:read"
  | "teaching-assignment:write"
  | "student-enrollment:read"
  | "student-enrollment:write"
  | "school:manage";

const permissions: Record<Role, readonly Permission[]> = {
  STUDENT: [
    "timetable:read",
    "student-enrollment:read",
    "student-enrollment:write",
  ],
  LECTURER: [
    "timetable:read",
    "announcement:publish",
    "teaching-assignment:read",
  ],
  COD: [
    "timetable:read",
    "timetable:write",
    "timetable:publish",
    "announcement:publish",
    "department:manage",
    "programme:manage",
    "teaching-assignment:read",
    "teaching-assignment:write",
    "student-enrollment:read",
    "student-enrollment:write",
    "import:manage",
  ],
  DEAN: [
    "timetable:read",
    "timetable:write",
    "timetable:publish",
    "announcement:publish",
    "department:manage",
    "programme:manage",
    "school:manage",
    "teaching-assignment:read",
    "teaching-assignment:write",
    "student-enrollment:read",
    "student-enrollment:write",
    "import:manage",
  ],
  TIMETABLE_OFFICER: [
    "timetable:read",
    "timetable:write",
    "timetable:publish",
    "import:manage",
    "venue:manage",
    "announcement:publish",
    "teaching-assignment:read",
    "student-enrollment:read",
  ],
  ADMIN: [
    "timetable:read",
    "timetable:write",
    "timetable:publish",
    "import:manage",
    "venue:manage",
    "user:manage",
    "audit:read",
    "announcement:publish",
    "department:manage",
    "programme:manage",
    "school:manage",
    "teaching-assignment:read",
    "teaching-assignment:write",
    "student-enrollment:read",
    "student-enrollment:write",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return permissions[role]?.includes(permission) ?? false;
}

export function roleHasAnyPermission(role: Role, required: readonly Permission[]): boolean {
  return required.some((permission) => hasPermission(role, permission));
}

export interface ScopedActor {
  id: string;
  role: Role;
  departmentId?: string | null;
  schoolId?: string | null;
}

export function assertDepartmentScope(actor: ScopedActor, targetDepartmentId: string): void {
  if (actor.role === "ADMIN" || actor.role === "TIMETABLE_OFFICER") return;
  if (actor.role === "COD" && actor.departmentId === targetDepartmentId) return;
  throw new AppError("FORBIDDEN", "You do not have administrative authority over this department", 403);
}

export function assertSchoolScope(actor: ScopedActor, targetSchoolId: string): void {
  if (actor.role === "ADMIN" || actor.role === "TIMETABLE_OFFICER") return;
  if (actor.role === "DEAN" && actor.schoolId === targetSchoolId) return;
  throw new AppError("FORBIDDEN", "You do not have administrative authority over this school", 403);
}
