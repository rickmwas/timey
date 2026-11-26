import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Day, TimetableStatus, Role } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DAY_ORDER: Day[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const DAY_LABELS: Record<Day, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
};

export const DAY_SHORT: Record<Day, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
};

export function formatTime(time: string): string {
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m} ${suffix}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const STATUS_LABEL: Record<TimetableStatus, string> = {
  ACTIVE: 'Active',
  RESCHEDULED: 'Rescheduled',
  CANCELLED: 'Cancelled',
  MOVED: 'Moved',
};

export const STATUS_STYLE: Record<TimetableStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  RESCHEDULED: 'bg-amber-100 text-amber-800',
  CANCELLED: 'bg-red-100 text-red-800',
  MOVED: 'bg-blue-100 text-blue-800',
};

export const STATUS_DOT: Record<TimetableStatus, string> = {
  ACTIVE: 'bg-emerald-500',
  RESCHEDULED: 'bg-amber-500',
  CANCELLED: 'bg-red-500',
  MOVED: 'bg-blue-500',
};

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: 'Student',
  LECTURER: 'Lecturer',
  COD: 'Head of Department',
  DEAN: 'Dean of School',
  TIMETABLE_OFFICER: 'Timetable Officer',
  ADMIN: 'Administrator',
};

export const ROLE_COLOR: Record<Role, string> = {
  STUDENT: 'bg-sky-100 text-sky-800',
  LECTURER: 'bg-violet-100 text-violet-800',
  COD: 'bg-emerald-100 text-emerald-800',
  DEAN: 'bg-indigo-100 text-indigo-800',
  TIMETABLE_OFFICER: 'bg-amber-100 text-amber-800',
  ADMIN: 'bg-rose-100 text-rose-800',
};

export function getTodayDay(): Day {
  const days: Day[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as Day[];
  const d = new Date().getDay();
  return (d === 0 || d === 6) ? 'MONDAY' : days[d];
}
