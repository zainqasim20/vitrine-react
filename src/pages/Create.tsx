import { useRef, type CSSProperties } from 'react';
import { useApp } from '../lib/store';

export function Create() {
  const { state, actions } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasFiles = state.files.length > 0;

  const onFilesChosen = (fileList: FileList | null) => {
    if (!fileList) return;
    actions.addFiles(Array.from(fileList));
  };

  return (
    <main style={{ flex: 1, padding: '56px 32px 96px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <h1 style={{ margin: '0 0 8px', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 36, lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: '24ch' }}>
          Turn a screen into a portfolio project
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: 17, lineHeight: 1.6, color: 'var(--text-2)', maxWidth: '62ch' }}>
          Drop your screens, tell Vitrine what you're going for, and pick a presentation style. Nothing is published until you approve it.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)', gap: 32, alignItems: 'start' }}>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              hidden
              onChange={(e) => {
                onFilesChosen(e.target.files);
                e.target.value = '';
              }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onFilesChosen(e.dataTransfer.files);
              }}
              className="dropzone"
              style={{
                border: '1.5px dashed var(--border)',
                borderRadius: 16,
                padding: '48px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <i className="ph ph-cloud-arrow-up" style={{ fontSize: 32, color: 'var(--violet)' }} />
              <span style={{ fontSize: 17, fontWeight: 700 }}>Drop screens here or click to browse</span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                PNG · JPG · WEBP — up to 20 files, 10 MB each
              </span>
            </div>

            {hasFiles && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14, marginTop: 24 }}>
                {state.files.map((f, i) => (
                  <div
                    key={f.id}
                    onMouseEnter={() => actions.setHoverThumb(f.id)}
                    onMouseLeave={() => actions.setHoverThumb(null)}
                    style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                  >
                    <div style={{ position: 'relative', aspectRatio: '16 / 10', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-2)', overflow: 'hidden' }}>
                      {f.url && <img src={f.url} alt={f.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                      <span style={{ position: 'absolute', left: 8, top: 8, height: 24, padding: '0 10px', borderRadius: 999, background: '#14141A', color: '#FFFFFF', fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {actions.hoverThumb === f.id && (
                        <button
                          type="button"
                          onClick={() => actions.removeFile(f.id)}
                          style={{ position: 'absolute', right: 8, top: 8, width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <i className="ph ph-x" style={{ fontSize: 16 }} />
                        </button>
                      )}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  </div>
                ))}
              </div>
            )}

            {hasFiles && (
              <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                    Notes to yourself (optional)
                  </span>
                  <button type="button" onClick={() => actions.skipBrief()} style={{ border: 0, background: 'transparent', padding: 0, color: 'var(--blue)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    Clear
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>What is this project for?</span>
                    <input
                      type="text"
                      value={state.briefA}
                      onChange={(e) => actions.setBriefA(e.target.value)}
                      placeholder="e.g. The onboarding checklist"
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>What's the one thing to highlight?</span>
                    <input
                      type="text"
                      value={state.briefB}
                      onChange={(e) => actions.setBriefB(e.target.value)}
                      placeholder="e.g. Cutting setup from 12 steps to 3"
                      style={inputStyle}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, border: '1px solid var(--border)', borderRadius: 16, padding: 24, background: 'var(--surface-2)' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                Project name <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span>
              </span>
              <input type="text" value={state.projectName} onChange={(e) => actions.setProjectName(e.target.value)} placeholder="e.g. Northwind onboarding" style={inputStyle} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                Brief the tool <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span>
              </span>
              <textarea
                value={state.prompt}
                onChange={(e) => actions.setPrompt(e.target.value)}
                rows={3}
                placeholder="What kind of portfolio do you want? e.g. Editorial, calm tone, lead with the outcome"
                style={{ ...inputStyle, height: 'auto', padding: '12px 14px', lineHeight: 1.5, resize: 'vertical' }}
              />
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
              {hasFiles ? `${state.files.length} ${state.files.length === 1 ? 'screen ready' : 'screens ready'}` : 'No screens yet'}
            </span>
            <button
              type="button"
              onClick={() => actions.openQuestions()}
              style={{ height: 30, padding: '0 12px', border: '1px solid var(--border)', borderRadius: 999, background: 'transparent', color: 'var(--text-2)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <i className="ph-fill ph-sparkle" style={{ fontSize: 12, color: 'var(--violet)' }} />
              Vitrine has 5 optional questions
            </button>
          </div>
          {hasFiles ? (
            <button
              type="button"
              onClick={() => actions.generate()}
              style={{ height: 48, minWidth: 120, padding: '0 24px', border: 0, borderRadius: 10, background: 'var(--violet-gradient)', color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
            >
              Generate drafts
            </button>
          ) : (
            <span style={{ height: 48, minWidth: 120, padding: '0 24px', borderRadius: 10, background: 'var(--surface-3)', color: 'var(--text-3)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              Generate drafts
            </span>
          )}
        </div>
      </div>
    </main>
  );
}

const inputStyle: CSSProperties = {
  height: 44,
  padding: '0 14px',
  border: '1.5px solid var(--border)',
  borderRadius: 10,
  background: 'var(--surface)',
  color: 'var(--text)',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: 14,
  outline: 'none',
};
