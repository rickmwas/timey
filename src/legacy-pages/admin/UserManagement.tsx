"use client";

import { useState } from "react";
import { Search, Plus, Edit, UserX, UserCheck } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { RoleBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { useApiCollection } from "@/hooks/use-api-collection";
import { apiRequest } from "@/lib/api-client";
import type { Role } from "@/types";
import { ROLE_LABEL } from "@/lib/utils";

type CatalogDepartment = { id: string; name: string };
type CatalogCohort = { id: string; code: string; name: string };
type ManagedUser = {
  id: string;
  fullName: string;
  institutionalId: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "INACTIVE";
  cohortId: string | null;
  departmentId: string | null;
  cohort: CatalogCohort | null;
  department: CatalogDepartment | null;
};

const roles: Role[] = ["STUDENT", "LECTURER", "TIMETABLE_OFFICER", "ADMIN"];

export function UserManagement() {
  const { items: users, isLoading, error, refresh } =
    useApiCollection<ManagedUser>("/api/v1/admin/users");
  const { items: departments } =
    useApiCollection<CatalogDepartment>("/api/v1/catalog/departments");
  const { items: cohorts } =
    useApiCollection<CatalogCohort>("/api/v1/catalog/cohorts");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("STUDENT");
  const [departmentId, setDepartmentId] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savingError, setSavingError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const filtered = users.filter(user => {
    const term = search.toLowerCase();
    const matchesSearch = !term ||
      user.fullName.toLowerCase().includes(term) ||
      user.institutionalId.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term);
    return matchesSearch && (roleFilter === "ALL" || user.role === roleFilter);
  });

  function openEditor(user: ManagedUser | null) {
    setSelectedUser(user);
    setFullName(user?.fullName ?? "");
    setIdentifier(user?.institutionalId ?? "");
    setEmail(user?.email ?? "");
    setRole(user?.role ?? "STUDENT");
    setDepartmentId(user?.departmentId ?? "");
    setCohortId(user?.cohortId ?? "");
    setSavingError(null);
    setShowModal(true);
  }

  async function saveUser() {
    setIsSaving(true);
    setSavingError(null);
    try {
      const common = {
        fullName: fullName.trim(),
        institutionalId: identifier.trim(),
        role,
        departmentId: departmentId || null,
        cohortId: role === "STUDENT" ? cohortId || null : null,
      };

      if (selectedUser) {
        await apiRequest(`/api/v1/admin/users/${selectedUser.id}`, {
          method: "PATCH",
          body: JSON.stringify(common),
        });
      } else {
        const result = await apiRequest<{ temporaryPassword: string }>("/api/v1/admin/users", {
          method: "POST",
          body: JSON.stringify({ ...common, email: email.trim().toLowerCase() }),
        });
        setTemporaryPassword(result.temporaryPassword);
      }

      setShowModal(false);
      await refresh();
    } catch (requestError) {
      setSavingError(requestError instanceof Error ? requestError.message : "Could not save this user");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(user: ManagedUser) {
    setSavingError(null);
    try {
      if (user.status === "ACTIVE") {
        await apiRequest(`/api/v1/admin/users/${user.id}/deactivate`, { method: "POST" });
      } else {
        await apiRequest(`/api/v1/admin/users/${user.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "ACTIVE" }),
        });
      }
      await refresh();
    } catch (requestError) {
      setSavingError(requestError instanceof Error ? requestError.message : "Could not update this account");
    }
  }

  const roleOptions = [
    { value: "ALL", label: "All Roles" },
    ...roles.map(item => ({ value: item, label: ROLE_LABEL[item] })),
  ];

  return (
    <Layout breadcrumb={[{ label: "Admin", to: "/dashboard" }, { label: "User Management" }]}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500">
            {users.length} total users, {users.filter(user => user.status === "ACTIVE").length} active
          </p>
        </div>
        <Button className="sm:ml-auto" onClick={() => openEditor(null)}>
          <Plus size={16} /> Add User
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-700" role="alert">{error}</p>}
      {savingError && <p className="mb-4 text-sm text-red-700" role="alert">{savingError}</p>}
      {temporaryPassword && (
        <Card className="mb-4 border border-emerald-200 bg-emerald-50">
          <p className="text-sm font-semibold text-emerald-900">User created</p>
          <p className="mt-1 text-sm text-emerald-800">
            Share this temporary password securely. The user must change it after signing in.
          </p>
          <code className="mt-2 block select-all text-sm text-emerald-950">{temporaryPassword}</code>
          <Button className="mt-3" size="sm" variant="outline" onClick={() => setTemporaryPassword(null)}>
            Dismiss
          </Button>
        </Card>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {roles.map(item => (
          <button
            key={item}
            onClick={() => setRoleFilter(roleFilter === item ? "ALL" : item)}
            className={`rounded-xl border p-3 text-left transition-colors ${roleFilter === item ? "border-[#3b6fd4] bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
          >
            <p className="text-lg font-bold text-slate-900">{users.filter(user => user.role === item).length}</p>
            <p className="mt-0.5 text-xs text-slate-500">{ROLE_LABEL[item]}</p>
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-48 flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search by name, ID, or email..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={event => setRoleFilter(event.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]"
        >
          {roleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["User", "Identifier", "Role", "Department", "Status", "Actions"].map(heading => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(user => (
                <tr key={user.id} className="group transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#1a2f5c]/10">
                        <span className="text-xs font-bold text-[#1a2f5c]">{user.fullName[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.fullName}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{user.institutionalId}</td>
                  <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                  <td className="px-4 py-3 text-xs text-slate-600">{user.department?.name || "None"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.status === "ACTIVE" ? "success" : "outline"}>
                      {user.status === "ACTIVE" ? "Active" : "Disabled"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => openEditor(user)}
                        className="rounded p-1.5 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700"
                        title="Edit"
                        aria-label={`Edit ${user.fullName}`}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => void toggleActive(user)}
                        className="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-600"
                        title={user.status === "ACTIVE" ? "Disable" : "Enable"}
                        aria-label={`${user.status === "ACTIVE" ? "Disable" : "Enable"} ${user.fullName}`}
                      >
                        {user.status === "ACTIVE" ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-slate-500" role="status">Loading users...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No users match your search</div>
          ) : null}
        </div>
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          Showing {filtered.length} of {users.length} users
        </div>
      </Card>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={selectedUser ? `Edit: ${selectedUser.fullName}` : "Add User"}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void saveUser()} disabled={isSaving || (role === "STUDENT" && !cohortId)}>
              {isSaving ? "Saving..." : "Save User"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" value={fullName} onChange={event => setFullName(event.target.value)} placeholder="e.g. Dr. John Doe" />
            <Input label="University Identifier" value={identifier} onChange={event => setIdentifier(event.target.value)} placeholder="e.g. STF/089" />
          </div>
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="user@kisii.ac.ke"
            disabled={Boolean(selectedUser)}
            helperText={selectedUser ? "Email address cannot be changed here" : undefined}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Role"
              value={role}
              onChange={event => setRole(event.target.value as Role)}
              options={roles.map(item => ({ value: item, label: ROLE_LABEL[item] }))}
            />
            <Select
              label="Department"
              value={departmentId}
              onChange={event => setDepartmentId(event.target.value)}
              options={[{ value: "", label: "No department" }, ...departments.map(item => ({ value: item.id, label: item.name }))]}
            />
          </div>
          {role === "STUDENT" && (
            <Select
              label="Cohort"
              value={cohortId}
              onChange={event => setCohortId(event.target.value)}
              options={[{ value: "", label: "Select cohort..." }, ...cohorts.map(item => ({ value: item.id, label: item.code }))]}
            />
          )}
          {savingError && <p className="text-sm text-red-700" role="alert">{savingError}</p>}
        </div>
      </Modal>
    </Layout>
  );
}
