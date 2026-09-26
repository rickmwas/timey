import { useState } from 'react';
import { Building2, Plus, Search } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { DEPARTMENTS, COURSES, COHORTS, USERS } from '../../data/mock';

export function DepartmentsPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN';
  const [search, setSearch] = useState('');

  const filtered = DEPARTMENTS.filter(d =>
    !search ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout breadcrumb={[{ label: 'Departments' }]}>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-display text-2xl text-slate-900">Departments</h1>
          <p className="text-slate-500 text-sm">{DEPARTMENTS.length} departments</p>
        </div>
        {canManage && <Button className="sm:ml-auto"><Plus size={16} /> Add Department</Button>}
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="search" placeholder="Search departments..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map(d => {
          const courseCount = COURSES.filter(c => c.departmentId === d.id).length;
          const cohortCount = COHORTS.filter(c => c.departmentId === d.id).length;
          const lecturerCount = USERS.filter(u => u.departmentId === d.id && u.role === 'LECTURER').length;
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
                  { label: 'Courses', value: courseCount },
                  { label: 'Cohorts', value: cohortCount },
                  { label: 'Lecturers', value: lecturerCount },
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
    </Layout>
  );
}
