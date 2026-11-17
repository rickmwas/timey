"use client";

import { useState } from 'react';
import { Bell, CheckCheck, Megaphone, MapPin, RefreshCw, X, AlertCircle } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/use-notifications';
import { timeAgo } from '../../lib/utils';
import type { Notification, NotificationType } from '../../types';

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  VENUE_SWAP: { icon: <MapPin size={15} />, color: 'text-blue-600 bg-blue-100' },
  SCHEDULE_RESCHEDULED: { icon: <RefreshCw size={15} />, color: 'text-amber-600 bg-amber-100' },
  CLASS_RESCHEDULED: { icon: <RefreshCw size={15} />, color: 'text-amber-600 bg-amber-100' },
  SCHEDULE_CANCELLED: { icon: <X size={15} />, color: 'text-red-600 bg-red-100' },
  CLASS_CANCELLED: { icon: <X size={15} />, color: 'text-red-600 bg-red-100' },
  SCHEDULE_POSTPONED: { icon: <RefreshCw size={15} />, color: 'text-purple-600 bg-purple-100' },
  ANNOUNCEMENT: { icon: <Megaphone size={15} />, color: 'text-violet-600 bg-violet-100' },
  SYSTEM_ALERT: { icon: <AlertCircle size={15} />, color: 'text-rose-600 bg-rose-100' },
  GENERAL: { icon: <Bell size={15} />, color: 'text-slate-600 bg-slate-100' },
};

const typeLabels: Record<string, string> = {
  VENUE_SWAP: 'Venue Change',
  SCHEDULE_RESCHEDULED: 'Rescheduled',
  CLASS_RESCHEDULED: 'Rescheduled',
  SCHEDULE_CANCELLED: 'Cancelled',
  CLASS_CANCELLED: 'Cancelled',
  SCHEDULE_POSTPONED: 'Postponed',
  ANNOUNCEMENT: 'Announcement',
  SYSTEM_ALERT: 'System Alert',
  GENERAL: 'General',
};

export function Notifications() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const displayed = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  return (
    <Layout breadcrumb={[{ label: 'Notifications' }]}>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-display text-2xl text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-sm">{unreadCount} unread · {notifications.length} total</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="sm:ml-auto" onClick={markAllAsRead}>
            <CheckCheck size={15} /> Mark all as read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-lg w-fit">
        {(['all', 'unread'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {f} {f === 'unread' && unreadCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <Card className="text-center py-12">
          <Bell size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">No {filter === 'unread' ? 'unread ' : ''}notifications</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {displayed.map(n => {
            const config = typeConfig[n.type];
            return (
              <Card
                key={n.id}
                className={`cursor-pointer hover:shadow-md transition-all ${!n.read ? 'border-l-4 border-l-[#3b6fd4]' : ''}`}
                onClick={() => markAsRead(n.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-medium text-slate-500">{typeLabels[n.type]}</span>
                        <h3 className={`text-sm font-semibold mt-0.5 ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>{n.title}</h3>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-2">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
