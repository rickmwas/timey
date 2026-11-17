"use client";

import { useState } from "react";
import { BookOpen, Calendar, Clock, MapPin, Users } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, StatCard } from "@/components/ui/Card";
import { TimetableCard } from "@/components/timetable/TimetableCard";
import { useAuth } from "@/contexts/AuthContext";
import { useApiCollection } from "@/hooks/use-api-collection";
import { useTimetableEntries } from "@/hooks/use-timetable";
import { toNotification, type ApiNotification } from "@/lib/notification-adapter";
import { DAY_LABELS, DAY_ORDER, formatTime, getTodayDay, timeAgo } from "@/lib/utils";
import type { Day } from "@/types";

type ApiAnnouncement = {
  id: string;
  title: string;
  createdAt: string;
};

export function LecturerDashboard() {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState<Day>(getTodayDay());
  const todayDay = getTodayDay();
  const { entries, isLoading: timetableLoading, error: timetableError } = useTimetableEntries();
  const { items: rawNotifications, isLoading: notificationsLoading, error: notificationsError } =
    useApiCollection<ApiNotification>("/api/v1/notifications");
  const { items: announcements, isLoading: announcementsLoading, error: announcementsError } =
    useApiCollection<ApiAnnouncement>("/api/v1/announcements");

  const todayEntries = entries
    .filter(entry => entry.day === todayDay && entry.status !== "CANCELLED")
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const uniqueCourses = new Set(entries.map(entry => entry.courseId)).size;
  const uniqueVenues = new Set(entries.map(entry => entry.venueId)).size;
  const uniqueCohorts = new Set(entries.map(entry => entry.cohortId)).size;
  const weeklyHours = entries.reduce((sum, entry) => {
    if (entry.status === "CANCELLED") return sum;
    const [startHour, startMinute] = entry.startTime.split(":").map(Number);
    const [endHour, endMinute] = entry.endTime.split(":").map(Number);
    return sum + (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60;
  }, 0);
  const dayEntries = entries
    .filter(entry => entry.day === selectedDay && entry.status !== "CANCELLED")
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const notifications = rawNotifications.map(toNotification);
  const loadErrors = [timetableError, notificationsError, announcementsError].filter(Boolean);

  return (
    <Layout breadcrumb={[{ label: "Dashboard" }]}>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-slate-900">
          {new Date().getHours() < 12 ? "Good morning" : "Good afternoon"},{" "}
          <span className="text-[#1a2f5c]">{user?.name}</span>
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          {" · "}This week&apos;s teaching schedule
        </p>
      </div>

      {loadErrors.map((message, index) => (
        <p key={`${index}:${message}`} className="mb-3 text-sm text-red-700" role="alert">{message}</p>
      ))}
      {(timetableLoading || notificationsLoading || announcementsLoading) && (
        <p className="mb-3 text-sm text-slate-500" role="status">Loading your dashboard...</p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's Classes" value={todayEntries.length} icon={<Clock size={18} className="text-[#1a2f5c]" />} iconBg="bg-blue-100" />
        <StatCard label="Courses Taught" value={uniqueCourses} icon={<BookOpen size={18} className="text-violet-600" />} iconBg="bg-violet-100" />
        <StatCard label="Cohorts" value={uniqueCohorts} icon={<Users size={18} className="text-emerald-600" />} iconBg="bg-emerald-100" />
        <StatCard label="Weekly Hours" value={`${weeklyHours}h`} icon={<Calendar size={18} className="text-amber-600" />} iconBg="bg-amber-100" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {DAY_ORDER.filter(day => day !== "SATURDAY").map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${selectedDay === day ? "bg-[#1a2f5c] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {DAY_LABELS[day].slice(0, 3)}
                {day === todayDay && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {dayEntries.length === 0 ? (
              <Card className="py-10 text-center"><p className="text-sm text-slate-400">No classes on {DAY_LABELS[selectedDay]}</p></Card>
            ) : (
              dayEntries.map(entry => <TimetableCard key={`${entry.id}:${entry.occurrenceDate}`} entry={entry} />)
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Weekly Schedule</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>{DAY_ORDER.filter(day => day !== "SATURDAY").map(day => (
                    <th key={day} className={`pb-2 text-center font-semibold ${day === todayDay ? "text-[#1a2f5c]" : "text-slate-400"}`}>{day.slice(0, 3)}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  <tr>
                    {DAY_ORDER.filter(day => day !== "SATURDAY").map(day => {
                      const count = entries.filter(entry => entry.day === day && entry.status !== "CANCELLED").length;
                      return (
                        <td key={day} className="py-2 text-center">
                          {count > 0 ? (
                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${day === todayDay ? "bg-[#1a2f5c] text-white" : "bg-slate-100 text-slate-700"}`}>{count}</span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><MapPin size={14} /> Assigned Venues</h3>
            <div className="space-y-2">
              {[...new Map(entries.map(entry => [entry.venue.id, entry])).values()].map(entry => (
                <div key={entry.venue.id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
                  <MapPin size={13} className="flex-shrink-0 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{entry.venue.code}</p>
                    <p className="text-xs text-slate-500">{entry.venue.building}</p>
                  </div>
                </div>
              ))}
              {uniqueVenues === 0 && <p className="text-sm text-slate-400">No assigned venues this week</p>}
            </div>
          </Card>

          {notifications.length > 0 && (
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Notifications</h3>
              <div className="space-y-2">
                {notifications.slice(0, 3).map(notification => (
                  <div key={notification.id} className={`rounded-lg p-2 text-xs ${!notification.read ? "border border-blue-100 bg-blue-50" : "bg-slate-50"}`}>
                    <p className="font-medium text-slate-800">{notification.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-slate-500">{notification.message}</p>
                    <p className="mt-1 text-slate-400">{timeAgo(notification.createdAt)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Recent Announcements</h3>
            {announcements.length === 0 ? (
              <p className="text-sm text-slate-400">No announcements</p>
            ) : (
              <div className="space-y-2">
                {announcements.slice(0, 3).map(announcement => (
                  <div key={announcement.id} className="border-b border-slate-100 pb-2 last:border-0">
                    <p className="text-sm font-medium text-slate-800">{announcement.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{timeAgo(announcement.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
