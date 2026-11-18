"use client";

import { useState } from 'react';
import { Building2, Search } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { useApiCollection } from '../../hooks/use-api-collection';

type CatalogDepartment = {
  id: string;
  code: string;
  name: string;
  school: string;
  _count: { courses: number; cohorts: number; users: number };
};

export function DepartmentsPage() {
  const [search, setSearch] = useState('');
  const { items: departments, isLoading, error } =
    useApiCollection<CatalogDepartment>('/api/v1/catalog/departments');

  const filtered = departments.filter(d =>
    !search ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout breadcrumb={[{ label: 'Departments' }]}>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-display text-2xl text-slate-900">Departments</h1>
          <p className="text-slate-500 text-sm">{departments.length} departments</p>
        </div>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="search" placeholder="Search departments..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]" />
      </div>

      {error && <p className="mb-4 text-sm text-red-700" role="alert">{error}</p>}
      {isLoading ? (
        <Card className="py-12 text-center"><p role="status" className="text-sm text-slate-500">Loading departments…</p></Card>
      ) : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map(d => {
          return (
            <Card key={d.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <Building2 size={20} className="text-teal-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{d.code}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mt-1">{d.name}</h3>
                  <p className="text-xs text-slate-500">{d.school}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Courses', value: d._count.courses },
                  { label: 'Cohorts', value: d._count.cohorts },
                  { label: 'Lecturers', value: d._count.users },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-slate-900">{s.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
      }
    </Layout>
  );
}
