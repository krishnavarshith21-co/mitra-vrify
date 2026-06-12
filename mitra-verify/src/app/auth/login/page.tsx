'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Eye, Mail, Lock, ArrowRight, RefreshCw,
  HelpCircle, ShieldQuestion, HeartHandshake, CheckCircle,
} from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      console.log("[Face Enrollment] User is already authenticated. Redirecting to /dashboard");
      try {
        router.replace('/dashboard');
      } catch (err) {
        console.error("[Face Enrollment] Router replace failed, falling back to window.location", err);
        window.location.href = '/dashboard';
      }
    }
  }, [isAuthenticated, authLoading, router]);

  // Read redirect reason from query string
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const reason = params.get('reason') || params.get('message') || params.get('error');
      if (reason) {
        const timer = setTimeout(() => {
          if (reason === 'verification_lost' || reason.includes('lost') || reason.includes('session')) {
            setNotification('Authentication session ended. Face verification lost.');
          } else if (reason === 'unauthenticated' || reason.includes('auth')) {
            setNotification('Please sign in to access this protected route.');
          } else {
            setNotification(reason);
          }
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // ── Credentials login ─────────────────────────────────────────────────────

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await authAPI.login({ email, password });
      const token = res.data.access_token;

      const userDetails = {
        name: res.data.full_name || email.split('@')[0] || 'Developer',
        email,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email.split('@')[0] || 'Dev')}`,
        provider: 'credentials',
      };

      login(token, userDetails);
      setSuccess('Sign in successful! Redirecting...');

      console.log("[Auth] Sign-in successful. Redirecting to /dashboard");
      setTimeout(() => {
        try {
          router.replace('/dashboard');
        } catch {
          window.location.href = '/dashboard';
        }
      }, 100);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setError(apiErr?.response?.data?.detail || 'Login failed. Check your credentials.');
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
      className="grid-bg noise"
    >
      {/* Ambient glow */}
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)', top: '10%', left: '-10%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,102,255,0.06) 0%, transparent 70%)', bottom: '10%', right: '-10%', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 440, zIndex: 10 }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #00d4ff, #0066ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(0,212,255,0.3)' }}>
            <Eye size={20} color="#fff" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc' }}>
            MITRA <span className="gradient-text-cyan">VERIFY</span>
          </span>
        </Link>

        {/* Card */}
        <div className="glass" style={{ padding: '36px 40px', borderRadius: 24, border: '1px solid rgba(0,212,255,0.15)', boxShadow: '0 20px 50px rgba(0,0,0,0.3), 0 0 30px rgba(0,212,255,0.05)' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8, textAlign: 'center', color: '#f8fafc' }}>Sign In</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 28 }}>Access your MITRA VERIFY account</p>

          {/* Notifications */}
          <AnimatePresence>
            {notification && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
                {notification}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={15} /> {success}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.2)', color: '#ff3366', fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email / Password Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#475569" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com"
                  style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#f8fafc', fontSize: 14, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(0,212,255,0.4)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#475569" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#f8fafc', fontSize: 14, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(0,212,255,0.4)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#94a3b8' }}>
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: '#00d4ff', width: 15, height: 15 }} />
                Remember Me
              </label>
              <Link href="/auth/forgot" style={{ fontSize: 13, color: '#00d4ff', textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit" disabled={loading} className="btn-primary"
              style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <RefreshCw size={14} />
                  </motion.div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Bottom links */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Link href="/auth/forgot" style={{ fontSize: 12, color: '#475569', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
              onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
              <ShieldQuestion size={12} /> Forgot Password
            </Link>
            <Link href="/contact" style={{ fontSize: 12, color: '#475569', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
              onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
              <HelpCircle size={12} /> Need Help?
            </Link>
            <Link href="/contact" style={{ fontSize: 12, color: '#475569', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
              onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
              <HeartHandshake size={12} /> Contact Support
            </Link>
          </div>
        </div>

        {/* Sign up link */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#475569' }}>
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" style={{ color: '#00d4ff', textDecoration: 'none', fontWeight: 600 }}>
            Create one free
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
