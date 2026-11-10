"use client";

import { useState } from 'react';
import { Search, GraduationCap, Plus } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { COHORTS, DEPARTMENTS, TIMETABLE_ENTRIES } from '../../data/mock';

export function CohortsPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'TIMETABLE_OFFICER' || user?.role === 'ADMIN';
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const filtered = COHORTS.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'ALL' || c.departmentId === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <Layout breadcrumb={[{ label: 'Cohorts' }]}>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-display text-2xl text-slate-900">Cohorts</h1>
          <p className="text-slate-500 text-sm">{filtered.length} cohorts</p>
        </div>
        {canManage && <Button className="sm:ml-auto"><Plus size={16} /> Add Cohort</Button>}
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="search" placeholder="Search cohorts..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]" />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]">
          <option value="ALL">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => {
          const timetableCount = TIMETABLE_ENTRIES.filter(e => e.cohortId === c.id).length;
          return (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <GraduationCap size={18} className="text-rose-600" />
                </div>
                <div>
                  <span className="text-xs font-mono text-slate-500">{c.code}</span>
                  <h3 className="text-sm font-semibold text-slate-900 mt-0.5">{c.name}</h3>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-3">{c.department.name}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-slate-500">Academic Year</p>
                  <p className="font-medium text-slate-800 mt-0.5">{c.academicYear}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-slate-500">Expected Size</p>
                  <p className="font-medium text-slate-800 mt-0.5">{c.expectedSize} students</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-slate-500">Semester</p>
                  <p className="font-medium text-slate-800 mt-0.5">{c.semester}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-slate-500">Classes</p>
                  <p className="font-medium text-slate-800 mt-0.5">{timetableCount}/week</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Layout>
  );
}
