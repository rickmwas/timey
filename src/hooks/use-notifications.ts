"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Notification } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api-client';
import { NOTIFICATIONS } from '../data/mock';

export function useNotifications() {
  const { user, mode } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    if (mode === 'mock') {
      const userN = NOTIFICATIONS.filter(n => n.userId === user.id);
      setNotifications(userN.length > 0 ? userN : NOTIFICATIONS.slice(0, 3));
      setUnreadCount(userN.filter(n => !n.read).length);
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiClient.notifications.list({ limit: 20 });
      if (res && Array.isArray(res.items)) {
        const mapped: Notification[] = res.items.map(item => ({
          id: item.id,
          userId: user.id,
          type: item.type as any,
          title: item.title,
          message: item.message,
          read: !item.unread,
          createdAt: item.createdAt,
        }));
        setNotifications(mapped);
        setUnreadCount(res.unreadCount ?? mapped.filter(n => !n.read).length);
      }
    } catch {
      // Fallback on error/offline
      const userN = NOTIFICATIONS.filter(n => n.userId === user.id);
      setNotifications(userN.length > 0 ? userN : NOTIFICATIONS.slice(0, 3));
      setUnreadCount(userN.filter(n => !n.read).length);
    } finally {
      setIsLoading(false);
    }
  }, [user, mode]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    if (mode !== 'mock') {
      try {
        await apiClient.notifications.markRead(id);
      } catch (e) {
        console.warn('Failed to mark notification read on server:', e);
      }
    }
  }, [mode]);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    if (mode !== 'mock') {
      try {
        await apiClient.notifications.markAllRead();
      } catch (e) {
        console.warn('Failed to mark all read on server:', e);
      }
    }
  }, [mode]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
