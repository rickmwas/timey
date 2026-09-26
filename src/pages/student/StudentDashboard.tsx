import { Clock, BookOpen, MapPin, AlertTriangle, Megaphone } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card, StatCard } from '../../components/ui/Card';
import { TimetableCard } from '../../components/timetable/TimetableCard';
import { useAuth } from '../../contexts/AuthContext';
import { TIMETABLE_ENTRIES, NOTIFICATIONS, ANNOUNCEMENTS, COHORTS } from '../../data/mock';
import { getTodayDay, formatTime, DAY_LABELS, timeAgo } from '../../lib/utils';

export function StudentDashboard() {
  const { user } = useAuth();
  const todayDay = getTodayDay();

  // Student is Alice Mwangi, in cohort c1 (CS-2024-Y1-A)
  const studentCohort = COHORTS[0];
  const cohortEntries = TIMETABLE_ENTRIES.filter(e => e.cohortId === studentCohort.id);

  const todayEntries = cohortEntries.filter(e => {
    const effectiveDay = e.status === 'RESCHEDULED' && e.rescheduledDay ? e.rescheduledDay : e.day;
    return effectiveDay === todayDay && e.status !== 'CANCELLED';
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const upcomingEntries = cohortEntries
    .filter(e => e.status === 'ACTIVE')
    .slice(0, 3);

  const userNotifications = NOTIFICATIONS.filter(n => n.userId === user?.id && !n.read);
  const recentAnnouncements = ANNOUNCEMENTS.slice(0, 3);

  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const nowMins = currentHour * 60 + currentMin;

  const nextClass = todayEntries.find(e => {
    const [h, m] = e.startTime.split(':').map(Number);
    return h * 60 + m > nowMins;
  });

  return (
    <Layout breadcrumb={[{ label: 'Dashboard' }]}>
      {/* Welcome bar */}
      <div className="mb-6">
        <h1 className="font-display text-2xl text-slate-900">
          Good {currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="text-[#1a2f5c]">{user?.name.split(' ')[0]}</span>
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {studentCohort.name} · {studentCohort.academicYear} Semester {studentCohort.semester} ·{' '}
          {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
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
          value={new Set(cohortEntries.map(e => e.courseId)).size}
          icon={<BookOpen size={18} className="text-violet-600" />}
          iconBg="bg-violet-100"
          subtitle="This semester"
        />
        <StatCard
          label="Unread Alerts"
          value={userNotifications.length}
          icon={<AlertTriangle size={18} className="text-amber-600" />}
          iconBg="bg-amber-100"
          subtitle={userNotifications.length > 0 ? 'Requires attention' : 'All caught up'}
        />
        <StatCard
          label="Cancelled"
          value={cohortEntries.filter(e => e.status === 'CANCELLED').length}
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
              Today's Schedule — {DAY_LABELS[todayDay]}
            </h2>
            {todayEntries.length === 0 ? (
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
          {userNotifications.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500" />
                Schedule Alerts
              </h2>
              <div className="space-y-3">
                {userNotifications.map(n => (
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
                const dayEntries = cohortEntries.filter(e => e.day === day);
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
