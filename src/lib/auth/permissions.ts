import type { Role } from "@/types";

export type UserRole = Role;

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ["/dashboard", "/timetable", "/import", "/conflicts", "/courses", "/venues", "/cohorts", "/departments", "/announcements", "/notifications", "/admin/users", "/admin/settings"],
  TIMETABLE_OFFICER: ["/dashboard", "/timetable", "/import", "/conflicts", "/rescheduling", "/venues", "/courses", "/cohorts", "/departments", "/announcements", "/notifications"],
  LECTURER: ["/dashboard", "/timetable", "/courses", "/venues", "/announcements", "/notifications"],
  STUDENT: ["/dashboard", "/timetable", "/courses", "/venues", "/announcements", "/notifications"],
};

export const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: "/dashboard",
  TIMETABLE_OFFICER: "/dashboard",
  LECTURER: "/dashboard",
  STUDENT: "/dashboard",
};

export function canAccessRoute(role: UserRole | undefined, pathname: string): boolean {
  if (!role) return false;
  const allowedRoutes = ROLE_PERMISSIONS[role] || [];
  return allowedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));
}
