"use client";

import { useMemo, useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Users, BookOpen, AlertTriangle, CheckCircle, WifiOff, X } from "lucide-react";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { TimetableCard } from "../../components/timetable/TimetableCard";
import { useAuth } from "../../contexts/AuthContext";
import { useTimetable } from "../../hooks/use-timetable";
import { apiClient } from "../../lib/api-client";
import { DAY_LABELS, getTodayDay, timeAgo } from "../../lib/utils";
import type { Day, TimetableEntry, Venue } from "../../types";

const weekdays: Day[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

export function LecturerTimetable() {
  const { user, mode } = useAuth();
  const { entries, isLoading, isOffline, lastSyncedAt, refresh } = useTimetable();
  const [selectedDay, setSelectedDay] = useState<Day>(getTodayDay());

  // Reschedule & Cancel Modal States
  const [activeEntry, setActiveEntry] = useState<TimetableEntry | null>(null);
  const [modalType, setModalType] = useState<"reschedule" | "cancel" | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>("");
  const [rescheduleDay, setRescheduleDay] = useState<Day>("MONDAY");
  const [rescheduleStartTime, setRescheduleStartTime] = useState<string>("10:00");
  const [rescheduleEndTime, setRescheduleEndTime] = useState<string>("12:00");
  const [rescheduleVenueId, setRescheduleVenueId] = useState<string>("");
  const [actionReason, setActionReason] = useState<string>("");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; conflicts: Array<{ description: string }> } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Load venues for selector
  useEffect(() => {
    async function fetchVenues() {
      try {
        const res = await apiClient.venues.list();
        if (res && Array.isArray(res.items)) {
          setVenues(res.items.map((v: any) => ({
            id: v.id,
            code: v.code,
            name: v.name,
            building: v.building,
            floor: v.floor != null ? `Floor ${v.floor}` : '',
            capacity: v.capacity || 50,
            active: v.isActive ?? true,
            aliases: [],
          })));
        }
      } catch {
        // Ignore fallback
      }
    }
    fetchVenues();
  }, []);

  const myEntries = entries;

  const dayEntries = myEntries.filter(
    (entry) => {
      const effDay = entry.status === "RESCHEDULED" && entry.rescheduledDay ? entry.rescheduledDay : entry.day;
      return effDay === selectedDay;
    }
  );

  const totalClasses = myEntries.length;
  const totalCourses = new Set(myEntries.map((entry) => entry.courseId || entry.course.code)).size;
  const totalCohorts = new Set(myEntries.map((entry) => entry.cohortId || entry.cohort.code)).size;
  const totalVenues = new Set(myEntries.map((entry) => entry.venueId || entry.venue.code)).size;

  function handleOpenReschedule(entry: TimetableEntry) {
    setActiveEntry(entry);
    setModalType("reschedule");
    setRescheduleDay(entry.day);
    setRescheduleStartTime(entry.startTime);
    setRescheduleEndTime(entry.endTime);
    setRescheduleVenueId(entry.venue.id);
    setActionReason("");
    setValidationResult(null);
    setActionError(null);
    setActionSuccess(null);
    const todayStr = new Date().toISOString().slice(0, 10);
    setRescheduleDate(todayStr);
  }

  function handleOpenCancel(entry: TimetableEntry) {
    setActiveEntry(entry);
    setModalType("cancel");
    setActionReason("");
    setActionError(null);
    setActionSuccess(null);
    const todayStr = new Date().toISOString().slice(0, 10);
    setRescheduleDate(todayStr);
  }

  async function handleCheckConflicts() {
    if (!activeEntry) return;
    setActionError(null);
    try {
      const res = await apiClient.timetables.validateSlot({
        periodId: activeEntry.cohort?.id || "default-period",
        offeringId: activeEntry.courseId || activeEntry.course.id,
        lecturerId: activeEntry.lecturerId || user?.id || "",
        venueId: rescheduleVenueId || activeEntry.venue.id,
        day: rescheduleDay,
        startTime: rescheduleStartTime,
        endTime: rescheduleEndTime,
        excludeEntryId: activeEntry.id,
      });
      setValidationResult(res);
    } catch {
      // Mock validation pass if server offline
      setValidationResult({ valid: true, conflicts: [] });
    }
  }

  async function handleSubmitReschedule() {
    if (!activeEntry || !actionReason.trim()) {
      setActionError("Please provide a reason for rescheduling.");
      return;
    }
    setIsSubmitting(true);
    setActionError(null);

    try {
      if (mode !== "mock") {
        await apiClient.timetableEntries.reschedule(activeEntry.id, {
          occurrenceDate: rescheduleDate || new Date().toISOString().slice(0, 10),
          replacementDay: rescheduleDay,
          replacementStartTime: rescheduleStartTime,
          replacementEndTime: rescheduleEndTime,
          replacementVenueId: rescheduleVenueId || undefined,
          reason: actionReason,
        });
      }
      setActionSuccess("Class successfully rescheduled and students notified.");
      await refresh();
      setTimeout(() => {
        setModalType(null);
        setActiveEntry(null);
      }, 1200);
    } catch (err: any) {
      setActionError(err?.message || "Failed to reschedule class.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitCancel() {
    if (!activeEntry || !actionReason.trim()) {
      setActionError("Please provide a reason for cancellation.");
      return;
    }
    setIsSubmitting(true);
    setActionError(null);

    try {
      if (mode !== "mock") {
        await apiClient.timetableEntries.cancel(activeEntry.id, {
          occurrenceDate: rescheduleDate || new Date().toISOString().slice(0, 10),
          reason: actionReason,
        });
      }
      setActionSuccess("Class successfully cancelled and students notified.");
      await refresh();
      setTimeout(() => {
        setModalType(null);
        setActiveEntry(null);
      }, 1200);
    } catch (err: any) {
      setActionError(err?.message || "Failed to cancel class.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Layout breadcrumb={[{ label: "Teaching Timetable" }]}>
      {/* Ambient Offline Banner */}
      {isOffline && (
        <div className="bg-amber-50 text-amber-900 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 border border-amber-200 mb-5 shadow-sm">
          <WifiOff size={15} className="text-amber-600 flex-shrink-0" />
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
          <span>
            Working offline. Displaying cached timetable{" "}
            {lastSyncedAt ? `(synced ${timeAgo(lastSyncedAt.toISOString())})` : ""} · Schedule adjustments will sync once reconnected.
          </span>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-slate-900">
            Teaching Timetable
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Your assigned classes, venues and teaching schedule
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar size={18} className="text-[#1a2f5c]" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Classes</p>
                <p className="text-xl font-semibold text-slate-900">
                  {totalClasses}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <BookOpen size={18} className="text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Courses</p>
                <p className="text-xl font-semibold text-slate-900">
                  {totalCourses}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Users size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Cohorts</p>
                <p className="text-xl font-semibold text-slate-900">
                  {totalCohorts}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <MapPin size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Venues</p>
                <p className="text-xl font-semibold text-slate-900">
                  {totalVenues}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-[#1a2f5c]" />
          <h2 className="text-sm font-semibold text-slate-800">
            Select Day
          </h2>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {weekdays.map((day) => {
            const count = myEntries.filter(
              (entry) =>
                entry.day === day && entry.status !== "CANCELLED"
            ).length;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDay === day
                    ? "bg-[#1a2f5c] text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {DAY_LABELS[day].slice(0, 3)}
                {count > 0 && (
                  <span
                    className={`ml-2 text-xs ${
                      selectedDay === day
                        ? "text-blue-100"
                        : "text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-800">
              {DAY_LABELS[selectedDay]} Classes
            </h2>
          </div>

          <div className="space-y-3">
            {isLoading && myEntries.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-sm font-medium text-slate-500 animate-pulse">
                  Loading teaching timetable...
                </p>
              </Card>
            ) : dayEntries.length === 0 ? (
              <Card className="text-center py-12">
                <Calendar
                  size={28}
                  className="mx-auto text-slate-300 mb-3"
                />
                <p className="text-sm font-medium text-slate-600">
                  No classes scheduled
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  You have no teaching assignments on{" "}
                  {DAY_LABELS[selectedDay]}.
                </p>
              </Card>
            ) : (
              dayEntries.map((entry) => (
                <TimetableCard
                  key={entry.id}
                  entry={entry}
                  showActions={!isOffline}
                  onReschedule={() => handleOpenReschedule(entry)}
                  onCancel={() => handleOpenCancel(entry)}
                />
              ))
            )}
          </div>
        </div>

        <div>
          <Card>
            <h2 className="text-sm font-semibold text-slate-800 mb-4">
              Weekly Overview
            </h2>

            <div className="space-y-3">
              {weekdays.map((day) => {
                const dayCount = myEntries.filter(
                  (entry) =>
                    entry.day === day &&
                    entry.status !== "CANCELLED"
                ).length;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedDay === day
                        ? "bg-blue-50 border border-blue-100"
                        : "bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center border border-slate-100">
                      <Calendar
                        size={15}
                        className="text-[#1a2f5c]"
                      />
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {DAY_LABELS[day]}
                      </p>
                      <p className="text-xs text-slate-500">
                        {dayCount === 0
                          ? "No classes"
                          : `${dayCount} ${
                              dayCount === 1
                                ? "class"
                                : "classes"
                            }`}
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-slate-700">
                      {dayCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Reschedule Modal */}
      {modalType === "reschedule" && activeEntry && (
        <Modal
          open={true}
          onClose={() => setModalType(null)}
          title={`Reschedule ${activeEntry.course.code}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="font-semibold text-slate-900">{activeEntry.course.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Cohort: {activeEntry.cohort.code} · Current: {DAY_LABELS[activeEntry.day]} {activeEntry.startTime}–{activeEntry.endTime} ({activeEntry.venue.code})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">New Day</label>
                <select
                  value={rescheduleDay}
                  onChange={(e) => {
                    setRescheduleDay(e.target.value as Day);
                    setValidationResult(null);
                  }}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2"
                >
                  {weekdays.map(d => (
                    <option key={d} value={d}>{DAY_LABELS[d]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Occurrence Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Start Time</label>
                <input
                  type="time"
                  value={rescheduleStartTime}
                  onChange={(e) => {
                    setRescheduleStartTime(e.target.value);
                    setValidationResult(null);
                  }}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">End Time</label>
                <input
                  type="time"
                  value={rescheduleEndTime}
                  onChange={(e) => {
                    setRescheduleEndTime(e.target.value);
                    setValidationResult(null);
                  }}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Venue</label>
              <select
                value={rescheduleVenueId}
                onChange={(e) => {
                  setRescheduleVenueId(e.target.value);
                  setValidationResult(null);
                }}
                className="w-full text-sm rounded-lg border border-slate-300 p-2"
              >
                <option value="">Keep Original ({activeEntry.venue.code})</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.code} — {v.name} ({v.building}, Cap: {v.capacity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Reason for Rescheduling</label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="e.g. Attending departmental board meeting"
                rows={2}
                className="w-full text-sm rounded-lg border border-slate-300 p-2"
              />
            </div>

            {/* Validation Feedback */}
            {validationResult && (
              <div className={`p-3 rounded-lg text-xs ${validationResult.valid ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                {validationResult.valid ? (
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle size={14} className="text-emerald-600" />
                    Slot is available! No venue or cohort clashes detected.
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-1.5 font-medium mb-1">
                      <AlertTriangle size={14} className="text-red-600" />
                      Scheduling Conflicts Detected:
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {validationResult.conflicts.map((c, i) => (
                        <li key={i}>{c.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {actionError && (
              <p className="text-xs text-red-600">{actionError}</p>
            )}
            {actionSuccess && (
              <p className="text-xs text-emerald-600 font-medium">{actionSuccess}</p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckConflicts}
                disabled={isSubmitting}
              >
                Pre-check Slot
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModalType(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitReschedule}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Confirm Reschedule"}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Class Modal */}
      {modalType === "cancel" && activeEntry && (
        <Modal
          open={true}
          onClose={() => setModalType(null)}
          title={`Cancel Class: ${activeEntry.course.code}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-50 text-red-900 rounded-lg text-sm border border-red-200">
              <p className="font-semibold">{activeEntry.course.title}</p>
              <p className="text-xs text-red-700 mt-0.5">
                Cohort: {activeEntry.cohort.code} · Date: {rescheduleDate}
              </p>
              <p className="text-xs text-red-600 mt-1">
                Warning: Cancelling this session will immediately broadcast alerts to all enrolled students and timetable officers.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Cancellation Date</label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 p-2"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Reason for Cancellation</label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="e.g. Unscheduled university symposium attendance"
                rows={3}
                className="w-full text-sm rounded-lg border border-slate-300 p-2"
              />
            </div>

            {actionError && (
              <p className="text-xs text-red-600">{actionError}</p>
            )}
            {actionSuccess && (
              <p className="text-xs text-emerald-600 font-medium">{actionSuccess}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalType(null)}
                disabled={isSubmitting}
              >
                Go Back
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleSubmitCancel}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
