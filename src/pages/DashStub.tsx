import { useLocation } from 'react-router-dom';

// Honest stub pages -- Brand kit and Help & docs are real navigation
// destinations that lead nowhere fake: labelled plainly as not built yet,
// the same pattern the real site itself uses for these two routes.
const STUBS: Record<string, { title: string; body: string; icon: string }> = {
  '/brand': { title: 'Brand kit', body: 'Fonts, colors, and logo lockups Vitrine would reuse across every case study you make.', icon: 'ph ph-palette' },
  '/help': { title: 'Help & docs', body: 'Guides for uploading, reviewing, and publishing.', icon: 'ph ph-book-open' },
};

export function DashStub() {
  const location = useLocation();
  const s = STUBS[location.pathname] || { title: '', body: '', icon: 'ph ph-circle' };
  return (
    <>
      <h1 style={{ margin: '0 0 6px', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 28 }}>{s.title}</h1>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text-2)' }}>{s.body}</p>
      <div
        style={{
          border: '1px dashed var(--border)',
          borderRadius: 16,
          padding: '56px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <i className={s.icon} style={{ fontSize: 30, color: 'var(--text-3)' }} />
        <span
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 11.5,
            fontWeight: 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
          }}
        >
          Not built in this prototype
        </span>
      </div>
    </>
  );
}
