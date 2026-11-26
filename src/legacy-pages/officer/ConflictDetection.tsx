"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, AlertCircle, Info, RefreshCw, CheckCircle2, MapPin, User, Calendar, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTimetableEntries } from "@/hooks/use-timetable";
import { detectSlotConflicts, type SlotLike } from "@/server/services/conflicts";
import { DAY_LABELS, formatTime } from "@/lib/utils";
import type { ConflictSeverity, ConflictType, Day } from "@/types";

interface DisplayConflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  description: string;
  affectedEntries: string[];
  suggestion?: string;
  day?: string;
  timeRange?: string;
  sourceTitle?: string;
  targetTitle?: string;
}

const SEVERITY_CONFIG = {
  BLOCKING: {
    icon: <AlertTriangle size={16} />,
    label: "Blocking",
    style: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-800",
    iconColor: "text-red-600",
  },
  WARNING: {
    icon: <AlertCircle size={16} />,
    label: "Warning",
    style: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-800",
    iconColor: "text-amber-600",
  },
  INFO: {
    icon: <Info size={16} />,
    label: "Advisory",
    style: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    iconColor: "text-blue-600",
  },
};

const CONFLICT_TYPE_LABELS: Record<ConflictType, string> = {
  VENUE_CONFLICT: "Room Double-Booking",
  LECTURER_CONFLICT: "Faculty Schedule Clash",
  COHORT_CONFLICT: "Cohort Overlap",
  CAPACITY_CONFLICT: "Venue Capacity Exceeded",
  INVALID_TIME: "Invalid Timeslot",
  INVALID_ASSIGNMENT: "Unassigned Lecturer",
};

