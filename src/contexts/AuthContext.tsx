import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AuthUser, Role } from '../types';
import { DEMO_ACCOUNTS, USERS } from '../data/mock';

interface AuthContextValue {
  user: AuthUser | null;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = getSessionStorage()?.getItem('timy_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (identifier: string, password: string) => {
    await new Promise(r => setTimeout(r, 600));
    const account = DEMO_ACCOUNTS.find(
      a => a.identifier === identifier && a.password === password
    );
    if (!account) {
      return { success: false, error: 'Invalid credentials. Please check your ID and password.' };
    }
    const dbUser = USERS.find(u => u.identifier === identifier);
    if (!dbUser) {
      return { success: false, error: 'User account not found.' };
    }
    const authUser: AuthUser = {
      id: dbUser.id,
      identifier: dbUser.identifier,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role as Role,
      cohortId: dbUser.cohortId,
    };
    getSessionStorage()?.setItem('timy_user', JSON.stringify(authUser));
    setUser(authUser);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    getSessionStorage()?.removeItem('timy_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
