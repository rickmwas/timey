import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentTimetable } from './pages/student/StudentTimetable';
import { LecturerDashboard } from './pages/lecturer/LecturerDashboard';
import { OfficerDashboard } from './pages/officer/OfficerDashboard';
import { TimetableManagement } from './pages/officer/TimetableManagement';
import { VenueManagement } from './pages/officer/VenueManagement';
import { ImportTimetable } from './pages/officer/ImportTimetable';
import { ConflictDetection } from './pages/officer/ConflictDetection';
import { Rescheduling } from './pages/officer/Rescheduling';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { Notifications } from './pages/shared/Notifications';
import { Announcements } from './pages/shared/Announcements';
import { CoursesPage } from './pages/shared/CoursesPage';
import { CohortsPage } from './pages/shared/CohortsPage';
import { DepartmentsPage } from './pages/shared/DepartmentsPage';
import type { Role } from './types';

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role === 'STUDENT') return <StudentDashboard />;
  if (user.role === 'LECTURER') return <LecturerDashboard />;
  if (user.role === 'TIMETABLE_OFFICER') return <OfficerDashboard />;
  if (user.role === 'ADMIN') return <AdminDashboard />;
  return <Navigate to="/" replace />;
}

function TimetableRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role === 'STUDENT') return <StudentTimetable />;
  if (user.role === 'LECTURER') return <LecturerDashboard />;
  if (user.role === 'TIMETABLE_OFFICER' || user.role === 'ADMIN') return <TimetableManagement />;
  return <Navigate to="/" replace />;
}

function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      <Route path="/dashboard" element={<RequireAuth><DashboardRouter /></RequireAuth>} />
      <Route path="/timetable" element={<RequireAuth><TimetableRouter /></RequireAuth>} />

      <Route path="/venues" element={<RequireAuth><VenueManagement /></RequireAuth>} />
      <Route path="/courses" element={<RequireAuth><CoursesPage /></RequireAuth>} />
      <Route path="/cohorts" element={<RequireAuth><CohortsPage /></RequireAuth>} />
      <Route path="/departments" element={<RequireAuth><DepartmentsPage /></RequireAuth>} />

      <Route path="/import" element={<RequireAuth roles={['TIMETABLE_OFFICER', 'ADMIN']}><ImportTimetable /></RequireAuth>} />
      <Route path="/conflicts" element={<RequireAuth roles={['TIMETABLE_OFFICER', 'ADMIN']}><ConflictDetection /></RequireAuth>} />
      <Route path="/rescheduling" element={<RequireAuth roles={['TIMETABLE_OFFICER', 'ADMIN']}><Rescheduling /></RequireAuth>} />

      <Route path="/admin/users" element={<RequireAuth roles={['ADMIN']}><UserManagement /></RequireAuth>} />
      <Route path="/admin/settings" element={<RequireAuth roles={['ADMIN']}><AdminDashboard /></RequireAuth>} />

      <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
      <Route path="/announcements" element={<RequireAuth><Announcements /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
