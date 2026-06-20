import AboutSection from '@/components/AboutSection';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/cyber/PageTransition';

export const metadata = {
  title: 'About | MITRA VERIFY',
  description: 'Enterprise Face Liveness & Identity Verification Platform',
};

export default function AboutPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020617] text-slate-300 relative overflow-hidden">
        {/* Deep Background glow to match the site aesthetic */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00d4ff] rounded-full blur-[150px] opacity-10 pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#7c3aed] rounded-full blur-[150px] opacity-10 pointer-events-none" />
        
        {/* Global Navigation */}
        <div className="relative z-50">
          <Navbar />
        </div>

        {/* Content */}
        <main className="relative z-10 pt-20">
          <AboutSection />
        </main>
      </div>
    </PageTransition>
  );
}
