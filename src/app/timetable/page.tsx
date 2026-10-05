"use client";

import { useAuth } from "@/contexts/AuthContext";
import { StudentTimetable } from "@/legacy-pages/student/StudentTimetable";
import { LecturerTimetable } from "@/legacy-pages/lecturer/LecturerTimetable";
import { TimetableManagement } from "@/legacy-pages/officer/TimetableManagement";

export default function TimetablePage() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "STUDENT":
      return <StudentTimetable />;

    case "LECTURER":
      return <LecturerTimetable />;

    case "TIMETABLE_OFFICER":
    case "ADMIN":
      return <TimetableManagement />;

    default:
      return null;
  }
}
