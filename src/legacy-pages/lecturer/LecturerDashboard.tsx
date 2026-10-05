"use client";

import { useState } from 'react';
import { Clock, BookOpen, MapPin, Users, Calendar } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card, StatCard } from '../../components/ui/Card';
import { TimetableCard } from '../../components/timetable/TimetableCard';
import { TimetableStatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { TIMETABLE_ENTRIES, NOTIFICATIONS, ANNOUNCEMENTS } from '../../data/mock';
import { getTodayDay, DAY_LABELS, DAY_ORDER, formatTime, timeAgo } from '../../lib/utils';
import type { Day } from '../../types';

export function LecturerDashboard() {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState<Day>(getTodayDay());
  const todayDay = getTodayDay();

  const myEntries = TIMETABLE_ENTRIES.filter(e => e.lecturerId === user?.id);
  const todayEntries = myEntries.filter(e => e.day === todayDay && e.status !== 'CANCELLED')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const uniqueCourses = new Set(myEntries.map(e => e.courseId)).size;
  const uniqueVenues = new Set(myEntries.map(e => e.venueId)).size;
  const uniqueCohorts = new Set(myEntries.map(e => e.cohortId)).size;

  const weeklyHours = myEntries.reduce((sum, e) => {
    const [sh, sm] = e.startTime.split(':').map(Number);
    const [eh, em] = e.endTime.split(':').map(Number);
    return sum + (eh * 60 + em - sh * 60 - sm) / 60;
  }, 0);

  const dayEntries = myEntries.filter(e => e.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const notifications = NOTIFICATIONS.filter(n => n.userId === user?.id);
  const weekdays: Day[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  return (
    <Layout breadcrumb={[{ label: 'Dashboard' }]}>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-slate-900">
          {new Date().getHours() < 12 ? 'Good morning' : 'Good afternoon'},{' '}
          <span className="text-[#1a2f5c]">{user?.name}</span>
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {' · '}2024/2025 Semester 1
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today's Classes" value={todayEntries.length} icon={<Clock size={18} className="text-[#1a2f5c]" />} iconBg="bg-blue-100" />
        <StatCard label="Courses Taught" value={uniqueCourses} icon={<BookOpen size={18} className="text-violet-600" />} iconBg="bg-violet-100" />
        <StatCard label="Cohorts" value={uniqueCohorts} icon={<Users size={18} className="text-emerald-600" />} iconBg="bg-emerald-100" />
        <StatCard label="Weekly Hours" value={`${weeklyHours}h`} icon={<Calendar size={18} className="text-amber-600" />} iconBg="bg-amber-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule */}
        <div className="lg:col-span-2 space-y-4">
          {/* Day selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {weekdays.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedDay === d ? 'bg-[#1a2f5c] text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                {DAY_LABELS[d].slice(0, 3)}
                {d === todayDay && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {dayEntries.length === 0 ? (
              <Card className="text-center py-10">
                <p className="text-slate-400 text-sm">No classes on {DAY_LABELS[selectedDay]}</p>
              </Card>
            ) : (
              dayEntries.map(e => <TimetableCard key={e.id} entry={e} />)
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Week overview */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Weekly Schedule</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {weekdays.map(d => (
                      <th key={d} className={`pb-2 text-center font-semibold ${d === todayDay ? 'text-[#1a2f5c]' : 'text-slate-400'}`}>
                        {d.slice(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {weekdays.map(d => {
                      const count = myEntries.filter(e => e.day === d && e.status !== 'CANCELLED').length;
                      return (
                        <td key={d} className="text-center py-2">
                          {count > 0 ? (
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${d === todayDay ? 'bg-[#1a2f5c] text-white' : 'bg-slate-100 text-slate-700'}`}>
                              {count}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Assigned venues */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <MapPin size={14} /> Assigned Venues
            </h3>
            <div className="space-y-2">
              {[...new Set(myEntries.map(e => e.venue.id))].map(vid => {
                const e = myEntries.find(x => x.venue.id === vid)!;
                return (
                  <div key={vid} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{e.venue.code}</p>
                      <p className="text-xs text-slate-500">{e.venue.building}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Notifications */}
          {notifications.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Notifications</h3>
              <div className="space-y-2">
                {notifications.slice(0, 3).map(n => (
                  <div key={n.id} className={`p-2 rounded-lg text-xs ${!n.read ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50'}`}>
                    <p className="font-medium text-slate-800">{n.title}</p>
                    <p className="text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Announcements */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Announcements</h3>
            <div className="space-y-2">
              {ANNOUNCEMENTS.slice(0, 3).map(a => (
                <div key={a.id} className="pb-2 border-b border-slate-100 last:border-0">
                  <p className="text-sm font-medium text-slate-800">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{timeAgo(a.createdAt)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
