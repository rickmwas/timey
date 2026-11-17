import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { AuthUser } from "../types";
import { ApiRequestError, apiRequest, normalizeAuthUser, type ApiUser } from "../lib/api-client";

interface AuthContextValue {
  user: AuthUser | null;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionError: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const result = await apiRequest<{ user: ApiUser }>("/api/v1/auth/me");
        if (active) setUser(normalizeAuthUser(result.user));
      } catch (error) {
        if (
          active &&
          !(error instanceof ApiRequestError && error.status === 401)
        ) {
          setSessionError(
            error instanceof Error ? error.message : "Could not restore your session",
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    setSessionError(null);
    try {
      const result = await apiRequest<{ user: ApiUser }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      setUser(normalizeAuthUser(result.user));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  }, []);

  const logout = useCallback(() => {
    return apiRequest<{ loggedOut: boolean }>("/api/v1/auth/logout", {
      method: "POST",
    })
      .then(() => {
        setUser(null);
        return { success: true };
      })
      .catch((error: unknown) => ({
        success: false,
        error: error instanceof Error ? error.message : "Sign out failed",
      }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading, sessionError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
