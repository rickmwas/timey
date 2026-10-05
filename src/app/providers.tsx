"use client";

import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <RoleGuard>{children}</RoleGuard>
    </AuthProvider>
  );
}
