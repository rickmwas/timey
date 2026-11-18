"use client";

import { AlertTriangle, BookOpen, Calendar, MapPin, RefreshCw, Upload, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout/Layout";
import { Card, StatCard } from "@/components/ui/Card";
import { TimetableStatusBadge, ImportStatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useApiCollection } from "@/hooks/use-api-collection";
import { useTimetableEntries } from "@/hooks/use-timetable";
import { formatTime, timeAgo, DAY_LABELS } from "@/lib/utils";
import type { ImportStatus, TimetableEntry } from "@/types";

type Venue = { id: string; isActive: boolean };
type Course = { id: string };
type Cohort = { id: string };
type Department = { id: string };
type ImportJob = {
  id: string;
  fileName: string;
  status: ImportStatus;
  totalRows: number;
  conflictRows: number;
  createdAt: string;
};

function isPendingImport(job: ImportJob): boolean {
  return job.status === "VALIDATED" || job.status === "CONFLICTS_DETECTED";
}

export function OfficerDashboard() {
  const router = useRouter();
  const { entries, isLoading: timetableLoading, error: timetableError } = useTimetableEntries();
  const { items: venues, isLoading: venuesLoading, error: venuesError } =
    useApiCollection<Venue>("/api/v1/venues");
  const { items: courses, isLoading: coursesLoading, error: coursesError } =
    useApiCollection<Course>("/api/v1/catalog/courses");
  const { items: cohorts, isLoading: cohortsLoading, error: cohortsError } =
    useApiCollection<Cohort>("/api/v1/catalog/cohorts");
  const { items: departments, isLoading: departmentsLoading, error: departmentsError } =
    useApiCollection<Department>("/api/v1/catalog/departments");
  const { items: jobs, isLoading: jobsLoading, error: jobsError } =
    useApiCollection<ImportJob>("/api/v1/imports");

  const activeVenues = venues.filter(venue => venue.isActive).length;
  const pendingImports = jobs.filter(isPendingImport);
  const conflictRows = pendingImports.reduce((count, job) => count + job.conflictRows, 0);
  const recentChanges = entries
    .filter(entry => entry.status !== "ACTIVE")
    .slice(0, 5);
  const loadErrors = [timetableError, venuesError, coursesError, cohortsError, departmentsError, jobsError].filter(Boolean);
  const loading = timetableLoading || venuesLoading || coursesLoading || cohortsLoading || departmentsLoading || jobsLoading;

  const quickActions = [
    { label: "Timetable", icon: <Calendar size={16} />, to: "/timetable", color: "bg-[#1a2f5c] text-white hover:bg-[#234080]" },
    { label: "Import", icon: <Upload size={16} />, to: "/import", color: "bg-blue-600 text-white hover:bg-blue-700" },
    { label: "Reschedule", icon: <RefreshCw size={16} />, to: "/rescheduling", color: "bg-violet-600 text-white hover:bg-violet-700" },
  ];

  function occurrenceLabel(entry: TimetableEntry): string {
    return `${entry.effectiveDate ?? ""} · ${DAY_LABELS[entry.day]} · ${formatTime(entry.startTime)} to ${formatTime(entry.endTime)}`;
  }

  return (
    <Layout breadcrumb={[{ label: "Dashboard" }]}>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-slate-900">Timetable Officer Dashboard</h1>
        <p className="text-sm text-slate-500">{new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {loadErrors.map((message, index) => <p key={`${index}:${message}`} className="mb-3 text-sm text-red-700" role="alert">{message}</p>)}
      {loading && <p className="mb-3 text-sm text-slate-500" role="status">Loading timetable data...</p>}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Timetable Occurrences" value={entries.length} icon={<Calendar size={18} className="text-[#1a2f5c]" />} iconBg="bg-blue-100" subtitle="This week" />
        <StatCard label="Active Venues" value={activeVenues} icon={<MapPin size={18} className="text-emerald-600" />} iconBg="bg-emerald-100" subtitle={`of ${venues.length} total`} />
        <StatCard label="Import Conflicts" value={conflictRows} icon={<AlertTriangle size={18} className="text-amber-600" />} iconBg="bg-amber-100" subtitle="Rows awaiting review" />
        <StatCard label="Pending Imports" value={pendingImports.length} icon={<Upload size={18} className="text-violet-600" />} iconBg="bg-violet-100" subtitle="Awaiting review" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Courses" value={courses.length} icon={<BookOpen size={18} className="text-sky-600" />} iconBg="bg-sky-100" />
        <StatCard label="Cohorts" value={cohorts.length} icon={<Users size={18} className="text-rose-600" />} iconBg="bg-rose-100" />
        <StatCard label="Departments" value={departments.length} icon={<MapPin size={18} className="text-teal-600" />} iconBg="bg-teal-100" />
        <StatCard label="Cancelled This Week" value={entries.filter(entry => entry.status === "CANCELLED").length} icon={<AlertTriangle size={18} className="text-red-500" />} iconBg="bg-red-100" />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {quickActions.map(action => (
          <button key={action.to} onClick={() => router.push(action.to)} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${action.color}`}>
            {action.icon}{action.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-800">Recent Timetable Changes</h2>
              <Button variant="ghost" size="sm" onClick={() => router.push("/timetable")}>View timetable</Button>
            </div>
            {recentChanges.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No schedule changes this week</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentChanges.map(entry => (
                  <div key={`${entry.id}:${entry.occurrenceDate}`} className="px-5 py-3 transition-colors hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{entry.course.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{entry.cohort.code} · {occurrenceLabel(entry)}</p>
                      </div>
                      <TimetableStatusBadge status={entry.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card padding="none">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Import Jobs</h3>
              <Button variant="ghost" size="sm" onClick={() => router.push("/import")}>View all</Button>
            </div>
            {jobs.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No import jobs</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {jobs.slice(0, 3).map(job => (
                  <div key={job.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-slate-800">{job.fileName}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{job.totalRows} rows · {timeAgo(job.createdAt)}</p>
                      </div>
                      <ImportStatusBadge status={job.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className={conflictRows ? "border-amber-200 bg-amber-50" : ""}>
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className={`mt-0.5 flex-shrink-0 ${conflictRows ? "text-amber-600" : "text-slate-400"}`} />
              <div>
                <p className={`text-sm font-semibold ${conflictRows ? "text-amber-900" : "text-slate-700"}`}>
                  {conflictRows ? `${conflictRows} import rows need review` : "No import conflicts"}
                </p>
                <p className={`mt-0.5 text-xs ${conflictRows ? "text-amber-700" : "text-slate-500"}`}>
                  {conflictRows ? "Review the staged timetable imports before publishing." : "There are no staged conflicts awaiting review."}
                </p>
                {conflictRows > 0 && (
                  <button onClick={() => router.push("/import")} className="mt-2 block text-xs font-medium text-amber-700 underline">
                    Review imports
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
