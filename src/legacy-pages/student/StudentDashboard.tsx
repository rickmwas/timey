"use client";

import { Clock, BookOpen, MapPin, AlertTriangle, Megaphone, WifiOff, BellRing, Volume2 } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card, StatCard } from '../../components/ui/Card';
import { TimetableCard } from '../../components/timetable/TimetableCard';
import { useAuth } from '../../contexts/AuthContext';
import { useTimetable } from '../../hooks/use-timetable';
import { useNotifications } from '../../hooks/use-notifications';
import { useRealtimeNotifications } from '../../hooks/use-realtime-notifications';
import { useClassCountdown } from '../../hooks/use-class-countdown';
import { ANNOUNCEMENTS, COHORTS } from '../../data/mock';
import { getTodayDay, formatTime, DAY_LABELS, timeAgo } from '../../lib/utils';

export function StudentDashboard() {
  const { user } = useAuth();
  const { entries, todayEntries, nextClass, isLoading, isOffline, lastSyncedAt, refresh } = useTimetable();
  const { notifications, unreadCount } = useNotifications();
  const todayDay = getTodayDay();

  // Real-time phone streaming & live ringing
  const {
    isConnected: isSseConnected,
    isAudioUnlocked,
    lastEvent,
    enableAudioAndAlerts,
  } = useRealtimeNotifications(refresh);

  // 30m and 10m countdown reminders
  const { minutesUntilStart, nextEntry } = useClassCountdown(todayEntries);

  const studentCohort = COHORTS.find(c => c.id === user?.cohortId) ?? COHORTS[0];
  const recentAnnouncements = ANNOUNCEMENTS.slice(0, 3);

  const now = new Date();
  const currentHour = now.getHours();

  const uniqueCoursesCount = new Set(entries.map(e => e.courseId || e.course.code)).size;
  const cancelledCount = entries.filter(e => e.status === 'CANCELLED').length;

  return (
    <Layout breadcrumb={[{ label: 'Dashboard' }]}>
      {/* Real-time Audio Alert Activator (Browsers require user gesture to play chime audio) */}
      {!isAudioUnlocked && (
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-3.5 rounded-2xl flex items-center justify-between mb-5 shadow-sm border border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Volume2 size={17} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Enable Audio Chimes & Notifications</p>
              <p className="text-[11px] text-slate-300">Allow instant ringer on venue shifts and 30m/10m countdown alerts</p>
            </div>
          </div>
          <button
            onClick={enableAudioAndAlerts}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shrink-0 ml-2"
          >
            Turn On
          </button>
        </div>
      )}

      {/* Live Event Banner (when a real-time modification just arrived) */}
      {lastEvent && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs px-4 py-3 rounded-2xl flex items-center justify-between mb-5 shadow-lg animate-bounce">
          <div className="flex items-center gap-2.5">
            <BellRing size={16} className="text-white animate-pulse" />
            <div>
              <p className="font-bold text-sm">
                Live Alert: {lastEvent.courseCode || "Schedule"} {lastEvent.type.toLowerCase()}
              </p>
              <p className="text-emerald-100">
                {lastEvent.message || `Venue moved to ${lastEvent.newVenue || "updated hall"}.`}
              </p>
            </div>
          </div>
          <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
            Just now
          </span>
        </div>
      )}

      {/* Ambient Offline Banner */}
      {isOffline && (
        <div className="bg-amber-50 text-amber-900 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 border border-amber-200 mb-5 shadow-sm">
          <WifiOff size={15} className="text-amber-600 flex-shrink-0" />
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
          <span>
            Working offline. Displaying cached timetable{' '}
            {lastSyncedAt ? `(synced ${timeAgo(lastSyncedAt.toISOString())})` : ''} · Campus updates will sync automatically once reconnected.
          </span>
        </div>
      )}

      {/* Welcome bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-slate-900">
            Good {currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="text-[#1a2f5c]">{user?.name ? user.name.split(' ')[0] : 'Student'}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {studentCohort.name} · {studentCohort.academicYear} Semester {studentCohort.semester} ·{' '}
            {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Realtime Countdown Pill */}
        {nextEntry && minutesUntilStart !== null && minutesUntilStart > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#1a2f5c] font-medium shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span>
              Next: <strong>{nextEntry.course.code}</strong> in <strong>{minutesUntilStart} mins</strong> ({nextEntry.venue.code})
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Today's Classes"
          value={todayEntries.length}
          icon={<Clock size={18} className="text-[#1a2f5c]" />}
          iconBg="bg-blue-100"
          subtitle={todayEntries.length === 0 ? 'No classes today' : `${DAY_LABELS[todayDay]}`}
        />
        <StatCard
          label="My Courses"
          value={uniqueCoursesCount}
          icon={<BookOpen size={18} className="text-violet-600" />}
          iconBg="bg-violet-100"
          subtitle="Enrolled semester"
        />
        <StatCard
          label="Unread Alerts"
          value={unreadCount}
          icon={<AlertTriangle size={18} className="text-amber-600" />}
          iconBg="bg-amber-100"
          subtitle={unreadCount > 0 ? 'Requires attention' : 'All caught up'}
        />
        <StatCard
          label="Cancelled"
          value={cancelledCount}
          icon={<MapPin size={18} className="text-red-500" />}
          iconBg="bg-red-100"
          subtitle="This semester"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's schedule */}
        <div className="lg:col-span-2 space-y-4">
          {/* Next class highlight */}
          {nextClass && (
            <Card className="border-l-4 border-l-[#3b6fd4] bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#3b6fd4] uppercase tracking-wider mb-1">Next Class</p>
                  <h3 className="text-base font-bold text-slate-900">{nextClass.course.title}</h3>
                  <p className="text-sm text-slate-600 mt-0.5">{nextClass.course.code}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1"><Clock size={13} /> {formatTime(nextClass.startTime)}</span>
                    <span className="flex items-center gap-1"><MapPin size={13} /> {nextClass.venue.code}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-3xl font-bold text-[#1a2f5c]">{formatTime(nextClass.startTime)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{nextClass.venue.building}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Today's classes */}
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Clock size={15} />
              Today&apos;s Schedule — {DAY_LABELS[todayDay]}
            </h2>
            {isLoading && entries.length === 0 ? (
              <Card className="text-center py-10">
                <p className="text-slate-400 text-sm animate-pulse">Loading today&apos;s schedule...</p>
              </Card>
            ) : todayEntries.length === 0 ? (
              <Card className="text-center py-10">
                <p className="text-slate-400 text-sm">No classes scheduled for today.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {todayEntries.map(entry => (
                  <TimetableCard key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Notifications */}
          {notifications.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500" />
                Schedule Alerts
              </h2>
              <div className="space-y-3">
                {notifications.slice(0, 4).map(n => (
                  <div key={n.id} className="text-sm">
                    <p className="font-medium text-slate-800">{n.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Announcements */}
          <Card>
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Megaphone size={15} />
              Announcements
            </h2>
            <div className="space-y-3">
              {recentAnnouncements.map(a => (
                <div key={a.id} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-slate-800 line-clamp-2">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.author.name} · {timeAgo(a.createdAt)}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* This week summary */}
          <Card>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">This Week</h2>
            <div className="space-y-2">
              {(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const).map(day => {
                const dayEntries = entries.filter(e => e.day === day && e.status !== 'CANCELLED');
                return (
                  <div key={day} className={`flex items-center justify-between py-1.5 px-2 rounded-lg text-sm ${day === todayDay ? 'bg-blue-50' : ''}`}>
                    <span className={`font-medium ${day === todayDay ? 'text-[#1a2f5c]' : 'text-slate-600'}`}>
                      {day.slice(0, 3)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {dayEntries.length === 0 ? '—' : `${dayEntries.length} class${dayEntries.length !== 1 ? 'es' : ''}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
