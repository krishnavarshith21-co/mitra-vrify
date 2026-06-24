import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import ClientLayout from '@/components/ClientLayout';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MITRA VERIFY — Enterprise Face Liveness & Identity Verification',
  description:
    'Open source enterprise-grade face liveness detection, anti-spoof, and identity verification API platform. Free for everyone.',
  keywords:
    'face liveness detection, anti-spoof, identity verification, biometric API, continuous authentication, deepfake detection',
  openGraph: {
    title: 'MITRA VERIFY',
    description:
      'Enterprise Face Liveness, Identity Verification & Continuous Authentication',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const isProduction = process.env.NODE_ENV === 'production';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const isApiUrlMissing = !apiUrl;
  const isProductionLocalhost = isProduction && apiUrl && (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1'));

  if (isApiUrlMissing || isProductionLocalhost) {
    const errorTitle = isApiUrlMissing ? "Configuration Error: API URL Missing" : "Security Error: Localhost in Production";
    const errorMessage = isApiUrlMissing 
      ? "The NEXT_PUBLIC_API_URL environment variable is missing. The frontend application cannot start without a valid backend endpoint."
      : "The NEXT_PUBLIC_API_URL environment variable is pointing to localhost or 127.0.0.1 in a production build, which is strictly prohibited.";

    return (
      <html lang="en">
        <body style={{ background: '#030712', color: '#f3f4f6', fontFamily: 'system-ui, sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, padding: 20 }}>
          <div style={{ maxWidth: 520, width: '100%', padding: 32, borderRadius: 16, background: '#111827', border: '1px solid #ef4444', textAlign: 'center', boxShadow: '0 10px 30px rgba(239, 68, 68, 0.15)' }}>
            <div style={{ fontSize: 48, color: '#ef4444', marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#f9fafb' }}>{errorTitle}</h1>
            <p style={{ color: '#9ca3af', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
              {errorMessage}
            </p>
            <div style={{ background: '#1f2937', padding: '14px 18px', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, color: '#f87171', textAlign: 'left', overflowX: 'auto', border: '1px solid #374151' }}>
              <div><strong>Environment:</strong> {process.env.NODE_ENV || 'undefined'}</div>
              <div style={{ marginTop: 6 }}><strong>NEXT_PUBLIC_API_URL:</strong> {apiUrl || 'undefined'}</div>
            </div>
            <p style={{ color: '#6b7280', fontSize: 12, marginTop: 24, lineHeight: 1.5 }}>
              Please configure <strong>NEXT_PUBLIC_API_URL</strong> in your hosting dashboard (e.g. Vercel Project Settings) and trigger a redeployment.
            </p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} noise`}>
        <AuthProvider>
          {/* ErrorBoundary catches render-time crashes */}
          <ErrorBoundary>
            <ClientLayout>
              {children}
            </ClientLayout>
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
