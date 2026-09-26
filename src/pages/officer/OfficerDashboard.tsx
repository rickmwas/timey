import { Calendar, MapPin, BookOpen, Users, AlertTriangle, Upload, Plus, RefreshCw, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Card, StatCard } from '../../components/ui/Card';
import { TimetableStatusBadge, ImportStatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { TIMETABLE_ENTRIES, VENUES, COURSES, COHORTS, DEPARTMENTS, IMPORT_JOBS } from '../../data/mock';
import { formatDateTime, timeAgo, DAY_LABELS } from '../../lib/utils';

export function OfficerDashboard() {
  const navigate = useNavigate();

  const totalEntries = TIMETABLE_ENTRIES.length;
  const activeVenues = VENUES.filter(v => v.active).length;
  const conflictsCount = 1;
  const pendingImports = IMPORT_JOBS.filter(j => j.status === 'CONFLICTS_DETECTED' || j.status === 'VALIDATED').length;

  const recentChanges = TIMETABLE_ENTRIES
    .filter(e => e.status !== 'ACTIVE')
    .slice(0, 5);

  const quickActions = [
    { label: 'New Entry', icon: <Plus size={16} />, to: '/timetable', color: 'bg-[#1a2f5c] text-white hover:bg-[#234080]' },
    { label: 'Import', icon: <Upload size={16} />, to: '/import', color: 'bg-blue-600 text-white hover:bg-blue-700' },
    { label: 'Conflicts', icon: <AlertTriangle size={16} />, to: '/conflicts', color: 'bg-amber-500 text-white hover:bg-amber-600' },
    { label: 'Reschedule', icon: <RefreshCw size={16} />, to: '/rescheduling', color: 'bg-violet-600 text-white hover:bg-violet-700' },
  ];

  return (
    <Layout breadcrumb={[{ label: 'Dashboard' }]}>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-slate-900">Timetable Officer Dashboard</h1>
        <p className="text-slate-500 text-sm">2024/2025 · Semester 1 · {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Timetable Entries" value={totalEntries} icon={<Calendar size={18} className="text-[#1a2f5c]" />} iconBg="bg-blue-100" subtitle="This semester" />
        <StatCard label="Active Venues" value={activeVenues} icon={<MapPin size={18} className="text-emerald-600" />} iconBg="bg-emerald-100" subtitle={`of ${VENUES.length} total`} />
        <StatCard label="Active Conflicts" value={conflictsCount} icon={<AlertTriangle size={18} className="text-amber-600" />} iconBg="bg-amber-100" subtitle="Requires attention" />
        <StatCard label="Pending Imports" value={pendingImports} icon={<Upload size={18} className="text-violet-600" />} iconBg="bg-violet-100" subtitle="Awaiting review" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Courses" value={COURSES.length} icon={<BookOpen size={18} className="text-sky-600" />} iconBg="bg-sky-100" />
        <StatCard label="Cohorts" value={COHORTS.length} icon={<Users size={18} className="text-rose-600" />} iconBg="bg-rose-100" />
        <StatCard label="Departments" value={DEPARTMENTS.length} icon={<MapPin size={18} className="text-teal-600" />} iconBg="bg-teal-100" />
        <StatCard label="Cancelled" value={TIMETABLE_ENTRIES.filter(e => e.status === 'CANCELLED').length} icon={<AlertTriangle size={18} className="text-red-500" />} iconBg="bg-red-100" />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        {quickActions.map(a => (
          <button
            key={a.to}
            onClick={() => navigate(a.to)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${a.color}`}
          >
            {a.icon}{a.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent changes */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Recent Timetable Changes</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/timetable')}>View all</Button>
            </div>
            <div className="divide-y divide-slate-50">
              {recentChanges.map(e => (
                <div key={e.id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{e.course.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {e.cohort.code} · {DAY_LABELS[e.day]} · {e.startTime}–{e.endTime}
                      </p>
                      {(e.cancellationReason || e.reschedulingReason) && (
                        <p className="text-xs text-slate-400 mt-0.5 italic">{e.cancellationReason || e.reschedulingReason}</p>
                      )}
                    </div>
                    <TimetableStatusBadge status={e.status} />
                  </div>
                </div>
              ))}
              {recentChanges.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-slate-400">No recent changes</div>
              )}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Import jobs */}
          <Card padding="none">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Import Jobs</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/import')}>View all</Button>
            </div>
            <div className="divide-y divide-slate-50">
              {IMPORT_JOBS.slice(0, 3).map(job => (
                <div key={job.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{job.filename}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{job.totalRows} rows · {timeAgo(job.createdAt)}</p>
                    </div>
                    <ImportStatusBadge status={job.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Conflict alert */}
          <Card className="border-amber-200 bg-amber-50">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">1 Active Conflict</p>
                <p className="text-xs text-amber-700 mt-0.5">Import job has 7 conflicting rows that need review.</p>
                <button onClick={() => navigate('/conflicts')} className="text-xs text-amber-700 font-medium underline mt-2 block">
                  Review conflicts →
                </button>
              </div>
            </div>
          </Card>

          {/* Status summary */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Timetable Status</h3>
            <div className="space-y-2">
              {[
                { label: 'Active', count: TIMETABLE_ENTRIES.filter(e => e.status === 'ACTIVE').length, color: 'bg-emerald-500' },
                { label: 'Rescheduled', count: TIMETABLE_ENTRIES.filter(e => e.status === 'RESCHEDULED').length, color: 'bg-amber-500' },
                { label: 'Cancelled', count: TIMETABLE_ENTRIES.filter(e => e.status === 'CANCELLED').length, color: 'bg-red-500' },
                { label: 'Moved', count: TIMETABLE_ENTRIES.filter(e => e.status === 'MOVED').length, color: 'bg-blue-500' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.color}`} />
                  <span className="text-sm text-slate-600 flex-1">{s.label}</span>
                  <span className="text-sm font-semibold text-slate-900">{s.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
