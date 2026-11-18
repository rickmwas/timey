"use client";

import { AlertTriangle, BookOpen, Building2, Calendar, GraduationCap, MapPin, TrendingUp, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout/Layout";
import { Card, StatCard } from "@/components/ui/Card";
import { RoleBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useApiCollection } from "@/hooks/use-api-collection";
import { useTimetableEntries } from "@/hooks/use-timetable";
import { timeAgo, ROLE_LABEL } from "@/lib/utils";
import type { Role } from "@/types";

type AdminUser = {
  id: string;
  fullName: string;
  institutionalId: string;
  role: Role;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  department: { name: string } | null;
};
type Department = { id: string };
type Course = { id: string };
type Cohort = { id: string };
type Venue = { id: string; isActive: boolean };
type Announcement = {
  id: string;
  title: string;
  createdAt: string;
  author: { fullName: string };
};

export function AdminDashboard() {
  const router = useRouter();
  const { items: users, isLoading: usersLoading, error: usersError } =
    useApiCollection<AdminUser>("/api/v1/admin/users");
  const { items: departments, isLoading: departmentsLoading, error: departmentsError } =
    useApiCollection<Department>("/api/v1/catalog/departments");
  const { items: courses, isLoading: coursesLoading, error: coursesError } =
    useApiCollection<Course>("/api/v1/catalog/courses");
  const { items: cohorts, isLoading: cohortsLoading, error: cohortsError } =
    useApiCollection<Cohort>("/api/v1/catalog/cohorts");
  const { items: venues, isLoading: venuesLoading, error: venuesError } =
    useApiCollection<Venue>("/api/v1/venues");
  const { items: announcements, isLoading: announcementsLoading, error: announcementsError } =
    useApiCollection<Announcement>("/api/v1/announcements");
  const { entries, isLoading: timetableLoading, error: timetableError } = useTimetableEntries();

  const roleCounts: Record<Role, number> = {
    STUDENT: users.filter(user => user.role === "STUDENT").length,
    LECTURER: users.filter(user => user.role === "LECTURER").length,
    TIMETABLE_OFFICER: users.filter(user => user.role === "TIMETABLE_OFFICER").length,
    ADMIN: users.filter(user => user.role === "ADMIN").length,
  };
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);
  const errors = [usersError, departmentsError, coursesError, cohortsError, venuesError, announcementsError, timetableError].filter(Boolean);
  const loading = usersLoading || departmentsLoading || coursesLoading || cohortsLoading || venuesLoading || announcementsLoading || timetableLoading;
  const weekCancelled = entries.filter(entry => entry.status === "CANCELLED").length;
  const weekActive = entries.filter(entry => entry.status !== "CANCELLED").length;

  return (
    <Layout breadcrumb={[{ label: "Admin Dashboard" }]}>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-slate-900">System Administration</h1>
        <p className="text-sm text-slate-500">Kisii University · Timy Management Platform</p>
      </div>

      {errors.map((message, index) => <p key={`${index}:${message}`} className="mb-3 text-sm text-red-700" role="alert">{message}</p>)}
      {loading && <p className="mb-3 text-sm text-slate-500" role="status">Loading administration data...</p>}

      <div className="mb-2"><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Users</h2></div>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Users" value={users.length} icon={<Users size={18} className="text-[#1a2f5c]" />} iconBg="bg-blue-100" />
        <StatCard label="Students" value={roleCounts.STUDENT} icon={<GraduationCap size={18} className="text-violet-600" />} iconBg="bg-violet-100" />
        <StatCard label="Lecturers" value={roleCounts.LECTURER} icon={<Users size={18} className="text-sky-600" />} iconBg="bg-sky-100" />
        <StatCard label="Officers" value={roleCounts.TIMETABLE_OFFICER} icon={<Users size={18} className="text-amber-600" />} iconBg="bg-amber-100" />
      </div>

      <div className="mb-2"><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Academic Structure</h2></div>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Departments" value={departments.length} icon={<Building2 size={18} className="text-teal-600" />} iconBg="bg-teal-100" />
        <StatCard label="Courses" value={courses.length} icon={<BookOpen size={18} className="text-emerald-600" />} iconBg="bg-emerald-100" />
        <StatCard label="Cohorts" value={cohorts.length} icon={<GraduationCap size={18} className="text-rose-600" />} iconBg="bg-rose-100" />
        <StatCard label="Active Venues" value={venues.filter(venue => venue.isActive).length} icon={<MapPin size={18} className="text-indigo-600" />} iconBg="bg-indigo-100" />
      </div>

      <div className="mb-2"><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">This Week&apos;s Timetable</h2></div>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Occurrences" value={entries.length} icon={<Calendar size={18} className="text-[#1a2f5c]" />} iconBg="bg-blue-100" />
        <StatCard label="Scheduled" value={weekActive} icon={<TrendingUp size={18} className="text-emerald-600" />} iconBg="bg-emerald-100" />
        <StatCard label="Cancelled" value={weekCancelled} icon={<AlertTriangle size={18} className="text-red-500" />} iconBg="bg-red-100" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-800">Recent Users</h2>
              <Button variant="ghost" size="sm" onClick={() => router.push("/admin/users")}>Manage Users</Button>
            </div>
            {recentUsers.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No users found</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#1a2f5c]/10">
                      <span className="text-xs font-bold text-[#1a2f5c]">{user.fullName[0]}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{user.fullName}</p>
                      <p className="text-xs text-slate-500">{user.institutionalId} · {user.department?.name || "No department"}</p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <RoleBadge role={user.role} />
                      <span className="text-xs text-slate-400">{timeAgo(user.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: "Manage Users", to: "/admin/users" },
                { label: "View Timetable", to: "/timetable" },
                { label: "Import Data", to: "/import" },
                { label: "Manage Venues", to: "/venues" },
                { label: "Post Announcement", to: "/announcements" },
              ].map(action => (
                <button key={action.to} onClick={() => router.push(action.to)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3b6fd4]" />{action.label}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">User Distribution</h3>
            <div className="space-y-2">
              {(Object.entries(roleCounts) as [Role, number][]).map(([role, count]) => (
                <div key={role} className="flex items-center gap-3">
                  <span className="w-28 text-xs text-slate-600">{ROLE_LABEL[role]}</span>
                  <div className="h-2 flex-1 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-[#3b6fd4] transition-all" style={{ width: `${users.length ? (count / users.length) * 100 : 0}%` }} />
                  </div>
                  <span className="w-4 text-right text-xs font-semibold text-slate-700">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Recent Announcements</h3>
            {announcements.length === 0 ? (
              <p className="text-sm text-slate-400">No announcements</p>
            ) : (
              <div className="space-y-2">
                {announcements.slice(0, 3).map(announcement => (
                  <div key={announcement.id} className="border-b border-slate-100 pb-2 last:border-0">
                    <p className="text-xs font-medium text-slate-800">{announcement.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{announcement.author.fullName} · {timeAgo(announcement.createdAt)}</p>
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
