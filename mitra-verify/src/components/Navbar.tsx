'use client';

import Link from 'next/link';
import { Eye, ChevronDown, Menu, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

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
  const { isAuthenticated, logout } = useAuth();

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-[#01081A]/80 backdrop-blur-md border-b border-white/[0.05]"
    >
      <div className="flex items-center gap-14 max-w-[1400px] w-full mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#00E5FF] to-[#00B2FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.3)]">
            <Eye size={20} className="text-white fill-transparent" strokeWidth={2.5} />
          </div>
          <span className="text-white font-bold tracking-wide text-[16px]">MITRA <span className="text-[#00E5FF] drop-shadow-[0_0_12px_rgba(0,229,255,0.6)]">VERIFY</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <NavItem href="/compare">Compare APIs</NavItem>
          <NavItem href="/docs">Documentation</NavItem>
          <NavItem 
            href="/demo/enterprise" 
            items={[
              { label: 'Fast Liveness (< 1s)', href: '/demo/basic' },
              { label: 'Advanced Anti-Spoof', href: '/demo/advanced' },
              { label: 'Enterprise Identity', href: '/demo/enterprise' }
            ]}
          >
            Demos
          </NavItem>
          <NavItem href="/about">About</NavItem>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-5 ml-auto">
          {isAuthenticated && user ? (
            <div className="relative group/profile ml-2">
              <button className="flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-full bg-[#020A1F] border border-white/[0.08] hover:bg-white/[0.05] hover:border-[#00E5FF]/30 transition-all duration-300 shadow-[0_0_15px_rgba(0,229,255,0.05)] hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[#00E5FF]/30 p-[2px]">
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[13px] font-semibold text-white leading-tight">{user.name}</span>
                  <span className="text-[10px] text-[#00E5FF] font-mono leading-tight">{user.role || 'Admin'}</span>
                </div>
                <ChevronDown size={14} className="text-slate-400 ml-1 group-hover/profile:text-white transition-transform group-hover/profile:rotate-180 duration-300" />
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute top-full right-0 mt-3 opacity-0 pointer-events-none group-hover/profile:opacity-100 group-hover/profile:pointer-events-auto transition-all duration-300 translate-y-2 group-hover/profile:translate-y-0 z-50">
                <div className="bg-[#010A20]/95 backdrop-blur-xl border border-white/[0.08] border-t-[#00E5FF]/40 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] w-[240px] flex flex-col relative overflow-hidden">
                  {/* Inner subtle glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF]/50 to-transparent" />
                  
                  {/* User Info Header */}
                  <div className="px-4 py-4 border-b border-white/[0.05] flex flex-col bg-white/[0.01]">
                    <span className="text-sm font-bold text-white truncate">{user.name}</span>
                    <span className="text-xs text-slate-400 truncate mt-0.5">{user.email}</span>
                  </div>
                  
                  <div className="p-2 flex flex-col gap-1">
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
              <Link href="/signin" prefetch={false} className="text-[13px] font-medium text-slate-300 hover:text-white transition-colors">Sign In</Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/signup" prefetch={false} className="block px-5 py-2 rounded-lg bg-gradient-to-b from-[#00E5FF] to-[#00B2FF] hover:opacity-90 transition-opacity text-[13px] font-bold text-white shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:shadow-[0_0_25px_rgba(0,229,255,0.5)]">
                  Get Started
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
