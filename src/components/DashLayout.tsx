import type { CSSProperties, ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../lib/store';

const CRUMBS: Record<string, string> = {
  '/projects': 'Workspace / My Projects',
  '/templates': 'Workspace / Templates',
  '/brand': 'Workspace / Brand kit',
  '/usage': 'Account / Usage & plan',
  '/settings': 'Account / Settings',
  '/trash': 'Workspace / Trash',
  '/help': 'Help',
};

const navBtnStyle = (active: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  height: 38,
  padding: '0 12px',
  border: 0,
  borderRadius: 10,
  width: '100%',
  background: active ? 'var(--violet-light)' : 'transparent',
  color: active ? 'var(--violet-deep)' : 'var(--text-2)',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontWeight: active ? 700 : 500,
  fontSize: 14,
  cursor: 'pointer',
  textDecoration: 'none',
});

function NavBtn({ to, icon, label, count }: { to: string; icon: string; label: string; count?: string | null }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} style={navBtnStyle(active)}>
      <i className={icon} style={{ fontSize: 17, flex: 'none' }} />
      <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
      {count != null && (
        <span
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 11,
            color: active ? 'var(--violet-deep)' : 'var(--text-3)',
            background: active ? '#FFFFFF' : 'var(--surface-3)',
            borderRadius: 999,
            minWidth: 20,
            height: 20,
            padding: '0 6px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

export function DashLayout() {
  const { state, actions } = useApp();
  const location = useLocation();
  const used = state.projects.filter((p) => !p.deletedAt).length;
  const limit = 5;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const crumb = CRUMBS[location.pathname] || 'Workspace';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)', color: 'var(--text)' }}>
      <aside
        style={{
          flex: 'none',
          width: 240,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: '20px 14px',
          borderRight: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <Link to="/projects" style={{ display: 'inline-flex', padding: '4px 10px 20px' }}>
          <img src="/assets/vitrine-logo.svg" alt="Vitrine — my projects" style={{ height: 22, width: 'auto' }} />
        </Link>

        <button
          type="button"
          onClick={() => actions.openNewProject()}
          style={{
            height: 42,
            marginBottom: 16,
            border: 0,
            borderRadius: 10,
            background: 'var(--violet-gradient)',
            color: '#FFFFFF',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <i className="ph ph-plus" style={{ fontSize: 16 }} />
          New project
        </button>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavBtn to="/projects" icon="ph ph-squares-four" label="My Projects" count={String(used)} />
          <NavBtn to="/templates" icon="ph ph-layout" label="Templates" />
          <NavBtn to="/brand" icon="ph ph-palette" label="Brand kit" />
        </nav>

        <span style={{ height: 1, background: 'var(--border)', margin: '16px 10px' }} />
        <span
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
            padding: '0 10px 8px',
          }}
        >
          Account
        </span>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavBtn to="/usage" icon="ph ph-chart-line-up" label="Usage & plan" />
          <NavBtn to="/settings" icon="ph ph-gear" label="Settings" />
          <NavBtn to="/trash" icon="ph ph-trash" label="Trash" />
          <NavBtn to="/help" icon="ph ph-book-open" label="Help & docs" />
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Free plan</span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: 'var(--text-2)' }}>
                {used} / {limit}
              </span>
            </div>
            <span style={{ height: 5, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden', display: 'block' }}>
              <span style={{ height: '100%', display: 'block', borderRadius: 999, background: 'var(--violet-gradient)', width: `${pct}%` }} />
            </span>
            <button
              type="button"
              onClick={() => actions.goUsage()}
              style={{ border: 0, background: 'transparent', padding: 0, color: 'var(--violet)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12.5, cursor: 'pointer', textAlign: 'left' }}
            >
              Upgrade
            </button>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            flex: 'none',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, letterSpacing: '0.03em', color: 'var(--text-3)' }}>{crumb}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => actions.goHelp()}
              title="Help"
              style={{ width: 34, height: 34, border: '1px solid var(--border)', borderRadius: 999, background: 'transparent', color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <i className="ph ph-question" style={{ fontSize: 16 }} />
            </button>
            <button
              type="button"
              onClick={() => actions.goSettings()}
              title="Account & settings"
              style={{
                width: 34,
                height: 34,
                border: '1px solid var(--border)',
                borderRadius: 999,
                background: 'var(--violet-light)',
                color: 'var(--violet-deep)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              ZQ
            </button>
          </div>
        </div>
        <main style={{ flex: 1, padding: '40px 32px 80px' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>

      {state.npOpen && <NewProjectModal />}
    </div>
  );
}

function NewProjectModal() {
  const { actions } = useApp();
  return (
    <div
      onClick={() => actions.closeNewProject()}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(20,20,26,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 520, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', padding: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 20 }}>Start a new project</h2>
          <button
            type="button"
            onClick={() => actions.closeNewProject()}
            title="Close"
            style={{ width: 30, height: 30, border: 0, borderRadius: 8, background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <i className="ph ph-x" style={{ fontSize: 18 }} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <NewProjectOption
            icon="ph ph-cloud-arrow-up"
            title="Upload screens, write it yourself"
            desc="Drop real screenshots and write a headline and body for each one — nothing generated, nothing guessed."
            onClick={() => actions.npUpload()}
          />
          <NewProjectOption
            icon="ph ph-squares-four"
            title="Start from a template"
            desc="Browse presentation styles first, then bring your own screens into the one you pick."
            onClick={() => actions.npTemplate()}
          />
        </div>
      </div>
    </div>
  );
}

function NewProjectOption({ icon, title, desc, onClick }: { icon: string; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 16,
        border: '1.5px solid var(--border)',
        borderRadius: 12,
        background: 'transparent',
        cursor: 'pointer',
      }}
    >
      <i className={icon} style={{ fontSize: 22, color: 'var(--violet)' }} />
      <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>
      <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-2)' }}>{desc}</span>
    </button>
  );
}

export function DashEmpty({ icon, title, body, action }: { icon: string; title: string; body: string; action?: ReactNode }) {
  return (
    <div
      style={{
        border: '1px dashed var(--border)',
        borderRadius: 16,
        padding: '56px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 10,
      }}
    >
      <i className={icon} style={{ fontSize: 30, color: 'var(--text-3)' }} />
      <h3 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 18 }}>{title}</h3>
      <p style={{ margin: '0 0 8px', fontSize: 14, lineHeight: 1.6, color: 'var(--text-2)', maxWidth: '38ch' }}>{body}</p>
      {action}
    </div>
  );
}
