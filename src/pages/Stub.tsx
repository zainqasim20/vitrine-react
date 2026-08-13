import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { ThemeSwitch } from '../components/ThemeSwitch';

const TITLES: Record<string, { title: string; body: string; icon: string }> = {
  '/projects': { title: 'My Projects', body: 'Your dashboard of case studies — covers, status, and last-edited times — lands in a follow-up pass.', icon: 'ph ph-squares-four' },
  '/templates': { title: 'Templates', body: 'The full filterable template gallery lands in a follow-up pass. Presentation styles are already selectable from Create.', icon: 'ph ph-layout' },
  '/showcase': { title: 'Showcase', body: 'The public gallery of published case studies lands in a follow-up pass.', icon: 'ph ph-compass' },
  '/settings': { title: 'Settings', body: 'Profile, plan, and account settings land in a follow-up pass.', icon: 'ph ph-gear' },
};

export function Stub() {
  const location = useLocation();
  const def = TITLES[location.pathname] || { title: 'Coming soon', body: 'This part of Vitrine lands in a follow-up pass.', icon: 'ph ph-circle' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          padding: '16px 40px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Logo height={26} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ThemeSwitch />
          <Link to="/create" style={{ height: 40, padding: '0 16px', borderRadius: 10, background: 'var(--violet-gradient)', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
            Start a case study
          </Link>
        </div>
      </header>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 32px' }}>
        <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
          <span style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--surface-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={def.icon} style={{ fontSize: 26, color: 'var(--text-3)' }} />
          </span>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 32, letterSpacing: '-0.02em' }}>{def.title}</h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-2)' }}>{def.body}</p>
          <span
            style={{
              marginTop: 8,
              fontFamily: "'Geist Mono', monospace",
              fontSize: 11.5,
              letterSpacing: '0.04em',
              color: 'var(--text-3)',
            }}
          >
            Not built in this pass
          </span>
          <Link to="/" style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: 'var(--blue)' }}>
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