export function ConflictDetection() {
  const router = useRouter();
  const { entries, isLoading, refresh } = useTimetableEntries();
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "BLOCKING" | "WARNING">("ALL");

  // Run real deterministic conflict engine on active timetable entries
  const liveConflicts = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    const slotLikes: SlotLike[] = entries.map((e) => ({
      id: e.id,
      day: e.day,
      startTime: e.startTime,
      endTime: e.endTime,
      venueId: e.venueId,
      lecturerId: e.lecturerId,
      offeringId: e.id,
      cohortId: e.cohortId,
      venueCapacity: e.venue.capacity,
      cohortExpectedSize: e.cohort.expectedSize,
    }));

    const detected = detectSlotConflicts(slotLikes);

    return detected.map((c, index): DisplayConflict => {
      const sourceEntry = entries.find((e) => e.id === c.sourceId);
      const targetEntry = entries.find((e) => e.id === c.targetId);

      let severity: ConflictSeverity = "BLOCKING";
      let description = "";
      let suggestion = "";

      if (c.type === "VENUE_CONFLICT") {
        severity = "BLOCKING";
        description = `${sourceEntry?.venue.code ?? "Room"} is double-booked on ${DAY_LABELS[c.day as Day] ?? c.day} (${formatTime(c.startTime)}–${formatTime(c.endTime)}). Units ${sourceEntry?.course.code ?? "A"} and ${targetEntry?.course.code ?? "B"} overlap.`;
        suggestion = `Reschedule one of the classes to a different room or another time slot.`;
      } else if (c.type === "LECTURER_CONFLICT") {
        severity = "BLOCKING";
        description = `Lecturer ${sourceEntry?.lecturer.name ?? "Staff"} is scheduled for multiple concurrent classes on ${DAY_LABELS[c.day as Day] ?? c.day} (${formatTime(c.startTime)}–${formatTime(c.endTime)}).`;
        suggestion = `Assign an alternate lecturer or shift one lecture time.`;
      } else if (c.type === "COHORT_CONFLICT") {
        severity = "BLOCKING";
        description = `Cohort ${sourceEntry?.cohort.code ?? "Class"} is scheduled for two lectures at the same time on ${DAY_LABELS[c.day as Day] ?? c.day} (${formatTime(c.startTime)}–${formatTime(c.endTime)}).`;
        suggestion = `Move one course unit to an open slot in the cohort's weekly timetable.`;
      } else if (c.type === "CAPACITY_CONFLICT") {
        severity = "WARNING";
        description = `${sourceEntry?.venue.code} (capacity ${sourceEntry?.venue.capacity}) cannot accommodate ${sourceEntry?.cohort.code} (expected ${sourceEntry?.cohort.expectedSize} students).`;
        suggestion = `Move to a larger lecture hall or split the cohort into lab/lecture streams.`;
      } else {
        severity = "INFO";
        description = c.details || "Schedule advisory detected.";
      }

      return {
        id: `conf-${index}-${c.sourceId}`,
        type: c.type as ConflictType,
        severity,
        description,
        affectedEntries: [c.sourceId, c.targetId].filter(Boolean),
        suggestion,
        day: c.day,
        timeRange: `${formatTime(c.startTime)}–${formatTime(c.endTime)}`,
        sourceTitle: sourceEntry?.course.code,
        targetTitle: targetEntry?.course.code,
      };
    });
  }, [entries]);

  const filteredConflicts = liveConflicts.filter((c) => {
    if (selectedFilter === "ALL") return true;
    return c.severity === selectedFilter;
  });

  const blockingCount = liveConflicts.filter((c) => c.severity === "BLOCKING").length;
  const warningCount = liveConflicts.filter((c) => c.severity === "WARNING").length;

  return (
    <Layout breadcrumb={[{ label: "Dashboard", to: "/dashboard" }, { label: "Conflict Intelligence" }]}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl text-slate-900 tracking-tight">Schedule Conflict Intelligence</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time multi-dimensional validation across rooms, faculty, cohorts, and room capacity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refresh()} className="text-xs">
            <RefreshCw size={14} className="mr-1.5" /> Re-scan Schedule
          </Button>
          <Button size="sm" onClick={() => router.push("/rescheduling")} className="bg-navy-900 hover:bg-navy-800 text-white text-xs">
            Rescheduling Console
          </Button>
        </div>
      </div>

      {/* Conflict Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card
          className={`p-4 text-center cursor-pointer transition-all ${
            selectedFilter === "BLOCKING" ? "ring-2 ring-red-500 bg-red-50/80" : "bg-red-50/40 border-red-200"
          }`}
          onClick={() => setSelectedFilter("BLOCKING")}
        >
          <p className="text-3xl font-bold text-red-700">{blockingCount}</p>
          <p className="text-xs text-red-600 font-semibold uppercase tracking-wider mt-1">Blocking Clashes</p>
          <p className="text-xs text-red-500 mt-0.5">Must be resolved prior to timetable signoff</p>
        </Card>

        <Card
          className={`p-4 text-center cursor-pointer transition-all ${
            selectedFilter === "WARNING" ? "ring-2 ring-amber-500 bg-amber-50/80" : "bg-amber-50/40 border-amber-200"
          }`}
          onClick={() => setSelectedFilter("WARNING")}
        >
          <p className="text-3xl font-bold text-amber-700">{warningCount}</p>
          <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider mt-1">Capacity Warnings</p>
          <p className="text-xs text-amber-500 mt-0.5">Room capacity or resource constraints</p>
        </Card>

        <Card
          className={`p-4 text-center cursor-pointer transition-all ${
            selectedFilter === "ALL" ? "ring-2 ring-navy-900 bg-slate-50" : "bg-white border-slate-200"
          }`}
          onClick={() => setSelectedFilter("ALL")}
        >
          <p className="text-3xl font-bold text-slate-800">{liveConflicts.length}</p>
          <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mt-1">Total Issues Detected</p>
          <p className="text-xs text-slate-400 mt-0.5">Click to view all detected discrepancies</p>
        </Card>
      </div>

      {/* Conflict List */}
      {isLoading ? (
        <Card className="p-12 text-center text-slate-400">
          <RefreshCw size={28} className="animate-spin mx-auto mb-2 text-navy-500" />
          <p className="text-sm">Running schedule conflict detection algorithms...</p>
        </Card>
      ) : filteredConflicts.length === 0 ? (
        <Card className="p-12 text-center border-emerald-200 bg-emerald-50/30">
          <CheckCircle2 size={44} className="mx-auto mb-3 text-emerald-600" />
          <h3 className="font-semibold text-slate-900 text-lg">Zero Scheduling Conflicts Detected</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            All active weekly classes across rooms, lecturers, and student cohorts have no double-bookings or overlaps.
          </p>
          <div className="mt-4">
            <Button size="sm" variant="outline" onClick={() => router.push("/timetable")} className="text-xs">
              View Verified Master Timetable
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredConflicts.map((conflict) => {
            const config = SEVERITY_CONFIG[conflict.severity];
            return (
              <div
                key={conflict.id}
                className={`p-4 rounded-xl border transition-all ${config.style}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${config.iconColor}`}>{config.icon}</div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.badge}`}>
                          {config.label}
                        </span>
                        <span className="text-xs font-semibold text-slate-800">
                          {CONFLICT_TYPE_LABELS[conflict.type] ?? conflict.type}
                        </span>
                        {conflict.day && conflict.timeRange && (
                          <span className="text-xs text-slate-500 font-mono">
                            {DAY_LABELS[conflict.day as Day] ?? conflict.day} · {conflict.timeRange}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-800 mt-1.5 font-medium">{conflict.description}</p>

                      {conflict.suggestion && (
                        <p className="text-xs text-slate-600 mt-1 bg-white/70 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
                          <span className="font-semibold text-slate-700">Recommendation:</span> {conflict.suggestion}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => router.push("/rescheduling")}
                      className="text-xs"
                    >
                      Resolve Clash
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
