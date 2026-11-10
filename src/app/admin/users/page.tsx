"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { UserManagement } from "@/legacy-pages/admin/UserManagement";

export default function Page() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (!user || user.role !== "ADMIN") {
    return null;
  }


  return <UserManagement />;
}
