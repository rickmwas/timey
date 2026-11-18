"use client";

import { useState } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  MapPin,
  RefreshCw,
  UserCheck,
  Users,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout/Layout";
import { Card, StatCard } from "@/components/ui/Card";
import { TimetableStatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useApiCollection } from "@/hooks/use-api-collection";
import { useTimetableEntries } from "@/hooks/use-timetable";
import { formatTime, DAY_LABELS } from "@/lib/utils";
import type { TimetableEntry } from "@/types";

type Course = {
  id: string;
  code: string;
  title: string;
  credits: number;
  departmentId: string;
};

type Cohort = {
  id: string;
  code: string;
  name: string;
  expectedSize: number;
  departmentId: string;
};

type UserRecord = {
  id: string;
  fullName: string;
  institutionalId: string;
  email: string;
  role: string;
  departmentId?: string;
};

export function CodDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "assignments" | "requests">("overview");

  const { entries, isLoading: timetableLoading } = useTimetableEntries();
  const { items: courses, isLoading: coursesLoading } = useApiCollection<Course>("/api/v1/catalog/courses");
  const { items: cohorts, isLoading: cohortsLoading } = useApiCollection<Cohort>("/api/v1/catalog/cohorts");
  const { items: allUsers, isLoading: usersLoading } = useApiCollection<UserRecord>("/api/v1/admin/users");

  const departmentCourses = courses.filter((c) => !user?.departmentId || c.departmentId === user.departmentId);
  const departmentCohorts = cohorts.filter((c) => !user?.departmentId || c.departmentId === user.departmentId);
  const departmentLecturers = allUsers.filter((u) => u.role === "LECTURER" && (!user?.departmentId || u.departmentId === user.departmentId));

  // Department slots
  const departmentCourseIds = new Set(departmentCourses.map((c) => c.id));
  const departmentEntries = entries.filter((e) => departmentCourseIds.has(e.courseId) || !user?.departmentId);

  // Pending change requests / overrides
  const pendingRequests = departmentEntries.filter((e) => e.status !== "ACTIVE");

  return (
    <Layout>
      <div className="space-y-6">
        {/* Institutional COD Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-2xl p-6 text-white border border-white/10 shadow-lg">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gold-400 bg-gold-400/10 px-2.5 py-0.5 rounded-full border border-gold-400/20">
                Departmental Academic Cockpit
              </span>
              <span className="text-xs text-blue-200">Kisii University</span>
            </div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold tracking-tight text-white">
              {user?.departmentId ? "Department Leadership" : "Chair of Department Console"}
            </h1>
            <p className="text-sm text-blue-200 mt-1">
              Academic structure, curriculum allocation, and timetable governance for 2026/2027 Semester 1.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/timetable")}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs"
            >
              <Calendar size={14} className="mr-1.5" /> Department Schedule
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/rescheduling")}
              className="bg-gold-500 text-navy-950 hover:bg-gold-400 font-semibold text-xs border border-gold-400"
            >
              <RefreshCw size={14} className="mr-1.5" /> Schedule Actions
            </Button>
          </div>
        </div>

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Department Units"
            value={coursesLoading ? "..." : departmentCourses.length}
            icon={<BookOpen size={20} className="text-blue-600" />}
            iconBg="bg-blue-50"
            subtitle="Approved course units"
          />
          <StatCard
            label="Active Cohorts"
            value={cohortsLoading ? "..." : departmentCohorts.length}
            icon={<GraduationCap size={20} className="text-emerald-600" />}
            iconBg="bg-emerald-50"
            subtitle="Enrolled class groups"
          />
          <StatCard
            label="Teaching Faculty"
            value={usersLoading ? "..." : departmentLecturers.length}
            icon={<Users size={20} className="text-violet-600" />}
            iconBg="bg-violet-50"
            subtitle="Assigned academic staff"
          />
          <StatCard
            label="Change Requests"
            value={timetableLoading ? "..." : pendingRequests.length}
            icon={<AlertCircle size={20} className="text-amber-600" />}
            iconBg="bg-amber-50"
            subtitle="Requires departmental review"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-navy-900 text-navy-900 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Layers size={16} /> Department Timetable Overview
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "assignments"
                ? "border-navy-900 text-navy-900 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <UserCheck size={16} /> Teaching Allocation Roster
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "requests"
                ? "border-navy-900 text-navy-900 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <RefreshCw size={16} /> Schedule Changes ({pendingRequests.length})
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scheduled slots table */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Calendar size={18} className="text-navy-900" /> Current Weekly Timetable Slots
                  </h2>
                  <span className="text-xs text-slate-500">{departmentEntries.length} total scheduled</span>
                </div>

                {departmentEntries.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <BookOpen size={36} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No scheduled slots found for this department.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
                    {departmentEntries.slice(0, 10).map((entry) => (
                      <div key={entry.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-navy-900 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
                              {entry.course.code}
                            </span>
                            <span className="text-xs text-slate-500">{entry.cohort.code}</span>
                            <TimetableStatusBadge status={entry.status} />
                          </div>
                          <p className="text-sm font-medium text-slate-800 truncate mt-0.5">{entry.course.title}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {DAY_LABELS[entry.day]} {formatTime(entry.startTime)}–{formatTime(entry.endTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={12} /> {entry.venue.code} ({entry.venue.building})
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs text-slate-600 block">{entry.lecturer.name}</span>
                          <span className="text-[10px] text-slate-400 block">3 Contact Hrs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Department Cohorts & Curricula */}
            <div className="space-y-4">
              <Card className="p-5">
                <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <GraduationCap size={18} className="text-navy-900" /> Academic Cohorts
                </h2>
                <div className="space-y-2.5">
                  {departmentCohorts.map((cohort) => (
                    <div key={cohort.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{cohort.code}</p>
                        <p className="text-xs text-slate-500">{cohort.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-navy-900 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                          {cohort.expectedSize} Students
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: Teaching Allocation Roster */}
        {activeTab === "assignments" && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Department Teaching Staff Allocation</h2>
                <p className="text-xs text-slate-500">Official unit allocation and teaching workload overview</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {departmentLecturers.map((lecturer) => {
                const assignedSlots = departmentEntries.filter((e) => e.lecturerId === lecturer.id);
                const contactHours = assignedSlots.length * 3;
                return (
                  <div key={lecturer.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-navy-100 text-navy-900 font-semibold flex items-center justify-center text-sm border border-navy-200">
                        {lecturer.fullName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{lecturer.fullName}</p>
                        <p className="text-xs text-slate-500">{lecturer.institutionalId} · {lecturer.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Teaching Units</span>
                        <span className="text-sm font-bold text-navy-900">{assignedSlots.length} Units</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Weekly Contact</span>
                        <span className={`text-sm font-bold ${contactHours > 12 ? "text-amber-600" : "text-emerald-600"}`}>
                          {contactHours} Hours
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/timetable?lecturerId=${lecturer.id}`)}
                        className="text-xs"
                      >
                        View Schedule
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Tab 3: Schedule Changes */}
        {activeTab === "requests" && (
          <Card className="p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-2">Schedule Overrides & Changes</h2>
            <p className="text-xs text-slate-500 mb-4">
              Real-time audit of cancellations, postponements, and venue moves affecting your department
            </p>

            {pendingRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 size={40} className="mx-auto mb-2 text-emerald-500 opacity-80" />
                <p className="text-sm font-medium text-slate-700">All department classes operating on master schedule</p>
                <p className="text-xs text-slate-400 mt-0.5">No active cancellations or room swaps pending.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((entry) => (
                  <div key={entry.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-navy-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {entry.course.code}
                        </span>
                        <span className="text-xs text-slate-600 font-medium">{entry.course.title}</span>
                        <TimetableStatusBadge status={entry.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5">
                        Lecturer: {entry.lecturer.name} · Cohort: {entry.cohort.code}
                      </p>
                      {entry.cancellationReason && (
                        <p className="text-xs text-red-600 mt-1">Reason: {entry.cancellationReason}</p>
                      )}
                      {entry.reschedulingReason && (
                        <p className="text-xs text-amber-700 mt-1">Note: {entry.reschedulingReason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => router.push(`/rescheduling`)}
                        className="text-xs"
                      >
                        Manage Change
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </Layout>
  );
}
