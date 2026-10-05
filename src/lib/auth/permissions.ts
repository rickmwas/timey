export type UserRole = "admin" | "officer" | "lecturer" | "student";

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ["/dashboard", "/timetable", "/courses", "/venues", "/cohorts", "/departments", "/announcements", "/admin/users", "/admin/settings"],
  officer: ["/dashboard", "/timetable", "/courses", "/venues", "/cohorts", "/departments", "/announcements", "/import", "/conflicts", "/rescheduling"],
  lecturer: ["/dashboard", "/timetable", "/courses", "/venues", "/announcements"],
  student: ["/dashboard", "/timetable", "/courses", "/announcements"],
};

export const ROLE_HOME: Record<UserRole, string> = {
  admin: "/dashboard",
  officer: "/dashboard",
  lecturer: "/dashboard",
  student: "/dashboard",
};

export function canAccessRoute(role: UserRole | undefined, pathname: string): boolean {
  if (!role) return false;
  const allowedRoutes = ROLE_PERMISSIONS[role] || [];
  return allowedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));
}
