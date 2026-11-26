"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TimetableEntry, Day } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api-client';
import { TIMETABLE_ENTRIES, COHORTS } from '../data/mock';
import { getTodayDay } from '../lib/utils';

export function normalizeTimetableEntry(item: any): TimetableEntry {
  const status = item.status === 'SCHEDULED' ? 'ACTIVE' : item.status;
  const rawVenue = item.venue || {};
  const rawCourse = item.course || {};
  const rawCohort = item.cohort || {};
  const rawLecturer = item.lecturer || {};

  return {
    id: item.entryId || item.id || `entry-${Math.random().toString(36).substring(2, 9)}`,
    courseId: rawCourse.id || item.courseId || '',
    course: {
      id: rawCourse.id || '',
      code: rawCourse.code || 'CRS',
      title: rawCourse.title || 'Course Title',
      departmentId: rawCourse.departmentId || '',
      department: rawCourse.department || { id: '', code: '', name: '', school: '' },
      credits: rawCourse.credits || 3,
    },
    lecturerId: rawLecturer.id || item.lecturerId || '',
    lecturer: {
      id: rawLecturer.id || '',
      identifier: rawLecturer.identifier || '',
      name: rawLecturer.fullName || rawLecturer.name || 'Assigned Lecturer',
      email: rawLecturer.email || '',
      role: 'LECTURER',
      active: true,
      createdAt: '',
    },
    cohortId: rawCohort.id || item.cohortId || '',
    cohort: {
      id: rawCohort.id || '',
      code: rawCohort.code || 'COHORT',
      name: rawCohort.name || 'Cohort',
      departmentId: rawCohort.departmentId || '',
      department: rawCohort.department || { id: '', code: '', name: '', school: '' },
      academicYear: rawCohort.academicYear || '2024/2025',
      semester: rawCohort.semester || 1,
      expectedSize: rawCohort.expectedSize || 40,
    },
    venueId: rawVenue.id || item.venueId || '',
    venue: {
      id: rawVenue.id || '',
      code: rawVenue.code || 'TBD',
      name: rawVenue.name || 'To Be Determined',
      building: rawVenue.building || 'Campus',
      floor: rawVenue.floor || '',
      capacity: rawVenue.capacity || 50,
      active: true,
      aliases: rawVenue.aliases || [],
    },
    day: (item.day as Day) || 'MONDAY',
    startTime: item.startTime || '08:00',
    endTime: item.endTime || '10:00',
    academicYear: item.academicYear || '2024/2025',
    semester: item.semester || 1,
    status: (status as any) || 'ACTIVE',
    rescheduledDay: item.rescheduledDay,
    rescheduledStartTime: item.rescheduledStartTime,
    rescheduledEndTime: item.rescheduledEndTime,
    rescheduledVenueId: item.rescheduledVenueId,
    rescheduledVenue: item.replacementVenue || item.rescheduledVenue,
    cancellationReason: item.cancellationReason || item.reason,
    reschedulingReason: item.reschedulingReason || item.reason,
  };
}

interface CachePayload {
  timestamp: number;
  entries: TimetableEntry[];
}

function getStoredCache(): { entries: TimetableEntry[]; timestamp: number | null } {
  if (typeof window === 'undefined') return { entries: [], timestamp: null };
  try {
    const raw = window.localStorage.getItem('timy_timetable_cache');
    if (!raw) return { entries: [], timestamp: null };
    const parsed: CachePayload = JSON.parse(raw);
    return {
      entries: parsed.entries || [],
      timestamp: parsed.timestamp || null,
    };
  } catch {
    return { entries: [], timestamp: null };
  }
}

function persistCache(entries: TimetableEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    const payload: CachePayload = {
      timestamp: Date.now(),
      entries,
    };
    window.localStorage.setItem('timy_timetable_cache', JSON.stringify(payload));
  } catch {
    // Ignore storage quota
  }
}

