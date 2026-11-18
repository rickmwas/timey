"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser, Role } from '../types';
import { DEMO_ACCOUNTS, USERS } from '../data/mock';
import { apiClient, ApiError } from '../lib/api-client';

export interface AuthContextValue {
  user: AuthUser | null;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isOffline: boolean;
  mode: 'live' | 'mock';
  error: string | null;
  isLoading: boolean;
  sessionError: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getCachedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('timy_cached_user') || window.sessionStorage.getItem('timy_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      window.localStorage.setItem('timy_cached_user', JSON.stringify(user));
      window.sessionStorage.setItem('timy_user', JSON.stringify(user));
    } else {
      window.localStorage.removeItem('timy_cached_user');
      window.sessionStorage.removeItem('timy_user');
    }
  } catch {
    // Quota or privacy mode ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getCachedUser);
  const [isOffline, setIsOffline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? !navigator.onLine : false));
  const [mode, setMode] = useState<'live' | 'mock'>('live');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Sync online / offline status
  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
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
  }, []);

  // Background session verification on mount
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      if (typeof window === 'undefined') return;
      if (!navigator.onLine) {
        setIsOffline(true);
        setIsLoading(false);
        return;
      }

      try {
        const res = await apiClient.auth.me();
        if (cancelled) return;
        if (res && res.user) {
          const liveUser: AuthUser = {
            id: res.user.id,
            identifier: res.user.institutionalId || res.user.email,
            name: res.user.fullName || res.user.name,
            email: res.user.email,
            role: res.user.role as Role,
            cohortId: res.user.cohortId ?? undefined,
          };
          setUser(liveUser);
          persistUser(liveUser);
          setMode('live');
        }
      } catch (err: any) {
        if (cancelled) return;
        // If 401 unauthenticated, clear if we don't have an intentional mock session
        if (err instanceof ApiError && err.status === 401) {
          // If cached user was not mock, clear it
          const cached = getCachedUser();
          if (cached && !DEMO_ACCOUNTS.some(a => a.identifier === cached.identifier)) {
            setUser(null);
            persistUser(null);
          }
        } else {
          setSessionError(err instanceof Error ? err.message : "Could not verify your session");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    setAuthError(null);

    // 1. First attempt live authentication against the backend API
    try {
      const res = await apiClient.auth.login(identifier, password);
      if (res && res.user) {
        const liveUser: AuthUser = {
          id: res.user.id,
          identifier: res.user.institutionalId || res.user.email,
          name: res.user.fullName || res.user.name,
          email: res.user.email,
          role: res.user.role as Role,
          cohortId: res.user.cohortId ?? undefined,
        };
        setUser(liveUser);
        persistUser(liveUser);
        setMode('live');
        return { success: true };
      }
    } catch (err: any) {
      // If 401 or specific client rejection, check if DEMO fallback applies
      const isNetworkOrServer = !err.status || err.status >= 500 || err.status === 404;

      if (!isNetworkOrServer && err.status === 401) {
        // Direct password mismatch or unknown user in live DB.
        // Also check demo accounts in case user tests demo credentials while DB isn't seeded with them
        const demo = DEMO_ACCOUNTS.find(a => a.identifier === identifier && a.password === password);
        if (!demo) {
          return { success: false, error: err.message || 'Invalid identifier or password.' };
        }
      }

      // 2. Dual-mode fallback to DEMO_ACCOUNTS
      const demoAccount = DEMO_ACCOUNTS.find(
        a => a.identifier.toLowerCase() === identifier.toLowerCase() && a.password === password
      );
      if (demoAccount) {
        const dbUser = USERS.find(u => u.identifier.toLowerCase() === identifier.toLowerCase());
        const authUser: AuthUser = {
          id: dbUser?.id || `demo-${demoAccount.identifier}`,
          identifier: demoAccount.identifier,
          name: demoAccount.name,
          email: dbUser?.email || `${demoAccount.identifier.toLowerCase().replace(/[^a-z0-9]/g, '')}@kisii.ac.ke`,
          role: demoAccount.role as Role,
          cohortId: dbUser?.cohortId || (demoAccount.role === 'STUDENT' ? 'c1' : undefined),
        };
        setUser(authUser);
        persistUser(authUser);
        setMode('mock');
        console.warn(`[Timy Dual-Mode] Authenticated as ${authUser.name} using offline demo credentials.`);
        return { success: true };
      }

      return {
        success: false,
        error: err.message || 'Unable to authenticate. Please check your credentials or connection.',
      };
    }

    return { success: false, error: 'Authentication failed.' };
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.auth.logout();
    } catch {
      // Ignore network error on logout
    } finally {
      persistUser(null);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('timy_timetable_cache');
      }
      setUser(null);
      setMode('live');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isOffline,
        mode,
        error: authError,
        isLoading,
        sessionError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
