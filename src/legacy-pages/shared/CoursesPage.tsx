"use client";

import { useState } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { useApiCollection } from '../../hooks/use-api-collection';

type CatalogDepartment = { id: string; name: string };
type CatalogCourse = {
  id: string;
  code: string;
  title: string;
  departmentId: string;
  department: CatalogDepartment;
  credits: number;
  scheduledSlots: number;
};

export function CoursesPage() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const { items: courses, isLoading, error } = useApiCollection<CatalogCourse>('/api/v1/catalog/courses');
  const { items: departments } = useApiCollection<CatalogDepartment>('/api/v1/catalog/departments');

  const filtered = courses.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'ALL' || c.departmentId === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <Layout breadcrumb={[{ label: 'Courses' }]}>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-display text-2xl text-slate-900">Courses</h1>
          <p className="text-slate-500 text-sm">{filtered.length} courses</p>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="search" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]" />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]">
          <option value="ALL">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {error && <p className="mb-4 text-sm text-red-700" role="alert">{error}</p>}
      {isLoading ? (
        <Card className="py-12 text-center"><p role="status" className="text-sm text-slate-500">Loading courses…</p></Card>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => {
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
                <span>{c.scheduledSlots} timetable slot{c.scheduledSlots !== 1 ? 's' : ''}</span>
              </div>
            </Card>
          );
        })}
      </div>
      )}
    </Layout>
  );
}
