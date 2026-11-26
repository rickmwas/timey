import type { Role } from "@/types";

export type UserRole = Role;

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: [
    "/dashboard",
    "/timetable",
    "/import",
    "/conflicts",
    "/courses",
    "/venues",
    "/cohorts",
    "/departments",
    "/announcements",
    "/notifications",
    "/settings",
    "/admin/users",
    "/admin/settings",
  ],
  TIMETABLE_OFFICER: [
    "/dashboard",
    "/timetable",
    "/import",
    "/conflicts",
    "/rescheduling",
    "/venues",
    "/courses",
    "/cohorts",
    "/departments",
    "/announcements",
    "/notifications",
    "/settings",
  ],
  COD: [
    "/dashboard",
    "/timetable",
    "/courses",
    "/venues",
    "/cohorts",
    "/departments",
    "/announcements",
    "/notifications",
    "/settings",
    "/rescheduling",
  ],
  DEAN: [
    "/dashboard",
    "/timetable",
    "/courses",
    "/venues",
    "/cohorts",
    "/departments",
    "/announcements",
    "/notifications",
    "/settings",
  ],
  LECTURER: [
    "/dashboard",
    "/timetable",
    "/courses",
    "/venues",
    "/announcements",
    "/notifications",
    "/settings",
    "/rescheduling",
  ],
  STUDENT: [
    "/dashboard",
    "/timetable",
    "/courses",
    "/venues",
    "/announcements",
    "/notifications",
    "/settings",
  ],
};

export const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: "/dashboard",
  TIMETABLE_OFFICER: "/dashboard",
  COD: "/dashboard",
  DEAN: "/dashboard",
  LECTURER: "/dashboard",
  STUDENT: "/dashboard",
};

export const PUBLIC_ROUTES = new Set(["/", "/login", "/signup"]);

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.has(pathname);
}

export function getRouteRedirect(
  role: UserRole | undefined,
  pathname: string,
): string | null {
  if (isPublicRoute(pathname)) {
    return role ? ROLE_HOME[role] : null;
  }

  if (!role) return "/login";
  return canAccessRoute(role, pathname) ? null : ROLE_HOME[role];
}

export function canAccessRoute(role: UserRole | undefined, pathname: string): boolean {
  if (!role) return false;
  const allowedRoutes = ROLE_PERMISSIONS[role] || [];
  return allowedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));
}
