'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, livenessAPI } from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface User {
  name: string;
  email: string;
  avatar: string;
  provider: string;
  role?: string;
  hasEnrolledFace?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error?: string;
  /** Called after a successful credentials login from the FastAPI backend. */
  login: (token: string, userDetails: User) => void;
  logout: (callbackUrl?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Local credentials user (covers email/password FastAPI login)
  const [credentialsUser, setCredentialsUser] = useState<User | null>(null);
  const [credentialsLoading, setCredentialsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // ── Bootstrap credentials session on mount ────────────────────────────────
  const refreshUser = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mv_access_token') : null;
    // Set a 5‑second timeout to avoid hanging UI
    const timeoutId = setTimeout(() => {
      console.warn('[Session] Verification timed out after 5s');
      setSessionError('Session verification timed out. Please try again.');
      setCredentialsLoading(false);
    }, 5000);

    if (!token) {
      clearTimeout(timeoutId);
      setCredentialsUser(null);
      setCredentialsLoading(false);
      return;
    }

    // Optimistic: paint immediately from localStorage cache
    const localName = localStorage.getItem('mv_user_name');
    const localEmail = localStorage.getItem('mv_user_email');
    const localAvatar = localStorage.getItem('mv_user_avatar');
    const localProvider = localStorage.getItem('mv_user_provider') || 'credentials';
    const localHasEnrolled = localStorage.getItem('mv_user_has_enrolled_face') === 'true';

    if (localName && localEmail) {
      setCredentialsUser({
        name: localName,
        email: localEmail,
        avatar: localAvatar || '',
        provider: localProvider,
        hasEnrolledFace: localHasEnrolled,
      });
    }

    try {
      console.log('[Session] Verifying token');
      const res = await authAPI.me();
      if (res.data) {
        let hasEnrolledFace = false;
        try {
          const enrolledRes = await livenessAPI.getEnrolledFace();
          hasEnrolledFace = !!enrolledRes.data?.enrolled;
        } catch (err) {
          console.error('[Face Enrollment] Failed to fetch face enrollment status on refresh', err);
        }
        const u: User = {
          name: res.data.full_name || 'Developer',
          email: res.data.email || '',
          avatar:
            localAvatar ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(res.data.full_name || 'Developer')}`,
          provider: localProvider,
          role: res.data.role,
          hasEnrolledFace,
        };
        setCredentialsUser(u);
        localStorage.setItem('mv_user_name', u.name);
        localStorage.setItem('mv_user_email', u.email);
        localStorage.setItem('mv_user_avatar', u.avatar);
        localStorage.setItem('mv_user_has_enrolled_face', String(hasEnrolledFace));
        setSessionError(null);
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error?.response?.status === 401) {
        console.warn('[Session] Token invalid or expired');
        _clearCredentials();
        setSessionError('Session expired. Please sign in again.');
      } else {
        console.error('[Session] Verification error', err);
        setSessionError('Unable to verify session. Please try again later.');
      }
    } finally {
      clearTimeout(timeoutId);
      setCredentialsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshUser();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshUser]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _clearCredentials() {
    localStorage.removeItem('mv_access_token');
    localStorage.removeItem('mv_user_name');
    localStorage.removeItem('mv_user_email');
    localStorage.removeItem('mv_user_avatar');
    localStorage.removeItem('mv_user_provider');
    localStorage.removeItem('mv_user_has_enrolled_face');
    setCredentialsUser(null);
    setSessionError(null);
  }

  const login = (token: string, userDetails: User) => {
    localStorage.setItem('mv_access_token', token);
    localStorage.setItem('mv_user_name', userDetails.name);
    localStorage.setItem('mv_user_email', userDetails.email);
    localStorage.setItem('mv_user_avatar', userDetails.avatar);
    localStorage.setItem('mv_user_provider', userDetails.provider);
    localStorage.setItem('mv_user_has_enrolled_face', String(!!userDetails.hasEnrolledFace));
    // Directly set user — no refreshUser() to avoid race condition with dashboard auth guard
    setCredentialsUser(userDetails);
    setCredentialsLoading(false);
  };

  // ── logout() — clears credentials token ───────────────────────────────────
  const logout = async (callbackUrl?: string) => {
    // Clear FastAPI credentials
    try {
      if (localStorage.getItem('mv_access_token')) {
        await authAPI.logout();
      }
    } catch {
      // ignore
    }
    _clearCredentials();
    if (typeof window !== 'undefined') {
      window.location.href = callbackUrl || '/';
    }
  };

  // ── Derive unified user from credentials session ──────────────────────────
  const user = credentialsUser;
  const loading = credentialsLoading;
  const isAuthenticated = !!user;
  const error = sessionError ?? undefined;

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, error, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
