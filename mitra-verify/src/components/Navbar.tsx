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
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const visibleLinks = navLinks.filter(link => {
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

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: scrolled ? 'rgba(3, 7, 18, 0.88)' : 'rgba(3, 7, 18, 0.4)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)'}`,
          transition: 'background 0.3s ease, border-color 0.3s ease',
        }}
      >
        <div style={{
          width: '100%',
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}>
          {/* Logo */}
          <Link href="/" style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #00d4ff, #0066ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.25)',
            }}>
              <Eye size={17} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#f8fafc',
            }}>
              MITRA <span className="gradient-text-cyan">VERIFY</span>
            </span>
          </Link>

          {/* Desktop & Tablet Links */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flex: 1,
            justifyContent: 'center',
          }}
            className="hidden md:flex"
          >
            {visibleLinks.map(link => {
              const isTertiary = link.label === 'Compare APIs' || link.label === 'Developer Portal';
              return (
                <div
                  key={link.label}
                  className={isTertiary ? 'hidden lg:block' : 'block'}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => link.children && setActiveDropdown(link.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={link.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '8px 14px',
                      borderRadius: 8,
                      textDecoration: 'none',
                      fontSize: 13,
                      fontWeight: 500,
                      color: isActive(link.href) ? '#00d4ff' : 'rgba(248,250,252,0.65)',
                      transition: 'color 0.2s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      if (!link.children && !isActive(link.href)) {
                        (e.currentTarget as HTMLElement).style.color = '#f8fafc';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!link.children) {
                        (e.currentTarget as HTMLElement).style.color = isActive(link.href) ? '#00d4ff' : 'rgba(248,250,252,0.65)';
                      }
                    }}
                  >
                    {isActive(link.href) && (
                      <>
                        <motion.div
                          layoutId="activeNavTab"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0, 212, 255, 0.04)',
                            border: '1px solid rgba(0, 212, 255, 0.1)',
                            borderRadius: 8,
                            zIndex: -1,
                          }}
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                        <motion.div
                          layoutId="activeNavUnderline"
                          style={{
                            position: 'absolute',
                            bottom: -1,
                            left: '20%',
                            right: '20%',
                            height: 2,
                            background: 'linear-gradient(90deg, #00d4ff, #0066ff)',
                            boxShadow: '0 0 8px rgba(0, 212, 255, 0.7)',
                            borderRadius: 2,
                            zIndex: 2,
                          }}
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      </>
                    )}
                    {link.label}
                    {link.children && <ChevronDown size={13} style={{ opacity: 0.5 }} />}
                  </Link>

                  {/* Dropdown */}
                  {link.children && (
                    <AnimatePresence>
                      {activeDropdown === link.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: 6,
                            background: 'rgba(10, 15, 30, 0.95)',
                            border: '1px solid rgba(0, 212, 255, 0.12)',
                            borderRadius: 12,
                            padding: 6,
                            width: 224,
                            backdropFilter: 'blur(24px)',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 24px rgba(0, 212, 255, 0.04)',
                            zIndex: 100,
                          }}
                        >
                          {link.children.map(child => (
                            <Link key={child.href} href={child.href} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '10px 12px',
                              borderRadius: 8,
                              textDecoration: 'none',
                              transition: 'background 0.15s ease',
                            }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,255,0.06)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: 'rgba(0,212,255,0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
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
              );
            })}
          </div>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
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
                    transition: 'all 0.2s ease',
                    height: 40,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)';
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
                      objectFit: 'cover',
                    }}
                  />
                  <span className="hidden sm:inline" style={{
                    fontSize: 13,
                    color: '#f8fafc',
                    fontWeight: 500,
                    maxWidth: 100,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {user?.name || 'Developer'}
                  </span>
                  <ChevronDown size={13} style={{
                    color: '#94a3b8',
                    transform: userMenuOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: 8,
                        background: 'rgba(10, 15, 30, 0.98)',
                        border: '1px solid rgba(0, 212, 255, 0.15)',
                        borderRadius: 16,
                        padding: 8,
                        width: 220,
                        backdropFilter: 'blur(24px)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 24px rgba(0,212,255,0.04)',
                        zIndex: 1100,
                        display: 'flex',
                        flexDirection: 'column' as const,
                        gap: 2,
                      }}
                    >
                      {/* User Info */}
                      <div style={{
                        padding: '8px 8px 12px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        marginBottom: 4,
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={user?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=Dev'}
                          alt="Avatar"
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.05)',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' as const, overflow: 'hidden', minWidth: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Developer'}</span>
                          <span style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || 'developer@mitraverify.com'}</span>
                        </div>
                      </div>

                      {/* Menu Items */}
                      {[
                        { label: 'Profile', href: '/developer' },
                        { label: 'Security', href: '/developer' },
                        { label: 'API Keys', href: '/developer' },
                        { label: 'Billing', href: '/developer' },
                        { label: 'Settings', href: '/developer' },
                      ].map(item => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setUserMenuOpen(false)}
                          style={{
                            display: 'block',
                            padding: '8px 12px',
                            borderRadius: 8,
                            color: '#94a3b8',
                            textDecoration: 'none',
                            fontSize: 13,
                            fontWeight: 500,
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.06)'; e.currentTarget.style.color = '#f8fafc'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                        >
                          {item.label}
                        </Link>
                      ))}

                      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

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
                          transition: 'all 0.15s ease',
                          width: '100%',
                          textAlign: 'left' as const,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,51,102,0.06)'; }}
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
                  className="hidden sm:inline-flex"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#94a3b8',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                >
                  Sign In
                </Link>
                <Link href="/auth/signup" className="btn-primary hidden md:inline-flex" style={{ padding: '0 20px', fontSize: 13, textDecoration: 'none', height: 36 }}>
                  Get Started Free
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex md:hidden"
              style={{
                background: 'none',
                border: 'none',
                color: '#f8fafc',
                cursor: 'pointer',
                padding: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              id="mobile-menu-btn"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1040,
                background: '#000',
              }}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 'min(300px, 85vw)',
                zIndex: 1050,
                background: 'rgba(5, 8, 16, 0.98)',
                backdropFilter: 'blur(24px)',
                borderLeft: '1px solid rgba(0, 212, 255, 0.1)',
                boxShadow: '-10px 0 48px rgba(0,0,0,0.7)',
                display: 'flex',
                flexDirection: 'column' as const,
                padding: 24,
                overflowY: 'auto',
              }}
            >
              {/* Drawer Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 32,
                paddingBottom: 16,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                  MITRA <span className="gradient-text-cyan">VERIFY</span>
                </span>
                <button onClick={() => setMobileOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#f8fafc', cursor: 'pointer', padding: 4 }}>
                  <X size={20} />
                </button>
              </div>

              {/* Links */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, flex: 1 }}>
                {visibleLinks.map(link => {
                  if (link.children) {
                    return (
                      <div key={link.label} style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
                        <div style={{
                          padding: '10px 12px',
                          fontSize: 11,
                          color: '#475569',
                          fontWeight: 600,
                          textTransform: 'uppercase' as const,
                          letterSpacing: '0.08em',
                        }}>
                          {link.label}
                        </div>
                        {link.children.map(child => (
                          <Link key={child.href} href={child.href}
                            onClick={() => setMobileOpen(false)}
                            style={{
                              padding: '10px 12px 10px 24px',
                              borderRadius: 8,
                              textDecoration: 'none',
                              fontSize: 14,
                              fontWeight: 500,
                              color: isActive(child.href) ? '#00d4ff' : '#94a3b8',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              background: isActive(child.href) ? 'rgba(0, 212, 255, 0.04)' : 'transparent',
                              transition: 'background 0.15s ease',
                            }}>
                            <child.icon size={14} color={isActive(child.href) ? '#00d4ff' : '#64748b'} />
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <Link key={link.label} href={link.href}
                      onClick={() => setMobileOpen(false)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontSize: 15,
                        fontWeight: 500,
                        color: isActive(link.href) ? '#00d4ff' : '#94a3b8',
                        background: isActive(link.href) ? 'rgba(0, 212, 255, 0.04)' : 'transparent',
                        border: isActive(link.href) ? '1px solid rgba(0, 212, 255, 0.1)' : '1px solid transparent',
                        transition: 'all 0.15s ease',
                      }}>
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              {/* Drawer Footer */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, marginTop: 'auto' }}>
                {isAuthenticated ? (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '0 8px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={user?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=Dev'}
                        alt="Avatar"
                        style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column' as const, overflow: 'hidden', minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Developer'}</span>
                        <span style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || 'dev@mitraverify.com'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { logout(); setMobileOpen(false); }}
                      className="btn-ghost"
                      style={{
                        width: '100%',
                        color: '#ff3366',
                        background: 'rgba(255,51,102,0.04)',
                        borderColor: 'rgba(255,51,102,0.12)',
                        justifyContent: 'center',
                      }}
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                    <Link href="/auth/login" style={{ textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
                      <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>Sign In</button>
                    </Link>
                    <Link href="/auth/signup" style={{ textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
                      <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Get Started</button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
