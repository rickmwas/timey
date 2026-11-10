import { cn } from '../../lib/utils';
import type { TimetableStatus, ImportStatus, Role } from '../../types';
import { STATUS_LABEL, STATUS_STYLE, ROLE_LABEL, ROLE_COLOR } from '../../lib/utils';

export function TimetableStatusBadge({ status }: { status: TimetableStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', STATUS_STYLE[status])}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0',
        status === 'ACTIVE' ? 'bg-emerald-500' :
        status === 'RESCHEDULED' ? 'bg-amber-500' :
        status === 'CANCELLED' ? 'bg-red-500' : 'bg-blue-500'
      )} aria-hidden />
      <span>{STATUS_LABEL[status]}</span>
    </span>
  );
}

export function ImportStatusBadge({ status }: { status: ImportStatus }) {
  const styles: Record<ImportStatus, string> = {
    PENDING: 'bg-slate-100 text-slate-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    VALIDATED: 'bg-emerald-100 text-emerald-700',
    CONFLICTS_DETECTED: 'bg-amber-100 text-amber-700',
    COMMITTED: 'bg-green-100 text-green-800',
    DISCARDED: 'bg-slate-100 text-slate-500',
    FAILED: 'bg-red-100 text-red-700',
  };
  const labels: Record<ImportStatus, string> = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    VALIDATED: 'Validated',
    CONFLICTS_DETECTED: 'Conflicts Detected',
    COMMITTED: 'Committed',
    DISCARDED: 'Discarded',
    FAILED: 'Failed',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', styles[status])}>
      {labels[status]}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', ROLE_COLOR[role])}>
      {ROLE_LABEL[role]}
    </span>
  );
}
