"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, UserX, UserCheck, WifiOff } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { RoleBadge } from '../../components/ui/StatusBadge';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api-client';
import { USERS, DEPARTMENTS } from '../../data/mock';
import type { User, Role } from '../../types';
import { ROLE_LABEL } from '../../lib/utils';

export function UserManagement() {
  const { mode } = useAuth();
  const [users, setUsers] = useState<User[]>(USERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formIdentifier, setFormIdentifier] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<Role>('STUDENT');
  const [formDepartmentId, setFormDepartmentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    if (mode === 'mock') {
      setUsers(USERS);
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiClient.admin.users.list({ limit: 100 });
      if (res && Array.isArray(res.items)) {
        const mapped: User[] = res.items.map((u: any) => ({
          id: u.id,
          identifier: u.institutionalId || u.identifier || 'ID',
          name: u.fullName || u.name || 'User',
          email: u.email,
          role: u.role as Role,
          departmentId: u.departmentId,
          department: u.department,
          cohortId: u.cohortId,
          active: u.status === 'ACTIVE' || u.active === true,
          createdAt: u.createdAt || new Date().toISOString(),
        }));
        setUsers(mapped.length > 0 ? mapped : USERS);
        setIsOffline(false);
      }
    } catch {
      setIsOffline(true);
      setUsers(USERS);
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleOpenModal(user?: User) {
    if (user) {
      setSelectedUser(user);
      setFormName(user.name);
      setFormIdentifier(user.identifier);
      setFormEmail(user.email);
      setFormRole(user.role);
      setFormDepartmentId(user.departmentId || '');
    } else {
      setSelectedUser(null);
      setFormName('');
      setFormIdentifier('');
      setFormEmail('');
      setFormRole('STUDENT');
      setFormDepartmentId('');
    }
    setFormError(null);
    setShowModal(true);
  }

  async function handleSaveUser() {
    if (!formName.trim() || !formIdentifier.trim() || !formEmail.trim()) {
      setFormError('Please fill in full name, identifier, and email.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (mode !== 'mock' && !isOffline) {
        if (selectedUser) {
          await apiClient.admin.users.update(selectedUser.id, {
            fullName: formName,
            role: formRole,
            departmentId: formDepartmentId || null,
          });
        } else {
          await apiClient.admin.users.create({
            fullName: formName,
            institutionalId: formIdentifier,
            email: formEmail,
            role: formRole,
            departmentId: formDepartmentId || undefined,
          });
        }
        await fetchUsers();
      } else {
        // Mock fallback
        if (selectedUser) {
          setUsers(prev =>
            prev.map(u =>
              u.id === selectedUser.id
                ? {
                    ...u,
                    name: formName,
                    identifier: formIdentifier,
                    email: formEmail,
                    role: formRole,
                    departmentId: formDepartmentId,
                    department: DEPARTMENTS.find(d => d.id === formDepartmentId),
                  }
                : u
            )
          );
        } else {
          const newUser: User = {
            id: `usr-${Date.now()}`,
            name: formName,
            identifier: formIdentifier,
            email: formEmail,
            role: formRole,
            departmentId: formDepartmentId,
            department: DEPARTMENTS.find(d => d.id === formDepartmentId),
            active: true,
            createdAt: new Date().toISOString(),
          };
          setUsers(prev => [newUser, ...prev]);
        }
      }
      setShowModal(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save user.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActive(user: User) {
    const nextActive = !user.active;
    setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, active: nextActive } : u)));

    if (mode !== 'mock' && !isOffline) {
      try {
        if (nextActive) {
          await apiClient.admin.users.update(user.id, { status: 'ACTIVE' });
        } else {
          await apiClient.admin.users.deactivate(user.id);
        }
      } catch (e) {
        console.warn('Failed to update user status on server:', e);
      }
    }
  }

  const filtered = users.filter(u => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.identifier.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleOptions = [
    { value: 'ALL', label: 'All Roles' },
    { value: 'STUDENT', label: 'Students' },
    { value: 'LECTURER', label: 'Lecturers' },
    { value: 'TIMETABLE_OFFICER', label: 'Timetable Officers' },
    { value: 'ADMIN', label: 'Administrators' },
  ];

  return (
    <Layout breadcrumb={[{ label: 'Admin', to: '/dashboard' }, { label: 'User Management' }]}>
      {isOffline && (
        <div className="bg-amber-50 text-amber-900 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 border border-amber-200 mb-5 shadow-sm">
          <WifiOff size={15} className="text-amber-600 flex-shrink-0" />
          <span>Working in offline view. User account changes will be cached locally.</span>
        </div>
      )}

      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-display text-2xl text-slate-900">User Management</h1>
          <p className="text-slate-500 text-sm">{users.length} total users · {users.filter(u => u.active).length} active</p>
        </div>
        <Button className="sm:ml-auto" onClick={() => handleOpenModal()}>
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
                        onClick={() => handleOpenModal(u)}
                        className="p-1.5 rounded text-slate-500 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => toggleActive(u)}
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
        title={selectedUser ? `Edit: ${selectedUser.name}` : 'Add New User'}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)} disabled={isSubmitting}>Cancel</Button>
            <Button size="sm" onClick={handleSaveUser} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save User'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <p className="text-xs text-red-600">{formError}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="e.g. Dr. John Doe"
                className="w-full text-sm rounded-lg border border-slate-300 p-2"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">University Identifier</label>
              <input
                type="text"
                value={formIdentifier}
                onChange={e => setFormIdentifier(e.target.value)}
                placeholder="e.g. STF/089 or IN16/00015/24"
                disabled={!!selectedUser}
                className="w-full text-sm rounded-lg border border-slate-300 p-2"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
            <input
              type="email"
              value={formEmail}
              onChange={e => setFormEmail(e.target.value)}
              placeholder="user@kisii.ac.ke"
              disabled={!!selectedUser}
              className="w-full text-sm rounded-lg border border-slate-300 p-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Role</label>
              <select
                value={formRole}
                onChange={e => setFormRole(e.target.value as Role)}
                className="w-full text-sm rounded-lg border border-slate-300 p-2"
              >
                {(['STUDENT', 'LECTURER', 'TIMETABLE_OFFICER', 'ADMIN'] as Role[]).map(r => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Department</label>
              <select
                value={formDepartmentId}
                onChange={e => setFormDepartmentId(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 p-2"
              >
                <option value="">No Department</option>
                {DEPARTMENTS.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
