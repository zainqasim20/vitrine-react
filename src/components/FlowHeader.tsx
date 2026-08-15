import type { CSSProperties } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { ThemeSwitch } from './ThemeSwitch';
import { useApp } from '../lib/store';

const navLinkStyle: CSSProperties = {
  height: 38,
  padding: '0 12px',
  border: 0,
  borderRadius: 10,
  background: 'transparent',
  color: 'var(--text-2)',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontWeight: 500,
  fontSize: 14,
  whiteSpace: 'nowrap',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  cursor: 'pointer',
  textDecoration: 'none',
};

export function FlowHeader() {
  const { state, actions } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const countLabel = state.files.length === 0 ? 'No screens yet' : `${state.files.length} ${state.files.length === 1 ? 'screen ready' : 'screens ready'}`;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px 20px',
        flexWrap: 'wrap',
        padding: '12px 24px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Logo height={24} />
        <span style={{ width: 1, height: 26, background: 'var(--border)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{state.projectName || 'Untitled project'}</span>
          <span
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: 11.5,
              letterSpacing: '0.04em',
              color: 'var(--text-3)',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <i className="ph-fill ph-cloud-check" style={{ fontSize: 13, color: 'var(--success)' }} />
            Saved automatically · just now
          </span>
        </div>
      </div>

      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {path === '/create' && (
          <span
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: 11.5,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--text-3)',
              whiteSpace: 'nowrap',
            }}
          >
            {countLabel}
          </span>
        )}

        {(path === '/classify' || path === '/design-system') && (
          <button type="button" onClick={() => navigate('/create')} style={{ ...navLinkStyle, padding: '0 8px', color: 'var(--text-3)' }}>
            <i className="ph ph-arrow-left" style={{ fontSize: 14 }} />
            Screens
          </button>
        )}

        {path === '/review' && (
          <button type="button" onClick={() => navigate('/create')} style={{ ...navLinkStyle, padding: '0 8px', color: 'var(--text-3)' }}>
            <i className="ph ph-arrow-left" style={{ fontSize: 14 }} />
            Back to uploads
          </button>
        )}

        {path === '/refine' && (
          <>
            <button
              type="button"
              onClick={() => navigate('/review')}
              title="Back to review"
              style={{ flex: 'none', width: 38, height: 38, border: 0, borderRadius: 10, background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <i className="ph ph-arrow-left" style={{ fontSize: 18 }} />
            </button>
            <button
              type="button"
              onClick={() => actions.goPreview()}
              style={{ ...navLinkStyle, border: '1px solid var(--border)' }}
            >
              <i className="ph ph-eye" style={{ fontSize: 16 }} />
              Preview
            </button>
            <button
              type="button"
              onClick={() => actions.copyMd()}
              title={state.copied ? 'Copied' : 'Copy as Markdown'}
              style={{ flex: 'none', width: 38, height: 38, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent', color: 'var(--text)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <i className={state.copied ? 'ph-fill ph-check-circle' : 'ph ph-clipboard-text'} style={{ fontSize: 18 }} />
            </button>
            <button
              type="button"
              onClick={() => actions.downloadMd()}
              title="Download .md"
              style={{ flex: 'none', width: 38, height: 38, border: '1px solid var(--border)', borderRadius: 10, background: 'transparent', color: 'var(--text)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <i className="ph ph-download-simple" style={{ fontSize: 18 }} />
            </button>
            <button
              type="button"
              onClick={() => actions.publish()}
              style={{ flex: 'none', height: 40, padding: '0 16px', border: 0, borderRadius: 10, background: 'var(--violet-gradient)', color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}
            >
              <i className="ph ph-paper-plane-tilt" style={{ fontSize: 17 }} />
              Publish
            </button>
          </>
        )}

        <span style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 2px' }} />
        <Link to="/projects" title="My Projects" style={navLinkStyle}>
          <i className="ph ph-squares-four" style={{ fontSize: 18 }} />
          My Projects
        </Link>
        <Link to="/templates" title="Templates" style={navLinkStyle}>
          <i className="ph ph-layout" style={{ fontSize: 18 }} />
          Templates
        </Link>
        <ThemeSwitch size={26} />
        <Link
          to="/settings"
          title="Your Name — profile & settings"
          style={{
            width: 34,
            height: 34,
            marginLeft: 2,
            border: '1px solid var(--border)',
            borderRadius: 999,
            background: 'var(--violet-light)',
            color: 'var(--violet-deep)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: 12,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
          }}
        >
          YN
        </Link>
      </div>
    </header>
  );
}
