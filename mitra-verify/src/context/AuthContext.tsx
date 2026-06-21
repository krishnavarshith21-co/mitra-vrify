'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

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
  login: (token: string, userDetails: User) => void;
  logout: (callbackUrl?: string) => void;
  refreshUser: () => Promise<void>;
}

// ── Storage helpers ───────────────────────────────────────────────────────────

const KEYS = {
  token: 'mv_access_token',
  name: 'mv_user_name',
  email: 'mv_user_email',
  avatar: 'mv_user_avatar',
  provider: 'mv_user_provider',
  enrolled: 'mv_user_has_enrolled_face',
};

function saveUser(token: string, user: User) {
  localStorage.setItem(KEYS.token, token);
  localStorage.setItem(KEYS.name, user.name);
  localStorage.setItem(KEYS.email, user.email);
  localStorage.setItem(KEYS.avatar, user.avatar);
  localStorage.setItem(KEYS.provider, user.provider);
  localStorage.setItem(KEYS.enrolled, String(!!user.hasEnrolledFace));
}

function loadUserFromStorage(): User | null {
  const name = localStorage.getItem(KEYS.name);
  const email = localStorage.getItem(KEYS.email);
  if (!name || !email) return null;
  return {
    name,
    email,
    avatar: localStorage.getItem(KEYS.avatar) || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    provider: localStorage.getItem(KEYS.provider) || 'credentials',
    hasEnrolledFace: localStorage.getItem(KEYS.enrolled) === 'true',
  };
}

function clearStorage() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  localStorage.removeItem('enrolledEmbedding');
  localStorage.removeItem('mv_enrolled_signature');
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // loading = true only during the INITIAL app-boot check
  const [loading, setLoading] = useState(true);

  // ── Boot: restore session from localStorage ───────────────────────────────
  const refreshUser = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(KEYS.token) : null;

    if (!token) {
      console.log('[Auth] No token found — unauthenticated');
      setUser(null);
      setLoading(false);
      return;
    }

    // Step 1: Paint immediately from cached localStorage data (zero network wait)
    const cached = loadUserFromStorage();
    if (cached) {
      console.log('[Auth] Restored session from cache:', cached.email);
      setUser(cached);
      setLoading(false); // ← loading done as soon as we have cached user
    }

    // Step 2: Silently verify token with backend (background refresh)
    // If this fails it does NOT log the user out — it only updates the user object.
    // Only a genuine 401 (token truly invalid/expired) will log them out.
    try {
      const res = await authAPI.me();
      if (res.data) {
        const updated: User = {
          name: res.data.full_name || cached?.name || 'User',
          email: res.data.email || cached?.email || '',
          avatar: cached?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(res.data.full_name || 'User')}`,
          provider: cached?.provider || 'credentials',
          role: res.data.role,
          hasEnrolledFace: cached?.hasEnrolledFace,
        };
        setUser(updated);
        // Sync back to localStorage
        localStorage.setItem(KEYS.name, updated.name);
        localStorage.setItem(KEYS.email, updated.email);
        localStorage.setItem(KEYS.avatar, updated.avatar);
        console.log('[Auth] Token verified with backend ✓');
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        // Token is genuinely invalid/expired — log out
        console.warn('[Auth] Token rejected by backend (401) — clearing session');
        clearStorage();
        setUser(null);
      } else {
        // Network error, timeout, 5xx etc — keep existing cached session
        console.warn('[Auth] Backend unreachable during token verify — keeping cached session');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ── login(): called immediately after successful API login ────────────────
  const login = useCallback((token: string, userDetails: User) => {
    console.log('[Auth] login() called for:', userDetails.email);
    saveUser(token, userDetails);
    setUser(userDetails);
    setLoading(false);
  }, []);

  // ── logout() ──────────────────────────────────────────────────────────────
  const logout = useCallback((callbackUrl?: string) => {
    console.log('[Auth] logout()');
    // Fire-and-forget server logout (already handled in authAPI.logout)
    authAPI.logout();
    clearStorage();
    setUser(null);
    window.location.href = callbackUrl || '/signin';
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
