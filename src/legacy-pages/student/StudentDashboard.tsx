"use client";

import { AlertTriangle, BookOpen, Clock, MapPin, Megaphone } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, StatCard } from "@/components/ui/Card";
import { TimetableCard } from "@/components/timetable/TimetableCard";
import { useAuth } from "@/contexts/AuthContext";
import { useApiCollection } from "@/hooks/use-api-collection";
import { useTimetableEntries } from "@/hooks/use-timetable";
import { toNotification, type ApiNotification } from "@/lib/notification-adapter";
import { DAY_LABELS, getTodayDay, formatTime, timeAgo } from "@/lib/utils";
import type { Day } from "@/types";

type CatalogCohort = {
  id: string;
  name: string;
  academicYear: string | null;
  semester: number | null;
};
type ApiAnnouncement = {
  id: string;
  title: string;
  createdAt: string;
  author: { fullName: string };
};

function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function StudentDashboard() {
  const { user } = useAuth();
  const { entries, isLoading: timetableLoading, error: timetableError } = useTimetableEntries();
  const { items: rawNotifications, isLoading: notificationsLoading, error: notificationsError } =
    useApiCollection<ApiNotification>("/api/v1/notifications");
  const { items: announcements, isLoading: announcementsLoading, error: announcementsError } =
    useApiCollection<ApiAnnouncement>("/api/v1/announcements");
  const { items: cohorts } = useApiCollection<CatalogCohort>("/api/v1/catalog/cohorts");

  const todayDay = getTodayDay();
  const today = localDate(new Date());
  const studentCohort = cohorts.find(cohort => cohort.id === user?.cohortId);
  const todayEntries = entries
    .filter(entry => entry.effectiveDate === today && entry.status !== "CANCELLED")
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const notifications = rawNotifications.map(toNotification);
  const unreadNotifications = notifications.filter(notification => !notification.read);
  const recentAnnouncements = announcements.slice(0, 3);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nextClass = todayEntries.find(entry => {
    const [hour, minute] = entry.startTime.split(":").map(Number);
    return hour * 60 + minute > nowMinutes;
  });
  const loadErrors = [timetableError, notificationsError, announcementsError].filter(Boolean);

  return (
    <Layout breadcrumb={[{ label: "Dashboard" }]}>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-slate-900">
          Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"},{" "}
          <span className="text-[#1a2f5c]">{user?.name.split(" ")[0]}</span>
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {studentCohort?.name ?? "Your cohort"} · {studentCohort?.academicYear ? `${studentCohort.academicYear} Semester ${studentCohort.semester ?? ""} · ` : ""}
          {now.toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {loadErrors.map((message, index) => (
        <p key={`${index}:${message}`} className="mb-3 text-sm text-red-700" role="alert">{message}</p>
      ))}
      {(timetableLoading || notificationsLoading || announcementsLoading) && (
        <p className="mb-3 text-sm text-slate-500" role="status">Loading your dashboard...</p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Today's Classes"
          value={todayEntries.length}
          icon={<Clock size={18} className="text-[#1a2f5c]" />}
          iconBg="bg-blue-100"
          subtitle={todayEntries.length === 0 ? "No classes today" : DAY_LABELS[todayDay]}
        />
        <StatCard
          label="My Courses"
          value={new Set(entries.map(entry => entry.courseId)).size}
          icon={<BookOpen size={18} className="text-violet-600" />}
          iconBg="bg-violet-100"
          subtitle="This week"
        />
        <StatCard
          label="Unread Alerts"
          value={unreadNotifications.length}
          icon={<AlertTriangle size={18} className="text-amber-600" />}
          iconBg="bg-amber-100"
          subtitle={unreadNotifications.length > 0 ? "Requires attention" : "All caught up"}
        />
        <StatCard
          label="Cancelled This Week"
          value={entries.filter(entry => entry.status === "CANCELLED").length}
          icon={<MapPin size={18} className="text-red-500" />}
          iconBg="bg-red-100"
          subtitle="Scheduled occurrences"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {nextClass && (
            <Card className="border-l-4 border-l-[#3b6fd4] bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#3b6fd4]">Next Class</p>
                  <h3 className="text-base font-bold text-slate-900">{nextClass.course.title}</h3>
                  <p className="mt-0.5 text-sm text-slate-600">{nextClass.course.code}</p>
                  <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1"><Clock size={13} /> {formatTime(nextClass.startTime)}</span>
                    <span className="flex items-center gap-1"><MapPin size={13} /> {nextClass.venue.code}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-3xl font-bold text-[#1a2f5c]">{formatTime(nextClass.startTime)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{nextClass.venue.building}</p>
                </div>
              </div>
            </Card>
          )}

          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Clock size={15} />               Today&apos;s Schedule — {DAY_LABELS[todayDay]}
            </h2>
            {todayEntries.length === 0 ? (
              <Card className="py-10 text-center"><p className="text-sm text-slate-400">No classes scheduled for today.</p></Card>
            ) : (
              <div className="space-y-3">
                {todayEntries.map(entry => <TimetableCard key={`${entry.id}:${entry.occurrenceDate}`} entry={entry} />)}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {unreadNotifications.length > 0 && (
            <Card>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <AlertTriangle size={15} className="text-amber-500" /> Schedule Alerts
              </h2>
              <div className="space-y-3">
                {unreadNotifications.slice(0, 3).map(notification => (
                  <div key={notification.id} className="text-sm">
                    <p className="font-medium text-slate-800">{notification.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{notification.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{timeAgo(notification.createdAt)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Megaphone size={15} /> Announcements
            </h2>
            {recentAnnouncements.length === 0 ? (
              <p className="text-sm text-slate-400">No announcements</p>
            ) : (
              <div className="space-y-3">
                {recentAnnouncements.map(announcement => (
                  <div key={announcement.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <p className="line-clamp-2 text-sm font-medium text-slate-800">{announcement.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{announcement.author.fullName} · {timeAgo(announcement.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">This Week</h2>
            <div className="space-y-2">
              {(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as Day[]).map(day => {
                const dayEntries = entries.filter(entry => entry.day === day && entry.status !== "CANCELLED");
                return (
                  <div key={day} className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-sm ${day === todayDay ? "bg-blue-50" : ""}`}>
                    <span className={`font-medium ${day === todayDay ? "text-[#1a2f5c]" : "text-slate-600"}`}>{day.slice(0, 3)}</span>
                    <span className="text-xs text-slate-500">{dayEntries.length || "—"}{dayEntries.length ? ` class${dayEntries.length === 1 ? "" : "es"}` : ""}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
