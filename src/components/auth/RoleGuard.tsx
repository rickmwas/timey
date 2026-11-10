"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoute, ROLE_HOME } from "@/lib/auth/permissions";

export function RoleGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      if (pathname !== "/") {
        router.replace("/");
      }
      return;
    }

    if (!canAccessRoute(user.role, pathname)) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [user, pathname, router]);

  // The login page is public and must remain visible
  // when no user session exists.
  if (!user) {
    if (pathname === "/") {
      return <>{children}</>;
    }

    return null;
  }

  if (!canAccessRoute(user.role, pathname)) {
    return null;
  }

  return <>{children}</>;
}
