"use client";

import { useState } from "react";
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  KeyRound,
  RefreshCw,
  Server,
  ShieldAlert,
  Sliders,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useApiCollection } from "@/hooks/use-api-collection";
import { timeAgo } from "@/lib/utils";

type AuditLogItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor?: {
    fullName: string;
    email: string;
  };
};

type AcademicPeriod = {
  id: string;
  name: string;
  year: string;
  semester: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

export function AdminSystemSettings() {
  const [activeTab, setActiveTab] = useState<"system" | "periods" | "audit">("system");

  const { items: auditLogs, isLoading: logsLoading, refresh: refreshLogs } =
    useApiCollection<AuditLogItem>("/api/v1/admin/audit-logs");
  const { items: periods, isLoading: periodsLoading, refresh: refreshPeriods } =
    useApiCollection<AcademicPeriod>("/api/v1/catalog/academic-period");

  return (
    <Layout breadcrumb={[{ label: "Dashboard", to: "/dashboard" }, { label: "System Administration" }]}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl text-slate-900 tracking-tight">Institutional System Administration</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Operational infrastructure, academic period control, and platform audit compliance.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("system")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "system"
              ? "border-navy-900 text-navy-900 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Server size={16} /> Platform Diagnostics & Health
        </button>
        <button
          onClick={() => setActiveTab("periods")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "periods"
              ? "border-navy-900 text-navy-900 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Calendar size={16} /> Academic Periods & Semesters
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "audit"
              ? "border-navy-900 text-navy-900 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText size={16} /> Security & Action Audit Logs
        </button>
      </div>

      {/* Tab 1: System Health */}
      {activeTab === "system" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 border-emerald-200 bg-emerald-50/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">PostgreSQL Relational DB</h3>
                  <p className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                    <CheckCircle2 size={12} /> Connected & Validated
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3 border-t border-emerald-200/60 pt-2">
                Schema: Prisma ORM v5 with serializable schedule transaction isolation.
              </p>
            </Card>

            <Card className="p-5 border-blue-200 bg-blue-50/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Web Push & VAPID Engine</h3>
                  <p className="text-xs text-blue-700 font-medium flex items-center gap-1 mt-0.5">
                    <CheckCircle2 size={12} /> Encrypted Outbox Pipeline
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3 border-t border-blue-200/60 pt-2">
                Standards-compliant RFC 8291 payload encryption enabled.
              </p>
            </Card>

            <Card className="p-5 border-violet-200 bg-violet-50/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Class Countdown Cron</h3>
                  <p className="text-xs text-violet-700 font-medium flex items-center gap-1 mt-0.5">
                    <CheckCircle2 size={12} /> Active (5-min intervals)
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3 border-t border-violet-200/60 pt-2">
                East Africa Time (EAT) synchronized with override suppression.
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Sliders size={18} className="text-navy-900" /> Platform Security Architecture
            </h2>
            <div className="divide-y divide-slate-100 text-sm">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800">Refresh Token Family Rotation</span>
                  <p className="text-xs text-slate-500">Cryptographic reuse detection invalidates breached sessions</p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Enforced
                </span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800">SSE Stream Channel Security</span>
                  <p className="text-xs text-slate-500">Independent cookie authorization and tenant cohort scoping</p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Enforced
                </span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800">Transactional Outbox Pattern</span>
                  <p className="text-xs text-slate-500">Side effects decoupled from serializable DB mutation transactions</p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Enforced
                </span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800">Multi-Sheet & Scanned PDF Validation</span>
                  <p className="text-xs text-slate-500">Rejects unselectable vector scans; requires OCR or structured CSV</p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Enforced
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Academic Periods */}
      {activeTab === "periods" && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Configured Academic Periods</h2>
              <p className="text-xs text-slate-500">University semester calendar boundaries</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => refreshPeriods()} className="text-xs">
              <RefreshCw size={14} className="mr-1.5" /> Refresh
            </Button>
          </div>

          {periodsLoading ? (
            <p className="text-sm text-slate-400 py-6 text-center">Loading periods...</p>
          ) : periods.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <Calendar size={32} className="mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">Active Academic Period: 2026/2027 Semester 1</p>
              <p className="text-xs text-slate-500 mt-1">
                Currently running in master schedule configuration.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {periods.map((period) => (
                <div key={period.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-sm">{period.name}</span>
                      {period.isActive && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Current Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Academic Year: {period.year} · Semester {period.semester}
                    </p>
                  </div>
                  <span className="text-xs text-slate-600 font-mono">
                    {new Date(period.startDate).toLocaleDateString()} – {new Date(period.endDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === "audit" && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Institutional Audit Trail</h2>
              <p className="text-xs text-slate-500">Immutable ledger of administrative actions and timetable mutations</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => refreshLogs()} className="text-xs">
              <RefreshCw size={14} className="mr-1.5" /> Refresh Trail
            </Button>
          </div>

          {logsLoading ? (
            <p className="text-sm text-slate-400 py-8 text-center">Loading audit log stream...</p>
          ) : auditLogs.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <FileText size={32} className="mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">Audit logging active</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Every reschedule, venue swap, cancellation, and user provisioning event is recorded.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-navy-50 text-navy-900 border border-navy-200">
                        {log.action}
                      </span>
                      <span className="text-xs text-slate-600">{log.entityType} ({log.entityId.slice(0, 8)}...)</span>
                    </div>
                    {log.actor && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Actor: {log.actor.fullName} ({log.actor.email})
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {timeAgo(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </Layout>
  );
}
