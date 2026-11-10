"use client";

import { useState } from 'react';
import { Search, BookOpen, Plus } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { COURSES, DEPARTMENTS, TIMETABLE_ENTRIES } from '../../data/mock';

export function CoursesPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'TIMETABLE_OFFICER' || user?.role === 'ADMIN';
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const filtered = COURSES.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'ALL' || c.departmentId === deptFilter;
    return matchSearch && matchDept;
  });

  function getWeeklyHours(courseId: string) {
    const entries = TIMETABLE_ENTRIES.filter(e => e.courseId === courseId && e.status === 'ACTIVE');
    return entries.reduce((sum, e) => {
      const [sh, sm] = e.startTime.split(':').map(Number);
      const [eh, em] = e.endTime.split(':').map(Number);
      return sum + (eh * 60 + em - sh * 60 - sm) / 60;
    }, 0);
  }

  return (
    <Layout breadcrumb={[{ label: 'Courses' }]}>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-display text-2xl text-slate-900">Courses</h1>
          <p className="text-slate-500 text-sm">{filtered.length} of {COURSES.length} courses</p>
        </div>
        {canManage && (
          <Button className="sm:ml-auto"><Plus size={16} /> Add Course</Button>
        )}
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="search" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]" />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]">
          <option value="ALL">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => {
          const hours = getWeeklyHours(c.id);
          const entryCount = TIMETABLE_ENTRIES.filter(e => e.courseId === c.id).length;
          return (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={18} className="text-[#3b6fd4]" />
                </div>
                <div>
                  <span className="text-xs font-mono text-slate-500">{c.code}</span>
                  <h3 className="text-sm font-semibold text-slate-900 mt-0.5 leading-snug">{c.title}</h3>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-2">{c.department.name}</p>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span>{c.credits} credits</span>
                <span>{entryCount} timetable slot{entryCount !== 1 ? 's' : ''}</span>
                {hours > 0 && <span>{hours}h/week</span>}
              </div>
            </Card>
          );
        })}
      </div>
    </Layout>
  );
}
