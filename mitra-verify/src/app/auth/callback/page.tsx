'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Wait slightly to let Supabase client parse the hash fragment
    const exchangeSession = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        
        // 1. Check for explicit error in URL
        const err = params.get('error_description') || params.get('error');
        if (err) {
          setError(decodeURIComponent(err.replace(/\+/g, ' ')));
          return;
        }

        // 2. See if session is already established
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        if (session) {
          router.replace('/dashboard');
          return;
        }

        // 3. Fallback listener for implicit flow resolution
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            router.replace('/dashboard');
          } else if (event === 'SIGNED_OUT') {
            setError('Authentication was interrupted.');
          }
        });

        // Timeout fallback if hash is missing or unparseable
        const timeout = setTimeout(() => {
           if (!window.location.hash) {
             setError('No authentication token found. Please try signing in again.');
           }
        }, 3000);

        return () => {
          authListener.subscription.unsubscribe();
          clearTimeout(timeout);
        };
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred during authentication.');
      }
    };

    exchangeSession();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050814] text-[#F8FAFC] flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-[#6EA8FE]/20">
      
      {/* Cinematic Background Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#6EA8FE]/[0.03] blur-[120px]"
        />
        
        {/* Soft film grain */}
        <div className="absolute inset-0 z-40 opacity-[0.025] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-[400px] w-full px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 mb-12 opacity-90"
        >
          <Shield className="w-[20px] h-[20px] text-[#94A3B8]" strokeWidth={1.5} />
          <span className="text-[18px] font-medium tracking-[0.25em] text-[#CBD5E1] uppercase">
            Mitra Verify
          </span>
        </motion.div>

        <AnimatePresence mode="wait">
          {!error ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-8">
                <div className="w-[64px] h-[64px] rounded-[20px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex items-center justify-center overflow-hidden">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-[#6EA8FE]/30 to-transparent blur-md"
                  />
                  <RefreshCw className="w-[24px] h-[24px] text-[#E2E8F0] animate-spin relative z-10" strokeWidth={1.5} style={{ animationDuration: '2s' }} />
                </div>
              </div>
              <h1 className="text-[20px] font-light tracking-wide text-[#E2E8F0] mb-3">Authenticating</h1>
              <p className="text-[14px] text-[#94A3B8] font-light text-center leading-relaxed max-w-[280px]">
                Establishing a secure session with zero-trust infrastructure.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center w-full"
            >
              <div className="w-[64px] h-[64px] rounded-[20px] bg-red-500/10 border border-red-500/20 shadow-[0_8px_30px_rgba(239,68,68,0.15)] flex items-center justify-center mb-8">
                <AlertCircle className="w-[28px] h-[28px] text-red-400" strokeWidth={1.5} />
              </div>
              <h1 className="text-[20px] font-light tracking-wide text-[#E2E8F0] mb-3 text-center">Authentication Failed</h1>
              <p className="text-[14px] text-[#94A3B8] font-light text-center leading-relaxed max-w-[320px] mb-10">
                {error}
              </p>
              
              <Link href="/signin" className="w-full h-[54px] rounded-[16px] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] border border-white/[0.05] text-[#E2E8F0] font-medium text-[14px] tracking-wide flex items-center justify-center transition-all duration-300">
                Return to Sign In
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
