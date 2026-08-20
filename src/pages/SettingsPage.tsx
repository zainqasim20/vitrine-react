import type { CSSProperties } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../lib/store';

const fieldLabel: CSSProperties = { fontSize: 13, fontWeight: 500, color: 'var(--text-2)' };
const readonlyInput: CSSProperties = {
  height: 42,
  padding: '0 14px',
  border: '1.5px solid var(--border)',
  borderRadius: 10,
  background: 'var(--surface-2)',
  color: 'var(--text)',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: 14,
};

export function SettingsPage() {
  const { state, actions } = useApp();
  const location = useLocation();
  const isUsage = location.pathname === '/usage';
  const used = state.projects.filter((p) => !p.deletedAt).length;
  const limit = 5;
  const pct = Math.min(100, Math.round((used / limit) * 100));

  const tabs: ('Profile' | 'Plan')[] = ['Profile', 'Plan'];

  return (
    <>
      <h1 style={{ margin: '0 0 24px', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 28 }}>{isUsage ? 'Usage & plan' : 'Settings'}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '160px minmax(0, 1fr)', gap: 32 }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => actions.setSettingsTab(t)}
              style={{
                textAlign: 'left',
                height: 36,
                padding: '0 12px',
                border: 0,
                borderRadius: 8,
                background: state.settingsTab === t ? 'var(--violet-light)' : 'transparent',
                color: state.settingsTab === t ? 'var(--on-violet-light)' : 'var(--text-2)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: state.settingsTab === t ? 700 : 500,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
        </nav>

        {state.settingsTab === 'Profile' ? (
          <div style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 18 }}>Profile</h2>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={fieldLabel}>Name</span>
              <input type="text" readOnly defaultValue="Your Name" style={readonlyInput} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={fieldLabel}>Email</span>
              <input type="email" readOnly defaultValue="you@example.com" style={readonlyInput} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={fieldLabel}>Workspace name</span>
              <input type="text" readOnly defaultValue="Northwind" style={readonlyInput} />
            </label>
            <button
              type="button"
              onClick={() => actions.logout()}
              style={{ alignSelf: 'flex-start', height: 40, padding: '0 16px', border: '1px solid var(--border)', borderRadius: 10, background: 'transparent', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <i className="ph ph-sign-out" style={{ fontSize: 16 }} />
              Log out
            </button>
          </div>
        ) : (
          <div style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 18 }}>Plan &amp; usage</h2>
            <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Free</span>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>$0 / month</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>Up to 20 screens per case study, unlimited drafts.</p>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={fieldLabel}>Case studies saved</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {used} of {limit}
                </span>
              </div>
              <span style={{ height: 5, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden', display: 'block' }}>
                <span style={{ height: '100%', display: 'block', borderRadius: 999, background: 'var(--violet-gradient)', width: `${pct}%` }} />
              </span>
            </div>
            <button
              type="button"
              onClick={() => actions.say('Upgrade flow is not wired up in this build')}
              style={{ height: 42, border: 0, borderRadius: 10, background: 'var(--violet-gradient)', color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >
              Upgrade plan
            </button>
          </div>
        )}
      </div>
    </>
  );
}
