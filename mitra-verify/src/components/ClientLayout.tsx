'use client';
import { useState, useEffect } from 'react';
import { isMobileMenuOpen } from '@/components/Navbar';
import Footer from '@/components/Footer';

/**
 * Client-side layout wrapper that includes components requiring hooks/state.
 * Mounted inside the server-side RootLayout.
 */
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex-1 flex flex-col min-h-screen">
        {children}
      </div>
      <Footer />
    </>
  );
}
