"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Input } from "@/components/ui/Input";
import { TimetableStatusBadge } from "@/components/ui/StatusBadge";
import { useApiCollection } from "@/hooks/use-api-collection";
import { useTimetableEntries } from "@/hooks/use-timetable";
import { apiRequest } from "@/lib/api-client";
import { DAY_LABELS, formatTime } from "@/lib/utils";
import type { TimetableEntry } from "@/types";

type CatalogVenue = {
  id: string;
  code: string;
  name: string;
  capacity: number;
  isActive: boolean;
  isUnderMaintenance: boolean;
};

function occurrenceKey(entry: TimetableEntry): string {
  return `${entry.id}:${entry.occurrenceDate ?? ""}`;
}

export function Rescheduling() {
  const { entries, isLoading, error: timetableError, refresh } = useTimetableEntries();
  const { items: venues, error: venueError } =
    useApiCollection<CatalogVenue>("/api/v1/venues");
  const [selectedKey, setSelectedKey] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newVenueId, setNewVenueId] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const selectableEntries = entries.filter(entry => entry.status !== "CANCELLED");
  const selectedEntry = selectableEntries.find(entry => occurrenceKey(entry) === selectedKey);

  function chooseEntry(key: string) {
    const entry = selectableEntries.find(item => occurrenceKey(item) === key);
    setSelectedKey(key);
    setNewDate(entry?.effectiveDate ?? "");
    setNewStart(entry?.startTime ?? "");
    setNewEnd(entry?.endTime ?? "");
    setNewVenueId(entry?.venueId ?? "");
    setReason("");
    setRequestError(null);
    setSubmitted(false);
  }

  async function handleReschedule() {
    if (!selectedEntry?.occurrenceDate || !selectedEntry.version || !newDate || !newStart || !newEnd || !newVenueId || !reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    setRequestError(null);
    try {
      await apiRequest(`/api/v1/timetable-entries/${selectedEntry.id}/reschedule`, {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          occurrenceDate: selectedEntry.occurrenceDate,
          expectedVersion: selectedEntry.version,
          replacementDate: newDate,
          startTime: newStart,
          endTime: newEnd,
          venueId: newVenueId,
          reason: reason.trim(),
        }),
      });
      setSubmitted(true);
      await refresh();
    } catch (requestError) {
      setRequestError(requestError instanceof Error ? requestError.message : "Could not reschedule this class");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Layout breadcrumb={[{ label: "Dashboard", to: "/dashboard" }, { label: "Rescheduling" }]}>
        <Card className="mx-auto max-w-md py-10 text-center">
          <CheckCircle size={40} className="mx-auto mb-4 text-emerald-500" />
          <h3 className="text-lg font-semibold text-slate-900">Class Rescheduled Successfully</h3>
          <p className="mt-2 text-sm text-slate-500">The server saved the change and notified affected users.</p>
          <Button className="mt-6" onClick={() => chooseEntry("")}>Reschedule Another</Button>
        </Card>
      </Layout>
    );
  }

  const entryOptions = [
    { value: "", label: "Select a class..." },
    ...selectableEntries.map(entry => ({
      value: occurrenceKey(entry),
      label: `${entry.course.code} · ${entry.cohort.code} · ${entry.occurrenceDate ?? ""} · ${formatTime(entry.startTime)} · ${entry.venue.code}`,
    })),
  ];

  return (
    <Layout breadcrumb={[{ label: "Dashboard", to: "/dashboard" }, { label: "Rescheduling" }]}>
      <div className="mb-5">
        <h1 className="font-display text-2xl text-slate-900">Reschedule Classes</h1>
        <p className="text-sm text-slate-500">Change one scheduled occurrence. Conflicts are checked by the server before saving.</p>
      </div>

      {timetableError && <p className="mb-4 text-sm text-red-700" role="alert">{timetableError}</p>}
      {venueError && <p className="mb-4 text-sm text-red-700" role="alert">{venueError}</p>}
      {requestError && <p className="mb-4 text-sm text-red-700" role="alert">{requestError}</p>}
      {isLoading ? (
        <Card className="max-w-2xl py-10 text-center"><p role="status" className="text-sm text-slate-500">Loading this week&apos;s classes...</p></Card>
      ) : (
        <div className="max-w-2xl space-y-4">
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Select Class</h3>
            <Select
              label="Scheduled occurrence"
              value={selectedKey}
              onChange={event => chooseEntry(event.target.value)}
              options={entryOptions}
            />
            {selectedEntry && (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{selectedEntry.course.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {selectedEntry.lecturer.name} · {selectedEntry.cohort.code}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {selectedEntry.occurrenceDate} · {DAY_LABELS[selectedEntry.day]} · {formatTime(selectedEntry.startTime)} to {formatTime(selectedEntry.endTime)} · {selectedEntry.venue.code}
                    </p>
                  </div>
                  <TimetableStatusBadge status={selectedEntry.status} />
                </div>
              </div>
            )}
          </Card>

          {selectedEntry && (
            <>
              <Card>
                <h3 className="mb-3 text-sm font-semibold text-slate-800">New Schedule</h3>
                <div className="space-y-3">
                  <Input label="New Date" type="date" value={newDate} onChange={event => setNewDate(event.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="New Start Time" type="time" value={newStart} onChange={event => setNewStart(event.target.value)} />
                    <Input label="New End Time" type="time" value={newEnd} onChange={event => setNewEnd(event.target.value)} />
                  </div>
                  <Select
                    label="New Venue"
                    value={newVenueId}
                    onChange={event => setNewVenueId(event.target.value)}
                    options={venues.filter(venue => venue.isActive && !venue.isUnderMaintenance).map(venue => ({
                      value: venue.id,
                      label: `${venue.code} · ${venue.name} (capacity ${venue.capacity})`,
                    }))}
                  />
                </div>
              </Card>

              <Card>
                <h3 className="mb-3 text-sm font-semibold text-slate-800">Reason</h3>
                <textarea
                  value={reason}
                  onChange={event => setReason(event.target.value)}
                  rows={3}
                  placeholder="Explain why this class is being rescheduled..."
                  className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]"
                />
              </Card>

              <Button
                onClick={() => void handleReschedule()}
                disabled={isSubmitting || !reason.trim() || !newDate || !newStart || !newEnd || !newVenueId}
              >
                <RefreshCw size={15} /> {isSubmitting ? "Saving..." : "Confirm Reschedule"}
              </Button>
            </>
          )}
        </div>
      )}
    </Layout>
  );
}
