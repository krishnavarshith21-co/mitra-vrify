'use client';

import Link from 'next/link';
import { Eye, ChevronDown, Menu, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

function NavItem({ href, children, hasDropdown = false }: { href?: string, children: React.ReactNode, hasDropdown?: boolean }) {
  const content = (
    <>
      <span className="flex items-center gap-1">
        {children}
        {hasDropdown && <ChevronDown size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />}
      </span>
      {/* Glowing bottom line on hover */}
      <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-[0_0_12px_rgba(0,229,255,0.8)]" />
    </>
  );

  const className = "group relative px-4 py-2 text-[13px] font-medium text-slate-300 transition-all duration-300 rounded-lg border border-transparent hover:bg-white/[0.02] hover:border-white/[0.05] hover:text-[#00E5FF]";

  if (href) {
    return <Link href={href} className={className}>{content}</Link>;
  }
  return <button className={className}>{content}</button>;
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

        {/* Links - Centered Absolutely */}
        <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <NavItem href="/compare">Compare APIs</NavItem>
          <NavItem href="/docs">Documentation</NavItem>
          <NavItem href="/demo/enterprise" hasDropdown>Demos</NavItem>
          <NavItem href="/about">About</NavItem>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-5 ml-auto">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="text-[13px] font-bold text-[#00E5FF] hover:text-white transition-colors px-4 py-2 bg-[#00E5FF]/10 border border-[#00E5FF]/20 rounded-lg">
                Console
              </Link>
              <button onClick={() => logout()} className="text-[13px] font-medium text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1.5">
                <LogOut size={14} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/signin" className="text-[13px] font-medium text-slate-300 hover:text-white transition-colors">Sign In</Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/signup" className="block px-5 py-2 rounded-lg bg-gradient-to-b from-[#00E5FF] to-[#00B2FF] hover:opacity-90 transition-opacity text-[13px] font-bold text-white shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:shadow-[0_0_25px_rgba(0,229,255,0.5)]">
                  Get Started
                </Link>
              </motion.div>
            </>
          )}
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <Menu size={16} />
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}
