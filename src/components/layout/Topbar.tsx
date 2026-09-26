import { useState } from 'react';
import { Bell, Search, ChevronDown, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SidebarToggle } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { NOTIFICATIONS } from '../../data/mock';
import { timeAgo } from '../../lib/utils';

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
  breadcrumb?: { label: string; to?: string }[];
}

export function Topbar({ onMenuClick, title, breadcrumb }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const userNotifications = NOTIFICATIONS.filter(n => n.userId === user?.id);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center gap-4">
      <SidebarToggle onClick={onMenuClick} />

      {/* Breadcrumb / Title */}
      <div className="flex-1 min-w-0">
        {breadcrumb && breadcrumb.length > 0 ? (
          <nav className="flex items-center gap-1.5 text-sm">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-300">/</span>}
                <span className={i === breadcrumb.length - 1 ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                  {crumb.label}
                </span>
              </span>
            ))}
          </nav>
        ) : title ? (
          <h1 className="text-base font-semibold text-slate-900 truncate">{title}</h1>
        ) : null}
      </div>

      {/* Academic year pill */}
      <div className="hidden sm:flex items-center gap-1.5 text-xs bg-navy-50 text-navy-700 px-3 py-1.5 rounded-full border border-navy-200 font-medium" style={{ background: '#f4f7fe', color: '#1a2f5c', borderColor: '#ccdaf8' }}>
        2024/2025 · Sem 1
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
          className="relative p-2 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
              <span className="text-xs text-slate-500">{unreadCount} unread</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {userNotifications.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No notifications</p>
              ) : (
                userNotifications.slice(0, 5).map(n => (
                  <div key={n.id} className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${!n.read ? 'bg-blue-50/50' : ''}`}>
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                      <div className={!n.read ? '' : 'ml-4'}>
                        <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-2 border-t border-slate-100 text-center">
              <button onClick={() => { navigate('/notifications'); setShowNotifications(false); }} className="text-xs text-[#3b6fd4] hover:underline font-medium">
                View all notifications
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="relative">
        <button
          onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-[#1a2f5c] flex items-center justify-center">
            <span className="text-xs font-semibold text-white">{user?.name[0]}</span>
          </div>
          <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-24 truncate">{user?.name.split(' ')[0]}</span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>

        {showProfile && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.identifier}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <div className="p-1">
              <button onClick={() => setShowProfile(false)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">
                <User size={15} /> Profile
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Close dropdowns when clicking outside */}
      {(showProfile || showNotifications) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowProfile(false); setShowNotifications(false); }} aria-hidden />
      )}
    </header>
  );
}
