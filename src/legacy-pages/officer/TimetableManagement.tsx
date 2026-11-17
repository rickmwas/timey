"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, RefreshCw, XCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TimetableStatusBadge } from "@/components/ui/StatusBadge";
import { useTimetableEntries } from "@/hooks/use-timetable";
import { apiRequest } from "@/lib/api-client";
import { DAY_LABELS, DAY_ORDER, formatTime } from "@/lib/utils";
import type { TimetableEntry } from "@/types";

export function TimetableManagement() {
  const { entries, isLoading, error, refresh } = useTimetableEntries();
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cohortFilter, setCohortFilter] = useState("ALL");
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const filtered = entries.filter(entry => {
    const term = search.toLowerCase();
    const matchesSearch = !term ||
      entry.course.title.toLowerCase().includes(term) ||
      entry.course.code.toLowerCase().includes(term) ||
      entry.cohort.code.toLowerCase().includes(term) ||
      entry.lecturer.name.toLowerCase().includes(term) ||
      entry.venue.code.toLowerCase().includes(term);
    return matchesSearch &&
      (dayFilter === "ALL" || entry.day === dayFilter) &&
      (statusFilter === "ALL" || entry.status === statusFilter) &&
      (cohortFilter === "ALL" || entry.cohortId === cohortFilter);
  }).sort((a, b) =>
    DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) ||
    a.startTime.localeCompare(b.startTime),
  );

  async function handleCancel() {
    if (!selectedEntry?.occurrenceDate || !selectedEntry.version || !cancelReason.trim()) return;

    setIsCancelling(true);
    setCancelError(null);
    try {
      await apiRequest(`/api/v1/timetable-entries/${selectedEntry.id}/cancel`, {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          occurrenceDate: selectedEntry.occurrenceDate,
          expectedVersion: selectedEntry.version,
          reason: cancelReason.trim(),
        }),
      });
      setSelectedEntry(null);
      setCancelReason("");
      await refresh();
    } catch (requestError) {
      setCancelError(requestError instanceof Error ? requestError.message : "Could not cancel this class");
    } finally {
      setIsCancelling(false);
    }
  }

  const cohortOptions = Array.from(
    new Map(entries.map(entry => [entry.cohortId, entry.cohort])).values(),
  );

  return (
    <Layout breadcrumb={[{ label: "Dashboard", to: "/dashboard" }, { label: "Timetable Management" }]}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl text-slate-900">Timetable Management</h1>
          <p className="text-sm text-slate-500">This week&apos;s schedule · {filtered.length} occurrences</p>
        </div>
        <Link
          href="/import"
          className="inline-flex items-center justify-center rounded-lg bg-[#1a2f5c] px-4 py-2 text-sm font-medium text-white hover:bg-[#243f78] sm:ml-auto"
        >
          Import Timetable
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-700" role="alert">{error}</p>}
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-48 flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]"
          />
        </div>
        <select value={dayFilter} onChange={event => setDayFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="ALL">All Days</option>
          {DAY_ORDER.map(day => <option key={day} value={day}>{DAY_LABELS[day]}</option>)}
        </select>
        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="ALL">All Statuses</option>
          {["ACTIVE", "RESCHEDULED", "CANCELLED", "MOVED"].map(status => <option key={status} value={status}>{status}</option>)}
        </select>
        <select value={cohortFilter} onChange={event => setCohortFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="ALL">All Cohorts</option>
          {cohortOptions.map(cohort => <option key={cohort.id} value={cohort.id}>{cohort.code}</option>)}
        </select>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Course", "Cohort", "Date", "Time", "Venue", "Lecturer", "Status", "Actions"].map(heading => (
                  <th key={heading} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(entry => (
                <tr key={`${entry.id}:${entry.occurrenceDate}`} className="group hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{entry.course.title}</p>
                    <p className="font-mono text-xs text-slate-500">{entry.course.code}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{entry.cohort.code}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">{entry.effectiveDate} · {DAY_LABELS[entry.day]}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">{formatTime(entry.startTime)} to {formatTime(entry.endTime)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{entry.venue.code}</p>
                    <p className="text-xs text-slate-400">{entry.venue.building}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{entry.lecturer.name}</td>
                  <td className="px-4 py-3"><TimetableStatusBadge status={entry.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {entry.status !== "CANCELLED" && (
                        <>
                          <Link
                            href="/rescheduling"
                            title="Reschedule"
                            aria-label={`Reschedule ${entry.course.code}`}
                            className="rounded p-1.5 text-slate-500 transition-colors hover:bg-amber-100 hover:text-amber-700"
                          >
                            <RefreshCw size={14} />
                          </Link>
                          <button
                            onClick={() => { setSelectedEntry(entry); setCancelError(null); }}
                            title="Cancel"
                            aria-label={`Cancel ${entry.course.code}`}
                            className="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-600"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-slate-500" role="status">Loading this week&apos;s schedule...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No entries match your filters</div>
          ) : null}
        </div>
      </Card>

      <Modal
        open={Boolean(selectedEntry)}
        onClose={() => { setSelectedEntry(null); setCancelReason(""); setCancelError(null); }}
        title="Cancel Class"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setSelectedEntry(null)}>Keep Class</Button>
            <Button variant="danger" size="sm" onClick={() => void handleCancel()} disabled={!cancelReason.trim() || isCancelling}>
              {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </>
        }
      >
        {selectedEntry && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-900">{selectedEntry.course.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {selectedEntry.effectiveDate} · {DAY_LABELS[selectedEntry.day]} · {formatTime(selectedEntry.startTime)} to {formatTime(selectedEntry.endTime)} · {selectedEntry.venue.code}
              </p>
            </div>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Cancellation Reason
              <textarea
                value={cancelReason}
                onChange={event => setCancelReason(event.target.value)}
                rows={3}
                className="resize-none rounded-md border border-slate-300 px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]"
              />
            </label>
            {cancelError && <p className="text-sm text-red-700" role="alert">{cancelError}</p>}
            <p className="text-xs text-slate-500">Affected students will be notified after the server saves the cancellation.</p>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
