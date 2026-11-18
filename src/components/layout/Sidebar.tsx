"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Calendar, BookOpen, MapPin, Bell, Megaphone,
  Users, Upload, AlertTriangle, RefreshCw, Building2, GraduationCap,
  Settings, LogOut, Menu, X, ChevronRight, ClipboardList,
} from 'lucide-react';
import { cn, ROLE_LABEL } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import type { Role } from '../../types';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

const studentNav: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/timetable', icon: <Calendar size={18} />, label: 'My Timetable' },
  { to: '/courses', icon: <BookOpen size={18} />, label: 'Courses' },
  { to: '/venues', icon: <MapPin size={18} />, label: 'Venues' },
  { to: '/announcements', icon: <Megaphone size={18} />, label: 'Announcements' },
  { to: '/notifications', icon: <Bell size={18} />, label: 'Notifications', badge: 2 },
  { to: '/settings', icon: <Settings size={18} />, label: 'Settings' },
];

const lecturerNav: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/timetable', icon: <Calendar size={18} />, label: 'My Schedule' },
  { to: '/courses', icon: <BookOpen size={18} />, label: 'Courses' },
  { to: '/venues', icon: <MapPin size={18} />, label: 'Venues' },
  { to: '/announcements', icon: <Megaphone size={18} />, label: 'Announcements' },
  { to: '/notifications', icon: <Bell size={18} />, label: 'Notifications', badge: 1 },
  { to: '/settings', icon: <Settings size={18} />, label: 'Settings' },
];

const officerNav: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/timetable', icon: <Calendar size={18} />, label: 'Timetable' },
  { to: '/import', icon: <Upload size={18} />, label: 'Import Timetable' },
  { to: '/conflicts', icon: <AlertTriangle size={18} />, label: 'Conflicts', badge: 1 },
  { to: '/rescheduling', icon: <RefreshCw size={18} />, label: 'Rescheduling' },
  { to: '/venues', icon: <MapPin size={18} />, label: 'Venues' },
  { to: '/courses', icon: <BookOpen size={18} />, label: 'Courses' },
  { to: '/cohorts', icon: <GraduationCap size={18} />, label: 'Cohorts' },
  { to: '/departments', icon: <Building2 size={18} />, label: 'Departments' },
  { to: '/announcements', icon: <Megaphone size={18} />, label: 'Announcements' },
  { to: '/notifications', icon: <Bell size={18} />, label: 'Notifications' },
  { to: '/settings', icon: <Settings size={18} />, label: 'Settings' },
];

const adminNav: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/admin/users', icon: <Users size={18} />, label: 'Users' },
  { to: '/timetable', icon: <Calendar size={18} />, label: 'Timetable' },
  { to: '/import', icon: <Upload size={18} />, label: 'Import Timetable' },
  { to: '/conflicts', icon: <AlertTriangle size={18} />, label: 'Conflicts' },
  { to: '/venues', icon: <MapPin size={18} />, label: 'Venues' },
  { to: '/courses', icon: <BookOpen size={18} />, label: 'Courses' },
  { to: '/cohorts', icon: <GraduationCap size={18} />, label: 'Cohorts' },
  { to: '/departments', icon: <Building2 size={18} />, label: 'Departments' },
  { to: '/announcements', icon: <Megaphone size={18} />, label: 'Announcements' },
  { to: '/notifications', icon: <Bell size={18} />, label: 'Notifications' },
  { to: '/admin/settings', icon: <Settings size={18} />, label: 'System Settings' },
];

const navByRole: Record<Role, NavItem[]> = {
  STUDENT: studentNav,
  LECTURER: lecturerNav,
  TIMETABLE_OFFICER: officerNav,
  ADMIN: adminNav,
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const navItems = user ? navByRole[user.role] : [];

  function handleLogout() {
    logout();
    router.push('/');
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-[#3b6fd4] flex items-center justify-center flex-shrink-0">
          <ClipboardList size={16} className="text-white" />
        </div>
        <div>
          <span className="font-display text-xl text-white tracking-wide">Timy</span>
          <p className="text-xs text-blue-200 leading-none mt-0.5">Kisii University</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto p-1 text-blue-200 hover:text-white lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* User info */}
      {user && (
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#3b6fd4]/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">{user.name[0]}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-blue-300 truncate">{user.identifier}</p>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs bg-white/10 text-blue-100 px-2 py-0.5 rounded-full">
              {ROLE_LABEL[user.role]}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 sidebar-scroll px-3 py-3 space-y-0.5">
        {navItems.map(item => {
          const isActive =
            pathname === item.to || pathname.startsWith(item.to + '/');

          return (
            <Link
              key={item.to}
              href={item.to}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-100 group',
                isActive
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white',
              )}
            >
              <span
                className={cn(
                  'flex-shrink-0',
                  isActive
                    ? 'text-white'
                    : 'text-blue-300 group-hover:text-white',
                )}
              >
                {item.icon}
              </span>

              <span className="flex-1 min-w-0 truncate">
                {item.label}
              </span>

              {item.badge ? (
                <span className="ml-auto flex-shrink-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight
                  size={14}
                  className="ml-auto flex-shrink-0 text-blue-300"
                />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-[#1a2f5c] shadow-2xl transition-transform duration-300 lg:hidden',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        <SidebarContent onClose={onClose} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#1a2f5c]">
        <SidebarContent />
      </aside>
    </>
  );
}

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors lg:hidden"
      aria-label="Toggle sidebar"
    >
      <Menu size={20} />
    </button>
  );
}
