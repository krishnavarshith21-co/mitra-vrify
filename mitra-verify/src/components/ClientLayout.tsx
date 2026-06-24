'use client';
import Footer from '@/components/Footer';
import dynamic from 'next/dynamic';

const Global3DBackground = dynamic(() => import('@/components/cyber/Global3DBackground'), { 
  ssr: false 
});

/**
 * Client-side layout wrapper that includes components requiring hooks/state.
 * Mounted inside the server-side RootLayout.
 */
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Global3DBackground />
      <div className="flex-1 flex flex-col min-h-screen">
        {children}
      </div>
      <Footer />
    </>
  );
}
