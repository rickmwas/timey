import type { Role } from "@prisma/client";

export const ROLE_HOME: Record<Role, string> = {
  STUDENT: "/dashboard",
  LECTURER: "/dashboard",
  TIMETABLE_OFFICER: "/dashboard",
  ADMIN: "/dashboard",
};

export const ROLE_ROUTES: Record<Role, string[]> = {
  STUDENT: [
    "/dashboard",
    "/timetable",
    "/courses",
    "/announcements",
    "/notifications",
  ],

  LECTURER: [
    "/dashboard",
    "/timetable",
    "/courses",
    "/announcements",
    "/notifications",
  ],

  TIMETABLE_OFFICER: [
    "/dashboard",
    "/timetable",
    "/venues",
    "/courses",
    "/cohorts",
    "/departments",
    "/import",
    "/conflicts",
    "/rescheduling",
    "/announcements",
    "/notifications",
  ],

  ADMIN: [
    "/dashboard",
    "/timetable",
    "/venues",
    "/courses",
    "/cohorts",
    "/departments",
    "/import",
    "/conflicts",
    "/rescheduling",
    "/announcements",
    "/notifications",
    "/admin/users",
    "/admin/settings",
  ],
};

export function canAccessRoute(
  role: Role | undefined,
  pathname: string
): boolean {
  if (!role) return false;

  return ROLE_ROUTES[role].some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );
}
