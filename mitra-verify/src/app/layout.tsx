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
