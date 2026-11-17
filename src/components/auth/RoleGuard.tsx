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
  const { user, isLoading, sessionError } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || sessionError) return;

    if (!user) {
      if (pathname !== "/") {
        router.replace("/");
      }
      return;
    }

    if (pathname === "/" || !canAccessRoute(user.role, pathname)) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [user, isLoading, sessionError, pathname, router]);

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center" role="status">
        Restoring your session…
      </main>
    );
  }

  if (sessionError && pathname !== "/") {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <p className="max-w-md text-center text-sm text-red-700" role="alert">
          Could not verify your session. {sessionError} Please reload the page and try again.
        </p>
      </main>
    );
  }

  // The login page is public and must remain visible
  // when no user session exists.
  if (!user) {
    if (pathname === "/") {
      return <>{children}</>;
    }

    return (
      <main className="grid min-h-screen place-items-center" role="status">
        Redirecting to sign in…
      </main>
    );
  }

  if (pathname === "/" || !canAccessRoute(user.role, pathname)) {
    return (
      <main className="grid min-h-screen place-items-center" role="status">
        Redirecting to your dashboard…
      </main>
    );
  }

  return <>{children}</>;
}
