"use client";

import { useState } from 'react';
import { Search, Plus, Filter, Edit, Trash2, RefreshCw, MapPin, XCircle } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { TimetableStatusBadge } from '../../components/ui/StatusBadge';
import { TIMETABLE_ENTRIES, COURSES, VENUES, COHORTS } from '../../data/mock';
import { DAY_LABELS, formatTime, DAY_ORDER } from '../../lib/utils';
import type { TimetableEntry, Day } from '../../types';

export function TimetableManagement() {
  const [entries, setEntries] = useState<TimetableEntry[]>(TIMETABLE_ENTRIES);
  const [search, setSearch] = useState('');
  const [dayFilter, setDayFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cohortFilter, setCohortFilter] = useState('ALL');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showMoveVenueModal, setShowMoveVenueModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [newVenueId, setNewVenueId] = useState('');
  const [newDay, setNewDay] = useState<Day>('MONDAY');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  const filtered = entries.filter(e => {
    const matchSearch = !search ||
      e.course.title.toLowerCase().includes(search.toLowerCase()) ||
      e.course.code.toLowerCase().includes(search.toLowerCase()) ||
      e.cohort.code.toLowerCase().includes(search.toLowerCase()) ||
      e.lecturer.name.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.code.toLowerCase().includes(search.toLowerCase());
    const matchDay = dayFilter === 'ALL' || e.day === dayFilter;
    const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;
    const matchCohort = cohortFilter === 'ALL' || e.cohortId === cohortFilter;
    return matchSearch && matchDay && matchStatus && matchCohort;
  }).sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.startTime.localeCompare(b.startTime));

  function handleCancel() {
    if (!selectedEntry || !cancelReason.trim()) return;
    setEntries(prev => prev.map(e => e.id === selectedEntry.id
      ? { ...e, status: 'CANCELLED' as const, cancellationReason: cancelReason }
      : e
    ));
    setShowCancelModal(false);
    setCancelReason('');
    setSelectedEntry(null);
  }

  function handleMoveVenue() {
    if (!selectedEntry || !newVenueId) return;
    const venue = VENUES.find(v => v.id === newVenueId)!;
    setEntries(prev => prev.map(e => e.id === selectedEntry.id
      ? { ...e, status: 'MOVED' as const, rescheduledVenueId: newVenueId, rescheduledVenue: venue, reschedulingReason: 'Venue change by timetable officer' }
      : e
    ));
    setShowMoveVenueModal(false);
    setSelectedEntry(null);
    setNewVenueId('');
  }

  function handleReschedule() {
    if (!selectedEntry || !newDay || !newStartTime || !newEndTime) return;
    setEntries(prev => prev.map(e => e.id === selectedEntry.id
      ? { ...e, status: 'RESCHEDULED' as const, rescheduledDay: newDay, rescheduledStartTime: newStartTime, rescheduledEndTime: newEndTime, reschedulingReason: 'Rescheduled by timetable officer' }
      : e
    ));
    setShowRescheduleModal(false);
    setSelectedEntry(null);
    setNewStartTime('');
    setNewEndTime('');
  }

  function handleRestore(entry: TimetableEntry) {
    setEntries(prev => prev.map(e => e.id === entry.id
      ? { ...e, status: 'ACTIVE' as const, cancellationReason: undefined, reschedulingReason: undefined, rescheduledDay: undefined, rescheduledStartTime: undefined, rescheduledEndTime: undefined, rescheduledVenueId: undefined, rescheduledVenue: undefined }
      : e
    ));
  }

  const dayOptions = [
    { value: 'ALL', label: 'All Days' },
    ...DAY_ORDER.map(d => ({ value: d, label: DAY_LABELS[d] })),
  ];

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'RESCHEDULED', label: 'Rescheduled' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'MOVED', label: 'Moved' },
  ];

  const cohortOptions = [
    { value: 'ALL', label: 'All Cohorts' },
    ...COHORTS.map(c => ({ value: c.id, label: c.code })),
  ];

  return (
    <Layout breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Timetable Management' }]}>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-display text-2xl text-slate-900">Timetable Management</h1>
          <p className="text-slate-500 text-sm">2024/2025 Semester 1 · {filtered.length} entries</p>
        </div>
        <div className="sm:ml-auto">
          <Button onClick={() => setShowNewModal(true)}>
            <Plus size={16} /> New Entry
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]"
          />
        </div>
        <select value={dayFilter} onChange={e => setDayFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]">
          {dayOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]">
          {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={cohortFilter} onChange={e => setCohortFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6fd4]">
          {cohortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Course', 'Cohort', 'Day', 'Time', 'Venue', 'Lecturer', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{e.course.title}</p>
                    <p className="text-xs text-slate-500 font-mono">{e.course.code}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{e.cohort.code}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{DAY_LABELS[e.day]}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">{formatTime(e.startTime)}–{formatTime(e.endTime)}</td>
                  <td className="px-4 py-3">
                    <p className="text-slate-900 font-medium">{e.venue.code}</p>
                    <p className="text-xs text-slate-400">{e.venue.building}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    <p>{e.lecturer.name.split(' ').slice(0, 2).join(' ')}</p>
                  </td>
                  <td className="px-4 py-3"><TimetableStatusBadge status={e.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {e.status !== 'CANCELLED' && (
                        <>
                          <button
                            onClick={() => { setSelectedEntry(e); setShowRescheduleModal(true); setNewDay(e.day); setNewStartTime(e.startTime); setNewEndTime(e.endTime); }}
                            className="p-1.5 rounded text-slate-500 hover:bg-amber-100 hover:text-amber-700 transition-colors"
                            title="Reschedule"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            onClick={() => { setSelectedEntry(e); setShowMoveVenueModal(true); setNewVenueId(e.venueId); }}
                            className="p-1.5 rounded text-slate-500 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                            title="Move venue"
                          >
                            <MapPin size={14} />
                          </button>
                          <button
                            onClick={() => { setSelectedEntry(e); setShowCancelModal(true); }}
                            className="p-1.5 rounded text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                            title="Cancel"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                      {e.status === 'CANCELLED' && (
                        <button
                          onClick={() => handleRestore(e)}
                          className="p-1.5 rounded text-slate-500 hover:bg-emerald-100 hover:text-emerald-700 transition-colors text-xs font-medium px-2"
                          title="Restore"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">No entries match your filters</div>
          )}
        </div>
      </Card>

      {/* Cancel modal */}
      <Modal
        open={showCancelModal}
        onClose={() => { setShowCancelModal(false); setCancelReason(''); }}
        title="Cancel Class"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowCancelModal(false)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleCancel} disabled={!cancelReason.trim()}>Confirm Cancellation</Button>
          </>
        }
      >
        {selectedEntry && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="font-medium text-slate-900">{selectedEntry.course.title}</p>
              <p className="text-slate-500 text-xs mt-0.5">{DAY_LABELS[selectedEntry.day]} · {formatTime(selectedEntry.startTime)} – {formatTime(selectedEntry.endTime)} · {selectedEntry.venue.code}</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Cancellation Reason <span className="text-red-500">*</span></label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Provide a reason for cancellation..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b6fd4] resize-none"
              />
            </div>
            <p className="text-xs text-slate-500">Affected students and the lecturer will be notified.</p>
          </div>
        )}
      </Modal>

      {/* Move venue modal */}
      <Modal
        open={showMoveVenueModal}
        onClose={() => setShowMoveVenueModal(false)}
        title="Move Venue"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowMoveVenueModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleMoveVenue}>Confirm Venue Change</Button>
          </>
        }
      >
        {selectedEntry && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="font-medium">{selectedEntry.course.title}</p>
              <p className="text-slate-500 text-xs">{DAY_LABELS[selectedEntry.day]} · Current venue: {selectedEntry.venue.code}</p>
            </div>
            <Select
              label="New Venue"
              value={newVenueId}
              onChange={e => setNewVenueId(e.target.value)}
              options={VENUES.filter(v => v.active).map(v => ({ value: v.id, label: `${v.code} – ${v.name} (Cap: ${v.capacity})` }))}
            />
            {newVenueId && (
              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                ✓ Venue conflict check: No conflicts detected for the selected time slot.
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reschedule modal */}
      <Modal
        open={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        title="Reschedule Class"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowRescheduleModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleReschedule}>Confirm Reschedule</Button>
          </>
        }
      >
        {selectedEntry && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="font-medium">{selectedEntry.course.title}</p>
              <p className="text-slate-500 text-xs">Original: {DAY_LABELS[selectedEntry.day]} · {formatTime(selectedEntry.startTime)} – {formatTime(selectedEntry.endTime)}</p>
            </div>
            <Select
              label="New Day"
              value={newDay}
              onChange={e => setNewDay(e.target.value as Day)}
              options={DAY_ORDER.map(d => ({ value: d, label: DAY_LABELS[d] }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label="New Start Time" type="time" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} />
              <Input label="New End Time" type="time" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} />
            </div>
          </div>
        )}
      </Modal>

      {/* New Entry modal (simplified) */}
      <Modal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="New Timetable Entry"
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowNewModal(false)}>Cancel</Button>
            <Button size="sm" onClick={() => setShowNewModal(false)}>Create Entry</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Course" value="" onChange={() => {}} options={[{ value: '', label: 'Select course...' }, ...COURSES.map(c => ({ value: c.id, label: `${c.code} – ${c.title}` }))]} />
            <Select label="Cohort" value="" onChange={() => {}} options={[{ value: '', label: 'Select cohort...' }, ...COHORTS.map(c => ({ value: c.id, label: c.code }))]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Venue" value="" onChange={() => {}} options={[{ value: '', label: 'Select venue...' }, ...VENUES.filter(v => v.active).map(v => ({ value: v.id, label: `${v.code} (Cap: ${v.capacity})` }))]} />
            <Select label="Day" value="MONDAY" onChange={() => {}} options={DAY_ORDER.map(d => ({ value: d, label: DAY_LABELS[d] }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Time" type="time" defaultValue="08:00" />
            <Input label="End Time" type="time" defaultValue="10:00" />
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
            ✓ No conflicts detected for this time slot
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
