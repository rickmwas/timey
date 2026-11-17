"use client";

import { useCallback, useEffect, useState } from "react";
import type { Day, TimetableEntry, TimetableStatus, User, Venue } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api-client";

type TimetableRecord = {
  entryId: string;
  occurrenceDate: string;
  effectiveDate: string;
  day: Day;
  startTime: string;
  endTime: string;
  venue: { id: string; code: string; name: string; building: string } | null;
  status: "SCHEDULED" | "CANCELLED" | "RESCHEDULED" | "POSTPONED";
  version: number;
  course: { id: string; code: string; title: string };
  cohort: { id: string; code: string; name: string };
  lecturer: { id: string; fullName: string };
};

function dateOnly(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function currentWeekRange(): { startDate: string; endDate: string } {
  const start = new Date();
  const weekday = start.getDay();
  start.setDate(start.getDate() - (weekday === 0 ? 6 : weekday - 1));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { startDate: dateOnly(start), endDate: dateOnly(end) };
}

function toEntry(record: TimetableRecord): TimetableEntry {
  const venue: Venue = {
    ...record.venue!,
    floor: "",
    capacity: 0,
    active: true,
    aliases: [],
  };
  const lecturer: User = {
    id: record.lecturer.id,
    identifier: "",
    name: record.lecturer.fullName,
    email: "",
    role: "LECTURER",
    active: true,
    createdAt: "",
  };

  const status: TimetableStatus =
    record.status === "SCHEDULED"
      ? "ACTIVE"
      : record.status === "POSTPONED"
        ? "RESCHEDULED"
        : record.status;

  return {
    id: record.entryId,
    occurrenceDate: record.occurrenceDate,
    effectiveDate: record.effectiveDate,
    version: record.version,
    courseId: record.course.id,
    course: {
      ...record.course,
      departmentId: "",
      department: { id: "", code: "", name: "", school: "" },
      credits: 0,
    },
    lecturerId: record.lecturer.id,
    lecturer,
    cohortId: record.cohort.id,
    cohort: {
      ...record.cohort,
      departmentId: "",
      department: { id: "", code: "", name: "", school: "" },
      academicYear: "",
      semester: 0,
      expectedSize: 0,
    },
    venueId: venue.id,
    venue,
    day: record.day,
    startTime: record.startTime,
    endTime: record.endTime,
    academicYear: "",
    semester: 0,
    status,
    ...(record.status === "RESCHEDULED" || record.status === "POSTPONED"
      ? { rescheduledDay: record.day, rescheduledStartTime: record.startTime, rescheduledEndTime: record.endTime, rescheduledVenue: venue }
      : {}),
  };
}

export function useTimetableEntries() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = currentWeekRange();
      const query = new URLSearchParams({ startDate, endDate, limit: "100" });
      const endpoint = user.role === "STUDENT" || user.role === "LECTURER"
        ? "/api/v1/timetables/me"
        : "/api/v1/timetable-entries";
      const records: TimetableRecord[] = [];
      let cursor: string | null = null;
      do {
        if (cursor) query.set("cursor", cursor);
        const result = await apiRequest<{ items: TimetableRecord[]; nextCursor?: string | null }>(
          `${endpoint}?${query}`,
        );
        records.push(...result.items);
        cursor = result.nextCursor ?? null;
      } while (cursor);
      setEntries(records.filter(record => record.venue).map(toEntry));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load the timetable");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { entries, isLoading, error, refresh };
}
