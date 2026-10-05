"use client";

import { useAuth } from "@/contexts/AuthContext";
import { StudentDashboard } from "@/legacy-pages/student/StudentDashboard";
import { LecturerDashboard } from "@/legacy-pages/lecturer/LecturerDashboard";
import { OfficerDashboard } from "@/legacy-pages/officer/OfficerDashboard";
import { AdminDashboard } from "@/legacy-pages/admin/AdminDashboard";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "STUDENT":
      return <StudentDashboard />;

    case "LECTURER":
      return <LecturerDashboard />;

    case "TIMETABLE_OFFICER":
      return <OfficerDashboard />;

    case "ADMIN":
      return <AdminDashboard />;

    default:
      return null;
  }
}
