"use client";

import { Users, Calendar, MapPin, BookOpen, GraduationCap, Building2, AlertTriangle, TrendingUp } from 'lucide-react';
import { useRouter } from "next/navigation";
import { Layout } from '../../components/layout/Layout';
import { Card, StatCard } from '../../components/ui/Card';
import { RoleBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { USERS, TIMETABLE_ENTRIES, VENUES, COURSES, COHORTS, DEPARTMENTS, ANNOUNCEMENTS } from '../../data/mock';
import { timeAgo, ROLE_LABEL } from '../../lib/utils';
import type { Role } from '../../types';

export function AdminDashboard() {
  const router = useRouter();

  const roleCounts: Record<Role, number> = {
    STUDENT: USERS.filter(u => u.role === 'STUDENT').length,
    LECTURER: USERS.filter(u => u.role === 'LECTURER').length,
    TIMETABLE_OFFICER: USERS.filter(u => u.role === 'TIMETABLE_OFFICER').length,
    ADMIN: USERS.filter(u => u.role === 'ADMIN').length,
  };

  const recentUsers = [...USERS].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  return (
    <Layout breadcrumb={[{ label: 'Admin Dashboard' }]}>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-slate-900">System Administration</h1>
        <p className="text-slate-500 text-sm">Kisii University · Timy Management Platform · 2024/2025 Semester 1</p>
      </div>

      {/* User stats */}
      <div className="mb-2">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Users</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={USERS.length} icon={<Users size={18} className="text-[#1a2f5c]" />} iconBg="bg-blue-100" />
        <StatCard label="Students" value={roleCounts.STUDENT} icon={<GraduationCap size={18} className="text-violet-600" />} iconBg="bg-violet-100" />
        <StatCard label="Lecturers" value={roleCounts.LECTURER} icon={<Users size={18} className="text-sky-600" />} iconBg="bg-sky-100" />
        <StatCard label="Officers" value={roleCounts.TIMETABLE_OFFICER} icon={<Users size={18} className="text-amber-600" />} iconBg="bg-amber-100" />
      </div>

      {/* Academic structure */}
      <div className="mb-2">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Academic Structure</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Departments" value={DEPARTMENTS.length} icon={<Building2 size={18} className="text-teal-600" />} iconBg="bg-teal-100" />
        <StatCard label="Courses" value={COURSES.length} icon={<BookOpen size={18} className="text-emerald-600" />} iconBg="bg-emerald-100" />
        <StatCard label="Cohorts" value={COHORTS.length} icon={<GraduationCap size={18} className="text-rose-600" />} iconBg="bg-rose-100" />
        <StatCard label="Venues" value={VENUES.filter(v => v.active).length} icon={<MapPin size={18} className="text-indigo-600" />} iconBg="bg-indigo-100" />
      </div>

      {/* Timetable stats */}
      <div className="mb-2">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Timetable</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Entries" value={TIMETABLE_ENTRIES.length} icon={<Calendar size={18} className="text-[#1a2f5c]" />} iconBg="bg-blue-100" />
        <StatCard label="Active" value={TIMETABLE_ENTRIES.filter(e => e.status === 'ACTIVE').length} icon={<TrendingUp size={18} className="text-emerald-600" />} iconBg="bg-emerald-100" />
        <StatCard label="Active Conflicts" value={1} icon={<AlertTriangle size={18} className="text-amber-600" />} iconBg="bg-amber-100" subtitle="Requires attention" />
        <StatCard label="Cancelled" value={TIMETABLE_ENTRIES.filter(e => e.status === 'CANCELLED').length} icon={<AlertTriangle size={18} className="text-red-500" />} iconBg="bg-red-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent users */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Recent Users</h2>
              <Button variant="ghost" size="sm" onClick={() => router.push('/admin/users')}>Manage Users</Button>
            </div>
            <div className="divide-y divide-slate-50">
              {recentUsers.map(u => (
                <div key={u.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50">
                  <div className="w-8 h-8 rounded-full bg-[#1a2f5c]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#1a2f5c]">{u.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.identifier} · {u.department?.name || 'No department'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <RoleBadge role={u.role} />
                    <span className="text-xs text-slate-400">{timeAgo(u.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick actions & system info */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Manage Users', to: '/admin/users' },
                { label: 'View Timetable', to: '/timetable' },
                { label: 'Import Data', to: '/import' },
                { label: 'Conflict Review', to: '/conflicts' },
                { label: 'Manage Venues', to: '/venues' },
                { label: 'Post Announcement', to: '/announcements' },
              ].map(a => (
                <button
                  key={a.to}
                  onClick={() => router.push(a.to)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b6fd4]" />
                  {a.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Role distribution */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">User Distribution</h3>
            <div className="space-y-2">
              {(Object.entries(roleCounts) as [Role, number][]).map(([role, count]) => (
                <div key={role} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-28">{ROLE_LABEL[role]}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-[#3b6fd4] h-2 rounded-full transition-all"
                      style={{ width: `${(count / USERS.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-4 text-right">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent announcements */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Announcements</h3>
            <div className="space-y-2">
              {ANNOUNCEMENTS.slice(0, 3).map(a => (
                <div key={a.id} className="pb-2 border-b border-slate-100 last:border-0">
                  <p className="text-xs font-medium text-slate-800">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.author.name} · {timeAgo(a.createdAt)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
