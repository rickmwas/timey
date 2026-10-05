import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import type { ConflictSeverity, ConflictType } from '../../types';

interface ConflictItem {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  description: string;
  affectedEntries: string[];
  suggestion?: string;
}

const CONFLICTS: ConflictItem[] = [
  {
    id: 'cf1',
    type: 'VENUE_CONFLICT',
    severity: 'BLOCKING',
    description: 'LH 1 (Lecture Hall 1) is double-booked on Monday 08:00–10:00. CS 101 (CS-2024-Y1-A) and CS 201 (import row 3) overlap.',
    affectedEntries: ['te1', 'import-row-3'],
    suggestion: 'Move CS 201 to LH 2 or schedule it at 10:00–12:00.',
  },
  {
    id: 'cf2',
    type: 'LECTURER_CONFLICT',
    severity: 'BLOCKING',
    description: 'Dr. James Omondi (STF/089) has overlapping teaching assignments on Tuesday 10:00–12:00.',
    affectedEntries: ['te4', 'import-row-4'],
    suggestion: 'Assign a different lecturer or change the time slot for one of the entries.',
  },
  {
    id: 'cf3',
    type: 'CAPACITY_CONFLICT',
    severity: 'WARNING',
    description: 'Seminar Room 1 (capacity: 25) is assigned to BBA-2023-Y2 (expected size: 55) for BBA 102 on Wednesday.',
    affectedEntries: ['te13'],
    suggestion: 'Move to BBA Hall (capacity: 70) or split the cohort.',
  },
];

const SEVERITY_CONFIG = {
  BLOCKING: { icon: <AlertTriangle size={16} />, label: 'Blocking', style: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-800', iconColor: 'text-red-600' },
  WARNING: { icon: <AlertCircle size={16} />, label: 'Warning', style: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-800', iconColor: 'text-amber-600' },
  INFO: { icon: <Info size={16} />, label: 'Info', style: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-800', iconColor: 'text-blue-600' },
};

const CONFLICT_TYPE_LABELS: Record<ConflictType, string> = {
  VENUE_CONFLICT: 'Venue Conflict',
  LECTURER_CONFLICT: 'Lecturer Conflict',
  COHORT_CONFLICT: 'Cohort Conflict',
  CAPACITY_CONFLICT: 'Capacity Conflict',
  INVALID_TIME: 'Invalid Time',
  INVALID_ASSIGNMENT: 'Invalid Assignment',
};

export function ConflictDetection() {
  const blockingCount = CONFLICTS.filter(c => c.severity === 'BLOCKING').length;
  const warningCount = CONFLICTS.filter(c => c.severity === 'WARNING').length;

  return (
    <Layout breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Conflict Detection' }]}>
      <div className="mb-5">
        <h1 className="font-display text-2xl text-slate-900">Conflict Detection</h1>
        <p className="text-slate-500 text-sm">Review and resolve timetable conflicts</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="text-center border-red-200 bg-red-50">
          <p className="text-3xl font-bold text-red-700">{blockingCount}</p>
          <p className="text-xs text-red-600 font-medium mt-1 uppercase tracking-wider">Blocking</p>
          <p className="text-xs text-red-500 mt-0.5">Must resolve before committing</p>
        </Card>
        <Card className="text-center border-amber-200 bg-amber-50">
          <p className="text-3xl font-bold text-amber-700">{warningCount}</p>
          <p className="text-xs text-amber-600 font-medium mt-1 uppercase tracking-wider">Warnings</p>
          <p className="text-xs text-amber-500 mt-0.5">Review recommended</p>
        </Card>
        <Card className="text-center border-emerald-200 bg-emerald-50">
          <p className="text-3xl font-bold text-emerald-700">0</p>
          <p className="text-xs text-emerald-600 font-medium mt-1 uppercase tracking-wider">Info</p>
          <p className="text-xs text-emerald-500 mt-0.5">Informational only</p>
        </Card>
      </div>

      {/* Conflict list */}
      <div className="space-y-4">
        {CONFLICTS.map(c => {
          const config = SEVERITY_CONFIG[c.severity];
          return (
            <Card key={c.id} className={`border ${config.style}`}>
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${config.badge}`}>
                      {config.label}
                    </span>
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {CONFLICT_TYPE_LABELS[c.type]}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800">{c.description}</p>
                  {c.suggestion && (
                    <p className="text-xs text-[#3b6fd4] mt-1.5">
                      💡 Suggestion: {c.suggestion}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    Affected entries: {c.affectedEntries.join(', ')}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {CONFLICTS.length === 0 && (
        <Card className="text-center py-12 border-emerald-200 bg-emerald-50">
          <div className="text-emerald-500 text-4xl mb-3">✓</div>
          <h3 className="text-base font-semibold text-emerald-800">No conflicts detected</h3>
          <p className="text-sm text-emerald-600 mt-1">The current timetable has no scheduling conflicts.</p>
        </Card>
      )}

      {/* Detection rules */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Detection Rules Active</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Venue Double-booking', description: 'Two classes sharing the same venue at overlapping times' },
            { label: 'Lecturer Overlap', description: 'A lecturer assigned to two classes at the same time' },
            { label: 'Cohort Overlap', description: 'A cohort scheduled for two classes simultaneously' },
            { label: 'Capacity Check', description: 'Venue capacity less than cohort expected size' },
            { label: 'Time Validation', description: 'End time must be after start time' },
            { label: 'Assignment Validation', description: 'All required fields must reference existing records' },
          ].map(r => (
            <div key={r.label} className="flex items-start gap-2 p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
              <div>
                <p className="text-xs font-semibold text-slate-800">{r.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
