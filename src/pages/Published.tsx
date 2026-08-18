import { useApp } from '../lib/store';
import { DRAFTS } from '../lib/data';

export function Published() {
  const { state, actions } = useApp();
  const approved = actions.approvedIndices();
  const allOn = approved.length > 0 && approved.every((i) => state.dlSel[i] !== false);
  const selCount = approved.filter((i) => state.dlSel[i] !== false).length;

  return (
    <main style={{ flex: 1, padding: '64px 32px 96px', background: 'var(--surface-2)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ height: 28, padding: '0 12px', borderRadius: 999, background: 'var(--success-bg)', color: 'var(--success)', fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i className="ph-fill ph-check-circle" style={{ fontSize: 14 }} />
            Published
          </span>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 40, lineHeight: 1.1, letterSpacing: '-0.03em' }}>{state.title || 'Untitled case study'}</h1>
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            {approved.length} {approved.length === 1 ? 'section' : 'sections'} · {state.template}
          </span>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Pages · {selCount} selected</span>
            <button type="button" onClick={() => actions.toggleDlAll()} style={{ border: 0, background: 'transparent', padding: 0, color: 'var(--blue)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {allOn ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {approved.map((i) => {
              const on = state.dlSel[i] !== false;
              const draft = DRAFTS[i % DRAFTS.length];
              return (
                <div key={i} onClick={() => actions.toggleDlSel(i)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer' }}>
                  <span style={{ flex: 'none', width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${on ? 'var(--violet)' : 'var(--border)'}`, background: on ? 'var(--violet)' : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {on && <i className="ph-fill ph-check" style={{ fontSize: 12, color: '#FFFFFF' }} />}
                  </span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{draft.headline}</span>
                </div>
              );
            })}
            {approved.length === 0 && <span style={{ fontSize: 14, color: 'var(--text-3)' }}>No sections approved yet.</span>}
          </div>
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Download as</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            {[
              { label: 'Markdown', meta: 'case-study.md', icon: 'ph ph-file-md', go: actions.downloadMd },
              { label: 'HTML page', meta: 'case-study.html', icon: 'ph ph-file-html', go: actions.downloadHtml },
              { label: 'Plain text', meta: 'case-study.txt', icon: 'ph ph-file-text', go: actions.downloadTxt },
            ].map((e) => (
              <button
                key={e.label}
                type="button"
                onClick={() => e.go()}
                style={{ padding: 16, border: '1.5px solid var(--border)', borderRadius: 12, background: 'transparent', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <i className={e.icon} style={{ fontSize: 22, color: 'var(--violet-deep)' }} />
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{e.label}</span>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, letterSpacing: '0.04em', color: 'var(--text-3)' }}>{e.meta}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '46ch' }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Publish to Vitrine Showcase</span>
            <span style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--text-2)' }}>Puts this case study on your public profile in the Showcase, where clients and peers can browse it.</span>
          </div>
          {state.published ? (
            <span style={{ height: 44, padding: '0 20px', borderRadius: 10, background: 'var(--success-bg)', color: 'var(--success)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <i className="ph-fill ph-check-circle" style={{ fontSize: 17 }} />
              Live on Showcase
            </span>
          ) : (
            <button
              type="button"
              onClick={() => actions.publishToShowcase()}
              style={{ height: 44, padding: '0 20px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'transparent', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <i className="ph ph-compass" style={{ fontSize: 17 }} />
              Publish to Showcase
            </button>
          )}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '46ch' }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Keep it in your account</span>
            <span style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--text-2)' }}>Already autosaved. Sending it to My Projects makes it the live version you can share or come back to.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => actions.goRefine()}
              style={{ height: 44, padding: '0 16px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'transparent', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <i className="ph ph-sliders-horizontal" style={{ fontSize: 17 }} />
              Keep editing
            </button>
            <button
              type="button"
              onClick={() => actions.saveToAccount()}
              style={{ height: 44, padding: '0 20px', border: 0, borderRadius: 10, background: 'var(--violet-gradient)', color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <i className="ph ph-folder-simple-plus" style={{ fontSize: 17 }} />
              Save to My Projects
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
