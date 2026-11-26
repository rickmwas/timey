"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getRouteRedirect,
  isPublicRoute,
} from "@/lib/auth/permissions";

export function RoleGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, sessionError } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = isPublicRoute(pathname);
  const redirect = getRouteRedirect(user?.role, pathname);

  useEffect(() => {
    if (isLoading || sessionError || !redirect) return;
    router.replace(redirect);
  }, [isLoading, sessionError, redirect, router]);

  if (isLoading && !isPublic) {
    return (
      <main className="grid min-h-screen place-items-center" role="status">
        Restoring your session…
      </main>
    );
  }

  if (sessionError && !isPublic) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <p className="max-w-md text-center text-sm text-red-700" role="alert">
          Could not verify your session. {sessionError} Please reload the page and try again.
        </p>
      </main>
    );
  }

  if (isPublic && !user) {
    return <>{children}</>;
  }

  if (redirect) {
    return (
      <main className="grid min-h-screen place-items-center" role="status">
        {user ? "Redirecting to your dashboard…" : "Redirecting to sign in…"}
      </main>
    );
  }

  return <>{children}</>;
}
