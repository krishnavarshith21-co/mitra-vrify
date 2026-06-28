'use client';

import Link from 'next/link';
import { Eye, ChevronDown, Menu, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

function NavItem({ href, children, items }: { href?: string, children: React.ReactNode, items?: {label: string, href: string}[] }) {
  const content = (
    <>
      <span className="flex items-center gap-1">
        {children}
        {items && <ChevronDown size={14} className="opacity-70 group-hover:opacity-100 transition-transform duration-300 group-hover:rotate-180" />}
      </span>
      {/* Glowing bottom line on hover */}
      <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-[0_0_12px_rgba(0,229,255,0.8)]" />
    </>
  );

  const className = "px-4 py-2 text-[13px] font-medium text-slate-300 transition-all duration-300 rounded-lg border border-transparent group-hover:bg-white/[0.02] group-hover:border-white/[0.05] group-hover:text-[#00E5FF] flex items-center relative";

  return (
    <div className="relative group">
      {href ? (
        <Link href={href} className={className} prefetch={false}>{content}</Link>
      ) : (
        <button className={className}>{content}</button>
      )}

      {items && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
          <div className="bg-[#010A20]/95 backdrop-blur-xl border border-white/[0.08] border-t-[#00E5FF]/40 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] p-2 min-w-[220px] flex flex-col gap-1 relative overflow-hidden">
            {/* Inner subtle glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF]/50 to-transparent" />
            
            {items.map((item, idx) => (
              <Link 
                key={idx} 
                href={item.href} 
                prefetch={false}
                className="group/item px-3 py-2.5 text-[13px] text-slate-300 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 rounded-lg transition-all duration-200 flex items-center gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover/item:bg-[#00E5FF] group-hover/item:shadow-[0_0_8px_#00E5FF] transition-all" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demosExpanded, setDemosExpanded] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setDemosExpanded(false);
  }, [pathname]);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const demoItems = [
    { label: 'Fast Liveness (< 1s)', href: '/demo/basic' },
    { label: 'Advanced Anti-Spoof', href: '/demo/advanced' },
    { label: 'Enterprise Identity', href: '/demo/enterprise' }
  ];

  return (
    <>
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between bg-[#01081A]/80 backdrop-blur-md border-b border-white/[0.05]"
      >
        <div className="flex items-center gap-6 lg:gap-14 max-w-[1400px] w-full mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-b from-[#00E5FF] to-[#00B2FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.3)]">
              <Eye size={18} className="text-white fill-transparent md:hidden" strokeWidth={2.5} />
              <Eye size={20} className="text-white fill-transparent hidden md:block" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold tracking-wide text-[15px] md:text-[16px]">MITRA <span className="text-[#00E5FF] drop-shadow-[0_0_12px_rgba(0,229,255,0.6)]">VERIFY</span></span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <NavItem href="/compare">Compare APIs</NavItem>
            <NavItem href="/docs">Documentation</NavItem>
            <NavItem 
              href="/demo/enterprise" 
              items={demoItems}
            >
              Demos
            </NavItem>
            <NavItem href="/about">About</NavItem>
            {(user?.email === 'admin@mitraverify.com' || user?.role === 'admin') && (
              <NavItem href="/admin">Admin Dashboard</NavItem>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 md:gap-5 ml-auto">
            {isAuthenticated && user ? (
              <div className="relative group/profile ml-2">
                <button className="flex items-center gap-2 md:gap-3 pl-1.5 pr-3 md:pr-4 py-1.5 rounded-full bg-[#020A1F] border border-white/[0.08] hover:bg-white/[0.05] hover:border-[#00E5FF]/30 transition-all duration-300 shadow-[0_0_15px_rgba(0,229,255,0.05)] hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden border border-[#00E5FF]/30 p-[2px]">
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div className="hidden sm:flex flex-col items-start text-left">
                    <span className="text-[13px] font-semibold text-white leading-tight">{user.name}</span>
                    <span className="text-[10px] text-[#00E5FF] font-mono leading-tight">{user.role || 'Admin'}</span>
                  </div>
                  <ChevronDown size={14} className="text-slate-400 ml-1 group-hover/profile:text-white transition-transform group-hover/profile:rotate-180 duration-300 hidden sm:block" />
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-3 opacity-0 pointer-events-none group-hover/profile:opacity-100 group-hover/profile:pointer-events-auto transition-all duration-300 translate-y-2 group-hover/profile:translate-y-0 z-50">
                  <div className="bg-[#010A20]/95 backdrop-blur-xl border border-white/[0.08] border-t-[#00E5FF]/40 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] w-[220px] md:w-[240px] flex flex-col relative overflow-hidden">
                    {/* Inner subtle glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF]/50 to-transparent" />
                    
                    {/* User Info Header */}
                    <div className="px-4 py-4 border-b border-white/[0.05] flex flex-col bg-white/[0.01]">
                      <span className="text-sm font-bold text-white truncate">{user.name}</span>
                      <span className="text-xs text-slate-400 truncate mt-0.5">{user.email}</span>
                    </div>
                    
                    <div className="p-2 flex flex-col gap-1">
                      {(user.email === 'admin@mitraverify.com' || user.role === 'admin') && (
                        <Link href="/admin" prefetch={false} className="group/item px-3 py-2 text-[13px] text-[#00E5FF] hover:text-white hover:bg-[#00E5FF]/20 rounded-lg transition-all duration-200 flex items-center gap-3 font-semibold bg-[#00E5FF]/5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] transition-all" />
                          Admin Portal
                        </Link>
                      )}
                      <Link href="/dashboard" prefetch={false} className="group/item px-3 py-2 text-[13px] text-slate-300 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 rounded-lg transition-all duration-200 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover/item:bg-[#00E5FF] group-hover/item:shadow-[0_0_8px_#00E5FF] transition-all" />
                        Security Console
                      </Link>
                      <Link href="/api-keys" prefetch={false} className="group/item px-3 py-2 text-[13px] text-slate-300 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 rounded-lg transition-all duration-200 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover/item:bg-[#00E5FF] group-hover/item:shadow-[0_0_8px_#00E5FF] transition-all" />
                        API Keys
                      </Link>
                    </div>
                    
                    <div className="p-2 border-t border-white/[0.05]">
                      <button onClick={() => logout()} className="w-full px-3 py-2.5 text-[13px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex items-center justify-between">
                        Sign Out
                        <LogOut size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link href="/signin" prefetch={false} className="text-[13px] font-medium text-slate-300 hover:text-white transition-colors hidden sm:block">Sign In</Link>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden sm:block">
                  <Link href="/signup" prefetch={false} className="block px-4 md:px-5 py-2 rounded-lg bg-gradient-to-b from-[#00E5FF] to-[#00B2FF] hover:opacity-90 transition-opacity text-[13px] font-bold text-white shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:shadow-[0_0_25px_rgba(0,229,255,0.5)]">
                    Get Started
                  </Link>
                </motion.div>
              </>
            )}

            {/* Mobile Hamburger */}
            <button 
              onClick={() => setMobileOpen(true)} 
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-white/[0.08] bg-white/[0.02] text-slate-300 hover:text-white hover:border-[#00E5FF]/30 transition-all"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ─── MOBILE NAV OVERLAY ─────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mobile-nav-overlay"
            style={{ zIndex: 9999 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#00E5FF] to-[#00B2FF] flex items-center justify-center">
                  <Eye size={18} className="text-white fill-transparent" strokeWidth={2.5} />
                </div>
                <span className="text-white font-bold tracking-wide text-[15px]">MITRA <span className="text-[#00E5FF]">VERIFY</span></span>
              </Link>
              <button 
                onClick={() => setMobileOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/[0.08] text-slate-300 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nav Links */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="flex flex-col gap-1">
                <Link href="/compare" prefetch={false} onClick={() => setMobileOpen(false)} className="mobile-nav-link">
                  Compare APIs
                </Link>
                <Link href="/docs" prefetch={false} onClick={() => setMobileOpen(false)} className="mobile-nav-link">
                  Documentation
                </Link>
                
                {/* Demos with expandable sub-links */}
                <button 
                  onClick={() => setDemosExpanded(!demosExpanded)}
                  className="mobile-nav-link justify-between"
                >
                  <span>Demos</span>
                  <ChevronDown size={16} className={`transition-transform duration-300 ${demosExpanded ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {demosExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-8 flex flex-col gap-1 pb-2">
                        {demoItems.map((item, idx) => (
                          <Link 
                            key={idx}
                            href={item.href} 
                            prefetch={false}
                            onClick={() => setMobileOpen(false)}
                            className="py-2.5 px-4 text-[15px] text-slate-400 hover:text-[#00E5FF] rounded-lg transition-colors flex items-center gap-3"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Link href="/about" prefetch={false} onClick={() => setMobileOpen(false)} className="mobile-nav-link">
                  About
                </Link>

                {(user?.email === 'admin@mitraverify.com' || user?.role === 'admin') && (
                  <Link href="/admin" prefetch={false} onClick={() => setMobileOpen(false)} className="mobile-nav-link" style={{ color: '#00E5FF' }}>
                    Admin Dashboard
                  </Link>
                )}

                {isAuthenticated && user && (
                  <>
                    <div className="h-px bg-white/[0.06] my-3" />
                    <Link href="/dashboard" prefetch={false} onClick={() => setMobileOpen(false)} className="mobile-nav-link">
                      Security Console
                    </Link>
                    <Link href="/api-keys" prefetch={false} onClick={() => setMobileOpen(false)} className="mobile-nav-link">
                      API Keys
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="px-4 py-4 border-t border-white/[0.06]" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
              {isAuthenticated && user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-[#00E5FF]/30 p-[2px] shrink-0">
                      <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[14px] font-semibold text-white truncate">{user.name}</span>
                      <span className="text-[11px] text-slate-400 truncate">{user.email}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="w-full px-4 py-3 text-[14px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link 
                    href="/signup" 
                    prefetch={false}
                    onClick={() => setMobileOpen(false)}
                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-b from-[#00E5FF] to-[#00B2FF] text-[14px] font-bold text-[#020617] flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.3)]"
                  >
                    Get Started Free
                  </Link>
                  <Link 
                    href="/signin" 
                    prefetch={false}
                    onClick={() => setMobileOpen(false)}
                    className="w-full px-4 py-3 rounded-xl border border-white/[0.1] text-[14px] font-medium text-slate-300 flex items-center justify-center hover:bg-white/[0.04] transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
