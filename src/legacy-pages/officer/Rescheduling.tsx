"use client";

import { useState } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { Input } from '../../components/ui/Input';
import { TimetableStatusBadge } from '../../components/ui/StatusBadge';
import { TIMETABLE_ENTRIES, VENUES } from '../../data/mock';
import { DAY_LABELS, DAY_ORDER, formatTime } from '../../lib/utils';
import type { Day, TimetableEntry } from '../../types';

export function Rescheduling() {
  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [newDay, setNewDay] = useState<Day>('MONDAY');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newVenueId, setNewVenueId] = useState('');
  const [reason, setReason] = useState('');
  const [conflictChecked, setConflictChecked] = useState(false);
  const [noConflicts, setNoConflicts] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedEntry = TIMETABLE_ENTRIES.find(e => e.id === selectedEntryId);
  const activeEntries = TIMETABLE_ENTRIES.filter(e => e.status === 'ACTIVE');

  function checkConflicts() {
    setConflictChecked(true);
    setNoConflicts(true);
  }

  function handleReschedule() {
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Layout breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Rescheduling' }]}>
        <Card className="max-w-md mx-auto text-center py-10">
          <CheckCircle size={40} className="mx-auto text-emerald-500 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">Class Rescheduled Successfully</h3>
          <p className="text-sm text-slate-500 mt-2">The timetable has been updated and affected users notified.</p>
          <Button className="mt-6" onClick={() => { setSubmitted(false); setSelectedEntryId(''); setConflictChecked(false); setReason(''); }}>
            Reschedule Another
          </Button>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Rescheduling' }]}>
      <div className="mb-5">
        <h1 className="font-display text-2xl text-slate-900">Reschedule Classes</h1>
        <p className="text-slate-500 text-sm">Move classes to a new time, day, or venue</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Step 1: Select class */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#1a2f5c] text-white text-xs flex items-center justify-center font-bold">1</span>
            Select Class
          </h3>
          <select
            value={selectedEntryId}
            onChange={e => { setSelectedEntryId(e.target.value); setConflictChecked(false); setSubmitted(false); }}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]"
          >
            <option value="">Select a class...</option>
            {activeEntries.map(e => (
              <option key={e.id} value={e.id}>
                {e.course.code} – {e.cohort.code} – {DAY_LABELS[e.day]} {formatTime(e.startTime)} – {e.venue.code}
              </option>
            ))}
          </select>

          {selectedEntry && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{selectedEntry.course.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {selectedEntry.lecturer.name} · {selectedEntry.cohort.code}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {DAY_LABELS[selectedEntry.day]} · {formatTime(selectedEntry.startTime)} – {formatTime(selectedEntry.endTime)} · {selectedEntry.venue.code}
                  </p>
                </div>
                <TimetableStatusBadge status={selectedEntry.status} />
              </div>
            </div>
          )}
        </Card>

        {/* Step 2: New schedule */}
        {selectedEntry && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#1a2f5c] text-white text-xs flex items-center justify-center font-bold">2</span>
              New Schedule
            </h3>
            <div className="space-y-3">
              <Select
                label="New Day"
                value={newDay}
                onChange={e => { setNewDay(e.target.value as Day); setConflictChecked(false); }}
                options={DAY_ORDER.map(d => ({ value: d, label: DAY_LABELS[d] }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input label="New Start Time" type="time" value={newStart} onChange={e => { setNewStart(e.target.value); setConflictChecked(false); }} />
                <Input label="New End Time" type="time" value={newEnd} onChange={e => { setNewEnd(e.target.value); setConflictChecked(false); }} />
              </div>
              <Select
                label="New Venue"
                value={newVenueId}
                onChange={e => { setNewVenueId(e.target.value); setConflictChecked(false); }}
                options={[{ value: '', label: 'Keep current venue' }, ...VENUES.filter(v => v.active).map(v => ({ value: v.id, label: `${v.code} – ${v.name} (Cap: ${v.capacity})` }))]}
              />
            </div>
          </Card>
        )}

        {/* Step 3: Reason */}
        {selectedEntry && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#1a2f5c] text-white text-xs flex items-center justify-center font-bold">3</span>
              Reason
            </h3>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Explain why this class is being rescheduled..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b6fd4] resize-none"
            />
          </Card>
        )}

        {/* Step 4: Check conflicts and confirm */}
        {selectedEntry && newStart && newEnd && (
          <div className="flex gap-3">
            {!conflictChecked ? (
              <Button variant="secondary" onClick={checkConflicts}>
                <AlertTriangle size={15} /> Check for Conflicts
              </Button>
            ) : (
              <>
                {noConflicts && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                    <CheckCircle size={15} /> No conflicts detected
                  </div>
                )}
                <Button onClick={handleReschedule} disabled={!reason.trim()}>
                  <RefreshCw size={15} /> Confirm Reschedule
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
