"use client";

import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { TimetableCard } from '../../components/timetable/TimetableCard';
import { TimetableStatusBadge } from '../../components/ui/StatusBadge';
import { TIMETABLE_ENTRIES, COHORTS } from '../../data/mock';
import { useAuth } from '../../contexts/AuthContext';
import { DAY_ORDER, DAY_LABELS, formatTime } from '../../lib/utils';
import type { Day } from '../../types';

type ViewMode = 'week' | 'list' | 'day';

export function StudentTimetable() {
  const { user } = useAuth();
  const [view, setView] = useState<ViewMode>('week');
  const [selectedDay, setSelectedDay] = useState<Day>('MONDAY');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const cohort = COHORTS.find(c => c.id === user?.cohortId) ?? COHORTS[0];
  const entries = TIMETABLE_ENTRIES.filter(e => e.cohortId === cohort.id);

  const filtered = entries.filter(e => {
    const matchSearch = !search ||
      e.course.title.toLowerCase().includes(search.toLowerCase()) ||
      e.course.code.toLowerCase().includes(search.toLowerCase()) ||
      e.lecturer.name.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const weekdays: Day[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  return (
    <Layout breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Timetable' }]}>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-display text-2xl text-slate-900">My Timetable</h1>
          <p className="text-sm text-slate-500">{cohort.name} · 2024/2025 Semester 1</p>
        </div>

        <div className="sm:ml-auto flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5 text-sm">
            {(['week', 'day', 'list'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md capitalize transition-colors ${view === v ? 'bg-white shadow-sm text-slate-900 font-medium' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search courses, lecturers, venues..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="RESCHEDULED">Rescheduled</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="MOVED">Moved</option>
        </select>
      </div>

      {/* Week view */}
      {view === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {weekdays.map(day => {
            const dayEntries = filtered.filter(e => {
              const effectiveDay = e.status === 'RESCHEDULED' && e.rescheduledDay ? e.rescheduledDay : e.day;
              return effectiveDay === day;
            }).sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div key={day}>
                <div className="text-center mb-3">
                  <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{DAY_LABELS[day].slice(0, 3)}</h3>
                  <p className="text-xs text-slate-400">{dayEntries.length} class{dayEntries.length !== 1 ? 'es' : ''}</p>
                </div>
                <div className="space-y-3">
                  {dayEntries.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-200 rounded-xl p-6 text-center">
                      <p className="text-xs text-slate-400">Free</p>
                    </div>
                  ) : (
                    dayEntries.map(e => (
                      <TimetableCard key={e.id} entry={e} compact />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Day view */}
      {view === 'day' && (
        <div>
          <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
            {weekdays.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDay === d ? 'bg-[#1a2f5c] text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                {DAY_LABELS[d]}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {filtered
              .filter(e => {
                const effectiveDay = e.status === 'RESCHEDULED' && e.rescheduledDay ? e.rescheduledDay : e.day;
                return effectiveDay === selectedDay;
              })
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map(e => <TimetableCard key={e.id} entry={e} />)
            }
            {filtered.filter(e => e.day === selectedDay).length === 0 && (
              <Card className="text-center py-12">
                <p className="text-slate-400">No classes on {DAY_LABELS[selectedDay]}</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Course', 'Day', 'Time', 'Venue', 'Lecturer', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.startTime.localeCompare(b.startTime)).map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">{e.course.title}</p>
                        <p className="text-xs text-slate-500 font-mono">{e.course.code}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{DAY_LABELS[e.day]}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatTime(e.startTime)} – {formatTime(e.endTime)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900 font-medium">{e.venue.code}</p>
                      <p className="text-xs text-slate-500">{e.venue.building}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{e.lecturer.name}</td>
                    <td className="px-4 py-3"><TimetableStatusBadge status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-sm">No entries match your filters</div>
            )}
          </div>
        </Card>
      )}
    </Layout>
  );
}