export function useTimetable() {
  const { user, mode, isOffline: isAuthOffline } = useAuth();
  const [entries, setEntries] = useState<TimetableEntry[]>(() => getStoredCache().entries);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => {
    const ts = getStoredCache().timestamp;
    return ts ? new Date(ts) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(isAuthOffline);
  const [error, setError] = useState<string | null>(null);

  // Fallback to mock entries based on role and identifiers
  const getMockEntries = useCallback((): TimetableEntry[] => {
    if (!user) return [];
    if (user.role === 'STUDENT') {
      const cohortId = user.cohortId || COHORTS[0]?.id;
      const matched = TIMETABLE_ENTRIES.filter(e => e.cohortId === cohortId);
      return matched.length > 0 ? matched : TIMETABLE_ENTRIES.slice(0, 5);
    }
    if (user.role === 'LECTURER') {
      const matched = TIMETABLE_ENTRIES.filter(e => e.lecturerId === user.id || e.lecturer.name === user.name);
      return matched.length > 0 ? matched : TIMETABLE_ENTRIES.slice(0, 4);
    }
    return TIMETABLE_ENTRIES;
  }, [user]);

  const fetchTimetable = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // If explicit mock mode, load mock entries immediately
    if (mode === 'mock') {
      const mocks = getMockEntries();
      setEntries(mocks);
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.timetables.me();
      if (response && Array.isArray(response.items)) {
        const normalized = response.items.map(normalizeTimetableEntry);
        setEntries(normalized);
        persistCache(normalized);
        setLastSyncedAt(new Date());
        setIsOffline(false);
      } else {
        // Fallback to mock if API returns empty non-items structure
        const mocks = getMockEntries();
        setEntries(mocks);
      }
    } catch (err: any) {
      console.warn('[Timy Offline Cache] Failed to fetch live timetable, falling back to cache/mock:', err?.message);
      setIsOffline(true);
      setError(err?.message || 'Offline mode active');

      // Use stored cache if available
      const cached = getStoredCache();
      if (cached.entries.length > 0) {
        setEntries(cached.entries);
        if (cached.timestamp) setLastSyncedAt(new Date(cached.timestamp));
      } else {
        // Otherwise use mock data
        const mocks = getMockEntries();
        setEntries(mocks);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, mode, getMockEntries]);

  // Initial fetch and dependency on user changes
  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  // Online / offline listeners
  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
      fetchTimetable();
    }
    function handleOffline() {
      setIsOffline(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchTimetable]);

  // Computed views
  const todayDay = getTodayDay();

  const todayEntries = useMemo(() => {
    return entries
      .filter(e => {
        const effectiveDay = e.status === 'RESCHEDULED' && e.rescheduledDay ? e.rescheduledDay : e.day;
        return effectiveDay === todayDay && e.status !== 'CANCELLED';
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [entries, todayDay]);

  const currentClass = useMemo(() => {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    return todayEntries.find(e => {
      const [sh, sm] = e.startTime.split(':').map(Number);
      const [eh, em] = e.endTime.split(':').map(Number);
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      return start <= nowMins && nowMins < end;
    });
  }, [todayEntries]);

  const nextClass = useMemo(() => {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    return todayEntries.find(e => {
      const [h, m] = e.startTime.split(':').map(Number);
      return h * 60 + m > nowMins;
    });
  }, [todayEntries]);

  const scheduleState = useMemo(() => {
    if (currentClass) return 'IN_SESSION' as const;
    if (nextClass) return 'UPCOMING' as const;
    if (todayEntries.length > 0) return 'COMPLETED' as const;
    return 'NO_CLASSES' as const;
  }, [currentClass, nextClass, todayEntries]);

  return {
    entries,
    todayEntries,
    currentClass,
    nextClass,
    scheduleState,
    isLoading,
    isOffline,
    lastSyncedAt,
    error,
    refresh: fetchTimetable,
  };
}

export function useTimetableEntries() {
  const { entries, isLoading, error, refresh } = useTimetable();
  return { entries, isLoading, error, refresh };
}
