'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Shield, Zap, Menu, X, ChevronDown,
  Eye, Fingerprint
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { label: 'Compare APIs', href: '/compare' },
  { label: 'Documentation', href: '/docs' },
  {
    label: 'Demos', href: '#',
    children: [
      { label: 'Fast Liveness', href: '/demo/basic', icon: Zap, desc: '< 1s detection' },
      { label: 'Anti-Spoof', href: '/demo/advanced', icon: Shield, desc: '97% accuracy' },
      { label: 'Identity', href: '/demo/enterprise', icon: Fingerprint, desc: '99% accuracy' },
    ]
  },
  { label: 'Developer Portal', href: '/developer' },
  { label: 'Dashboard', href: '/dashboard' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Click outside to close profile dropdown
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#user-profile-menu')) {
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [userMenuOpen]);

  const visibleLinks = navLinks.filter(link => {
    // Hide Dashboard and Developer Portal for unauthenticated guests
    if (link.href === '/dashboard' || link.href === '/developer') {
      return isAuthenticated;
    }
    return true;
  });

  if (isAuthenticated && user?.role === 'admin') {
    if (!visibleLinks.some(link => link.href === '/admin')) {
      visibleLinks.push({ label: 'Admin Hub', href: '/admin' });
    }
  }

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          padding: '0 24px',
          background: scrolled ? 'rgba(3, 7, 18, 0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', height: 72, gap: 32 }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #00d4ff, #0066ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
            }}>
              <Eye size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
              MITRA <span className="gradient-text-cyan">VERIFY</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
            {visibleLinks.map(link => (
              <div key={link.label} style={{ position: 'relative' }}
                onMouseEnter={() => link.children && setActiveDropdown(link.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={link.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                    borderRadius: 8, textDecoration: 'none',
                    fontSize: 14, fontWeight: 500,
                    color: pathname === link.href ? '#00d4ff' : 'rgba(248,250,252,0.7)',
                    transition: 'color 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    zIndex: 1
                  }}
                  onMouseEnter={e => { if (!link.children) (e.target as HTMLElement).style.color = '#f8fafc'; }}
                  onMouseLeave={e => { if (!link.children) (e.target as HTMLElement).style.color = pathname === link.href ? '#00d4ff' : 'rgba(248,250,252,0.7)'; }}
                >
                  {pathname === link.href && (
                    <motion.div
                      layoutId="activeNavTab"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0, 212, 255, 0.08)',
                        border: '1px solid rgba(0, 212, 255, 0.2)',
                        borderRadius: 8,
                        zIndex: -1,
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {link.label}
                  {link.children && <ChevronDown size={14} style={{ opacity: 0.6 }} />}
                </Link>
                {/* Dropdown */}
                {link.children && (
                  <AnimatePresence>
                    {activeDropdown === link.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          position: 'absolute', top: '100%', left: 0, marginTop: 8,
                          background: 'rgba(10, 15, 30, 0.92)',
                          border: '1px solid rgba(0, 212, 255, 0.15)',
                          borderRadius: 12, padding: 8, width: 230,
                          backdropFilter: 'blur(20px)',
                          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(0, 212, 255, 0.05)',
                          zIndex: 100
                        }}
                      >
                        {link.children.map(child => (
                          <Link key={child.href} href={child.href} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 12px', borderRadius: 8, textDecoration: 'none',
                            transition: 'background 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,255,0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: 'rgba(0,212,255,0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <child.icon size={15} color="#00d4ff" />
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: '#f8fafc' }}>{child.label}</div>
                              <div style={{ fontSize: 11, color: '#475569' }}>{child.desc}</div>
                            </div>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </div>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {isAuthenticated ? (
              <div style={{ position: 'relative' }} id="user-profile-menu">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 24,
                    padding: '4px 12px 4px 4px',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s',
                    height: 40,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.4)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=Dev'}
                    alt="Avatar"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      objectFit: 'cover'
                    }}
                  />
                  <span style={{ fontSize: 13, color: '#f8fafc', fontWeight: 500, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.name || 'Developer'}
                  </span>
                  <ChevronDown size={14} style={{ color: '#94a3b8', transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: 10,
                        background: 'rgba(10, 15, 30, 0.98)',
                        border: '1px solid rgba(0, 212, 255, 0.2)',
                        borderRadius: 16,
                        padding: 12,
                        width: 240,
                        backdropFilter: 'blur(25px)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(0,212,255,0.05)',
                        zIndex: 1100,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}
                    >
                      {/* User Info Header */}
                      <div style={{ padding: '8px 8px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={user?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=Dev'}
                          alt="Avatar"
                          style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Developer'}</span>
                          <span style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || 'developer@mitraverify.com'}</span>
                        </div>
                      </div>

                      {/* Dropdown Options */}
                      <Link href="/developer" onClick={() => setUserMenuOpen(false)} style={{ display: 'block', padding: '8px 12px', borderRadius: 8, color: '#94a3b8', textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.06)'; e.currentTarget.style.color = '#f8fafc'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
                        Profile
                      </Link>

                      <Link href="/developer" onClick={() => setUserMenuOpen(false)} style={{ display: 'block', padding: '8px 12px', borderRadius: 8, color: '#94a3b8', textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.06)'; e.currentTarget.style.color = '#f8fafc'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
                        Security
                      </Link>

                      <Link href="/developer" onClick={() => setUserMenuOpen(false)} style={{ display: 'block', padding: '8px 12px', borderRadius: 8, color: '#94a3b8', textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.06)'; e.currentTarget.style.color = '#f8fafc'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
                        API Keys
                      </Link>

                      <Link href="/developer" onClick={() => setUserMenuOpen(false)} style={{ display: 'block', padding: '8px 12px', borderRadius: 8, color: '#94a3b8', textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.06)'; e.currentTarget.style.color = '#f8fafc'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
                        Billing
                      </Link>

                      <Link href="/developer" onClick={() => setUserMenuOpen(false)} style={{ display: 'block', padding: '8px 12px', borderRadius: 8, color: '#94a3b8', textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.06)'; e.currentTarget.style.color = '#f8fafc'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
                        Settings
                      </Link>

                      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />

                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        style={{
                          display: 'block',
                          padding: '8px 12px',
                          borderRadius: 8,
                          color: '#ff3366',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 600,
                          transition: 'all 0.15s',
                          width: '100%',
                          textAlign: 'left'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,51,102,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/auth/login"
                  style={{
                    padding: '8px 18px', borderRadius: 8, textDecoration: 'none',
                    fontSize: 13, fontWeight: 600, color: '#94a3b8', transition: 'color 0.2s'
                  }}>
                  Sign In
                </Link>
                <Link href="/auth/signup" className="btn-primary" style={{ padding: '9px 20px', fontSize: 13, textDecoration: 'none', display: 'inline-block' }}>
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            style={{ display: 'none', background: 'none', border: 'none', color: '#f8fafc', cursor: 'pointer', padding: 8 }}
            id="mobile-menu-btn">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              position: 'fixed', top: 72, left: 0, right: 0, zIndex: 999,
              background: 'rgba(3, 7, 18, 0.97)', backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {visibleLinks.map(link => (
                <Link key={link.label} href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    padding: '12px 16px', borderRadius: 8, textDecoration: 'none',
                    fontSize: 15, fontWeight: 500, color: '#94a3b8',
                  }}>
                  {link.label}
                </Link>
              ))}
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexDirection: 'column' }}>
                {isAuthenticated ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    <div style={{ fontSize: 14, color: '#f8fafc', padding: '8px 0', fontWeight: 500 }}>
                      Logged in as: <span style={{ color: '#00d4ff' }}>{user?.name || 'Developer'}</span>
                    </div>
                    <button
                      onClick={() => logout()}
                      className="btn-ghost"
                      style={{ width: '100%', color: '#ff3366', background: 'rgba(255,51,102,0.05)', borderColor: 'rgba(255,51,102,0.15)' }}
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <Link href="/auth/login" style={{ flex: 1, textDecoration: 'none' }}>
                      <button className="btn-ghost" style={{ width: '100%' }}>Sign In</button>
                    </Link>
                    <Link href="/auth/signup" style={{ flex: 1, textDecoration: 'none' }}>
                      <button className="btn-primary" style={{ width: '100%' }}>Get Started</button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
