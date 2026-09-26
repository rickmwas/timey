import { useState } from 'react';
import { Search, Plus, Edit, UserX, UserCheck } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { RoleBadge } from '../../components/ui/StatusBadge';
import { Badge } from '../../components/ui/Badge';
import { USERS, DEPARTMENTS } from '../../data/mock';
import type { User, Role } from '../../types';
import { ROLE_LABEL } from '../../lib/utils';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(USERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.identifier.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  function toggleActive(userId: string) {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !u.active } : u));
  }

  const roleOptions = [
    { value: 'ALL', label: 'All Roles' },
    { value: 'STUDENT', label: 'Students' },
    { value: 'LECTURER', label: 'Lecturers' },
    { value: 'TIMETABLE_OFFICER', label: 'Timetable Officers' },
    { value: 'ADMIN', label: 'Administrators' },
  ];

  return (
    <Layout breadcrumb={[{ label: 'Admin', to: '/dashboard' }, { label: 'User Management' }]}>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-display text-2xl text-slate-900">User Management</h1>
          <p className="text-slate-500 text-sm">{users.length} total users · {users.filter(u => u.active).length} active</p>
        </div>
        <Button className="sm:ml-auto" onClick={() => { setSelectedUser(null); setShowModal(true); }}>
          <Plus size={16} /> Add User
        </Button>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {(['STUDENT', 'LECTURER', 'TIMETABLE_OFFICER', 'ADMIN'] as Role[]).map(role => (
          <button
            key={role}
            onClick={() => setRoleFilter(roleFilter === role ? 'ALL' : role)}
            className={`p-3 rounded-xl border text-left transition-colors ${roleFilter === role ? 'border-[#3b6fd4] bg-blue-50' : 'bg-white border-slate-200 hover:border-slate-300'}`}
          >
            <p className="text-lg font-bold text-slate-900">{users.filter(u => u.role === role).length}</p>
            <p className="text-xs text-slate-500 mt-0.5">{ROLE_LABEL[role]}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search by name, ID, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]"
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]">
          {roleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['User', 'Identifier', 'Role', 'Department', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1a2f5c]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#1a2f5c]">{u.name[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{u.identifier}</td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3 text-xs text-slate-600">{u.department?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.active ? 'success' : 'outline'}>{u.active ? 'Active' : 'Disabled'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setSelectedUser(u); setShowModal(true); }}
                        className="p-1.5 rounded text-slate-500 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => toggleActive(u.id)}
                        className={`p-1.5 rounded transition-colors ${u.active ? 'text-slate-500 hover:bg-red-100 hover:text-red-600' : 'text-slate-500 hover:bg-emerald-100 hover:text-emerald-600'}`}
                        title={u.active ? 'Disable' : 'Enable'}
                      >
                        {u.active ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">No users match your search</div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
          Showing {filtered.length} of {users.length} users
        </div>
      </Card>

      {/* Add/Edit User Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={selectedUser ? `Edit: ${selectedUser.name}` : 'Add User'}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button size="sm" onClick={() => setShowModal(false)}>Save User</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" defaultValue={selectedUser?.name} placeholder="e.g. Dr. John Doe" />
            <Input label="University Identifier" defaultValue={selectedUser?.identifier} placeholder="e.g. STF/089" />
          </div>
          <Input label="Email Address" type="email" defaultValue={selectedUser?.email} placeholder="user@kisii.ac.ke" />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Role"
              defaultValue={selectedUser?.role}
              onChange={() => {}}
              options={(['STUDENT', 'LECTURER', 'TIMETABLE_OFFICER', 'ADMIN'] as Role[]).map(r => ({ value: r, label: ROLE_LABEL[r] }))}
            />
            <Select
              label="Department"
              defaultValue={selectedUser?.departmentId || ''}
              onChange={() => {}}
              options={[{ value: '', label: 'No department' }, ...DEPARTMENTS.map(d => ({ value: d.id, label: d.name }))]}
            />
          </div>
          {!selectedUser && (
            <Input label="Initial Password" type="password" placeholder="Temporary password..." helperText="User will be prompted to change on first login" />
          )}
        </div>
      </Modal>
    </Layout>
  );
}
