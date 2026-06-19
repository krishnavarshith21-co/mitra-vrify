'use client';
import Link from 'next/link';
import { MessageCircle, Briefcase, Eye, ArrowUpRight } from 'lucide-react';

const footerLinks = {
  Platform: [
    { label: 'Fast Liveness API', href: '/compare#basic' },
    { label: 'Advanced Anti-Spoof', href: '/compare#advanced' },
    { label: 'Enterprise Identity', href: '/compare#enterprise' },
    { label: 'API Comparison', href: '/compare' },
  ],
  Developers: [
    { label: 'Documentation', href: '/docs' },
    { label: 'Developer Portal', href: '/developer' },
    { label: 'API Reference', href: '/docs/api' },
    { label: 'SDKs & Libraries', href: '/docs/sdks' },
  ],
  Demos: [
    { label: 'Basic Demo', href: '/demo/basic' },
    { label: 'Advanced Demo', href: '/demo/advanced' },
    { label: 'Enterprise Demo', href: '/demo/enterprise' },
  ],
  Project: [
    { label: 'MIT License', href: '/license' },
    { label: 'Contact', href: '/contact' },
    { label: 'Admin', href: '/admin' },
  ],
};

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-subtle)',
      marginTop: 'auto',
      padding: '64px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 1280,
        margin: '0 auto',
      }}>
        {/* Top Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 40,
          marginBottom: 64,
        }}
          className="sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
        >
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2" style={{ maxWidth: 320 }}>
            <Link href="/" style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
            }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #00d4ff, #0066ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Eye size={17} color="#fff" />
              </div>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#f8fafc' }}>
                MITRA <span className="gradient-text-cyan">VERIFY</span>
              </span>
            </Link>
            <p style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: 24,
            }}>
              Enterprise-grade biometric verification APIs. Open source, free for everyone, MIT licensed.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { icon: MessageCircle, href: 'https://MessageCircle.com' },
                { icon: Briefcase, href: 'https://Briefcase.com' },
              ].map(({ icon: Icon, href }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#94a3b8',
                    transition: 'all 0.2s ease',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(0,212,255,0.25)';
                    e.currentTarget.style.color = '#00d4ff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#475569',
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                marginBottom: 16,
              }}>
                {section}
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {links.map(link => (
                  <li key={link.label}>
                    {'external' in link && (link as any).external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 14,
                          color: '#94a3b8',
                          textDecoration: 'none',
                          transition: 'color 0.2s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f8fafc')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                      >
                        {link.label} <ArrowUpRight size={12} />
                      </a>
                    ) : (
                      <Link href={link.href}
                        style={{
                          fontSize: 14,
                          color: '#94a3b8',
                          textDecoration: 'none',
                          transition: 'color 0.2s ease',
                        }}
                        onMouseEnter={e => ((e.target as HTMLElement).style.color = '#f8fafc')}
                        onMouseLeave={e => ((e.target as HTMLElement).style.color = '#94a3b8')}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 32,
          display: 'flex',
          flexWrap: 'wrap' as const,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}>
          <p style={{ fontSize: 13, color: '#475569' }}>
            © 2024 MITRA VERIFY. Open source under MIT License. No subscriptions. No fees. Free forever.
          </p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{
              fontSize: 12,
              padding: '4px 12px',
              borderRadius: 20,
              background: 'rgba(0, 255, 136, 0.06)',
              color: '#00ff88',
              border: '1px solid rgba(0, 255, 136, 0.15)',
              fontWeight: 600,
            }}>
              ● Open Source
            </span>
            <span style={{ fontSize: 13, color: '#475569' }}>MIT License</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
