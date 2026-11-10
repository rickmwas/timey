import { Clock, MapPin, Users, User } from 'lucide-react';
import type { TimetableEntry } from '../../types';
import { TimetableStatusBadge } from '../ui/StatusBadge';
import { formatTime, DAY_LABELS } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface TimetableCardProps {
  entry: TimetableEntry;
  compact?: boolean;
  onClick?: () => void;
  showActions?: boolean;
  onReschedule?: () => void;
  onCancel?: () => void;
  onMoveVenue?: () => void;
}

export function TimetableCard({ entry, compact, onClick, showActions, onReschedule, onCancel, onMoveVenue }: TimetableCardProps) {
  const isActive = entry.status === 'ACTIVE';
  const isCancelled = entry.status === 'CANCELLED';
  const isRescheduled = entry.status === 'RESCHEDULED';
  const isMoved = entry.status === 'MOVED';

  const effectiveVenue = (isRescheduled || isMoved) && entry.rescheduledVenue ? entry.rescheduledVenue : entry.venue;
  const effectiveDay = isRescheduled && entry.rescheduledDay ? entry.rescheduledDay : entry.day;
  const effectiveStart = isRescheduled && entry.rescheduledStartTime ? entry.rescheduledStartTime : entry.startTime;
  const effectiveEnd = isRescheduled && entry.rescheduledEndTime ? entry.rescheduledEndTime : entry.endTime;

  return (
    <div
      className={cn(
        'timetable-card bg-white rounded-xl border shadow-sm overflow-hidden',
        isCancelled ? 'opacity-60 border-red-200' : 'border-slate-200',
        onClick && 'cursor-pointer hover:shadow-md',
      )}
      onClick={onClick}
    >
      {/* Left accent bar */}
      <div className={cn(
        'h-1',
        isActive ? 'bg-emerald-500' :
        isCancelled ? 'bg-red-400' :
        isRescheduled ? 'bg-amber-400' :
        'bg-blue-400',
      )} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">{entry.course.code}</span>
            <h3 className={cn('text-sm font-semibold text-slate-900 mt-0.5 leading-snug', isCancelled && 'line-through')}>
              {entry.course.title}
            </h3>
          </div>
          <TimetableStatusBadge status={entry.status} />
        </div>

        {/* Original info (if changed) */}
        {(isRescheduled || isMoved) && (
          <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            {isRescheduled && (
              <span>Original: {DAY_LABELS[entry.day]} {formatTime(entry.startTime)}–{formatTime(entry.endTime)}</span>
            )}
            {isMoved && entry.venue && (
              <span>Original venue: {entry.venue.code}</span>
            )}
          </div>
        )}

        {/* Details */}
        {!compact && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Clock size={13} className="flex-shrink-0 text-slate-400" />
              <span>{DAY_LABELS[effectiveDay]} · {formatTime(effectiveStart)} – {formatTime(effectiveEnd)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <MapPin size={13} className="flex-shrink-0 text-slate-400" />
              <span>{effectiveVenue.code} · {effectiveVenue.building}{effectiveVenue.floor ? `, ${effectiveVenue.floor}` : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <User size={13} className="flex-shrink-0 text-slate-400" />
              <span>{entry.lecturer.name}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Users size={13} className="flex-shrink-0 text-slate-400" />
              <span>{entry.cohort.code}</span>
            </div>
          </div>
        )}

        {compact && (
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Clock size={11} /> {formatTime(effectiveStart)}</span>
            <span className="flex items-center gap-1"><MapPin size={11} /> {effectiveVenue.code}</span>
          </div>
        )}

        {/* Reason */}
        {(entry.cancellationReason || entry.reschedulingReason) && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 italic">
              {entry.cancellationReason || entry.reschedulingReason}
            </p>
          </div>
        )}

        {/* Actions */}
        {showActions && !isCancelled && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
            {onReschedule && (
              <button onClick={e => { e.stopPropagation(); onReschedule(); }} className="text-xs text-[#3b6fd4] hover:underline font-medium">
                Reschedule
              </button>
            )}
            {onMoveVenue && (
              <button onClick={e => { e.stopPropagation(); onMoveVenue(); }} className="text-xs text-slate-600 hover:underline font-medium">
                Move Venue
              </button>
            )}
            {onCancel && (
              <button onClick={e => { e.stopPropagation(); onCancel(); }} className="text-xs text-red-500 hover:underline font-medium ml-auto">
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
