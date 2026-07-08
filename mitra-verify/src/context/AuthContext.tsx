'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';

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

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Map Supabase user to our User interface
        const sbUser = session.user;
        const name = sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'User';
        const provider = sbUser.app_metadata?.provider || 'supabase';
        const avatar = sbUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
        
        setUser({
          name,
          email: sbUser.email || '',
          avatar,
          provider
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('[Auth] Error getting session:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const sbUser = session.user;
        const name = sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'User';
        const provider = sbUser.app_metadata?.provider || 'supabase';
        const avatar = sbUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
        
        setUser({
          name,
          email: sbUser.email || '',
          avatar,
          provider
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser]);

  // Backward compatibility if still using old authAPI
  const login = useCallback((token: string, userDetails: User) => {
    console.log('[Auth] login() called manually for custom fallback:', userDetails.email);
    setUser(userDetails);
    setLoading(false);
  }, []);

  const logout = useCallback(async (callbackUrl?: string) => {
    console.log('[Auth] logout() via Supabase');
    setLoading(true);
    await supabase.auth.signOut();
    try {
      await authAPI.logout(); 
    } catch (e) {
      // ignore
    }
    setUser(null);
    setLoading(false);
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
