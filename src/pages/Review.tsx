import { useState } from 'react';
import { useApp } from '../lib/store';
import { DRAFTS, PALETTE, PATTERNS } from '../lib/data';
import { ClarifyingQuestion } from '../components/ClarifyingQuestion';

const TEMPLATES = ['Minimalist Grid', 'Story Scroll', 'Editorial Magazine'];

export function Review() {
  const { state, actions } = useApp();
  const [tplOpen, setTplOpen] = useState(false);

  const total = state.files.length;
  const idx = state.idx;
  const status = state.statuses[idx] || 'pending';
  const draft = DRAFTS[idx % DRAFTS.length];
  const canApprove = status === 'drafted';
  const approved = actions.approvedIndices();
  const allDecided = total > 0 && Array.from({ length: total }, (_, i) => state.statuses[i] || 'pending').every((s) => s === 'approved' || s === 'skipped');
  const hasExtraction = status === 'drafted' || status === 'approved';
  const pad = (n: number) => String(n).padStart(3, '0');

  return (
    <main style={{ flex: 1, padding: '48px 32px 96px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              onClick={() => actions.prev()}
              title="Previous screen"
              disabled={idx <= 0}
              style={navBtn(idx > 0)}
            >
              <i className="ph ph-caret-left" style={{ fontSize: 14 }} />
            </button>
            <button
              type="button"
              onClick={() => actions.next()}
              title="Next screen"
              disabled={idx >= total - 1}
              style={{ ...navBtn(idx < total - 1), marginRight: 8 }}
            >
              <i className="ph ph-caret-right" style={{ fontSize: 14 }} />
            </button>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-2)' }}>
              No. {pad(idx + 1)} of {pad(total)} — {approved.length} approved
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {Array.from({ length: total }).map((_, i) => {
              const s = state.statuses[i] || 'pending';
              const on = i === idx;
              const bg = on ? 'var(--text)' : s === 'approved' ? 'var(--success-bg)' : s === 'error' ? 'var(--error-bg)' : s === 'skipped' ? 'var(--surface-3)' : 'var(--surface-2)';
              const fg = on ? 'var(--bg)' : s === 'approved' ? 'var(--success)' : s === 'error' ? 'var(--error)' : 'var(--text-3)';
              return (
                <button key={i} type="button" onClick={() => actions.goTo(i)} title={`Screen ${i + 1} — ${s}`} style={{ width: 28, height: 28, border: 0, borderRadius: 8, background: bg, color: fg, fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {String(i + 1).padStart(2, '0')}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginTop: 24 }}>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-start', marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => setTplOpen((v) => !v)}
              style={{ height: 32, padding: '0 12px', border: `1px solid ${tplOpen ? 'var(--violet)' : 'var(--border)'}`, borderRadius: 999, background: tplOpen ? 'var(--violet-light)' : 'transparent', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <span style={{ color: 'var(--text-3)' }}>Template:</span>
              {state.template}
              <i className={tplOpen ? 'ph ph-caret-up' : 'ph ph-caret-down'} style={{ fontSize: 14, color: 'var(--text-3)' }} />
            </button>

            {tplOpen && (
              <div style={{ position: 'absolute', top: 40, left: 0, zIndex: 14, width: 420, padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', animation: 'v-in 200ms ease-out' }}>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Swap presentation style</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 12 }}>
                  {TEMPLATES.map((name) => {
                    const on = state.template === name;
                    return (
                      <div
                        key={name}
                        onClick={() => {
                          actions.pickTemplate(name);
                          setTplOpen(false);
                        }}
                        style={{ border: `1.5px solid ${on ? 'var(--violet)' : 'var(--border)'}`, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: on ? 'var(--violet-light)' : 'var(--surface)' }}
                      >
                        <div style={{ aspectRatio: '4 / 3', background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: 10 }} />
                        <div style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{name}</span>
                          <i className={on ? 'ph-fill ph-check-circle' : 'ph ph-circle'} style={{ fontSize: 15, color: on ? 'var(--violet-deep)' : 'var(--border-strong)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 32 }}>
            <div style={{ position: 'relative', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-2)', overflow: 'hidden', minHeight: 320 }}>
              <div style={{ position: 'absolute', inset: 24, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ height: '14%', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, padding: '0 4%' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-strong)' }} />
                  <span style={{ height: 6, width: '22%', background: 'var(--border)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '26% 1fr', height: '86%' }}>
                  <div style={{ borderRight: '1px solid var(--border)', padding: '6%', display: 'flex', flexDirection: 'column', gap: '10%' }}>
                    <span style={{ height: 6, background: 'var(--border)' }} />
                    <span style={{ height: 6, background: 'var(--border)' }} />
                    <span style={{ height: 6, width: '70%', background: 'var(--border)' }} />
                  </div>
                  <div style={{ padding: '6%', display: 'flex', flexDirection: 'column', gap: '6%' }}>
                    <span style={{ height: 12, width: '52%', background: '#14141A' }} />
                    <span style={{ height: 6, background: 'var(--border)' }} />
                    <span style={{ height: 6, width: '84%', background: 'var(--border)' }} />
                    <span style={{ height: '30%', background: 'var(--surface-3)', marginTop: '4%' }} />
                  </div>
                </div>
              </div>
              <span style={{ position: 'absolute', left: 12, top: 12, height: 24, padding: '0 10px', borderRadius: 999, background: '#14141A', color: '#FFFFFF', fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center' }}>
                {String(idx + 1).padStart(2, '0')}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
              {status === 'loading' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)' }}>Reading the screen and writing a section...</span>
                  <div style={shimmer(20, '52%')} />
                  <div style={shimmer(12, '100%')} />
                  <div style={shimmer(12, '92%')} />
                  <div style={shimmer(12, '74%')} />
                </div>
              )}

              {(status === 'drafted' || status === 'approved') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'v-in 300ms ease-out' }}>
                  <span style={{ height: 24, padding: '0 10px', borderRadius: 999, background: 'var(--coral-gradient)', color: '#FFFFFF', fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start' }}>
                    <i className="ph-fill ph-sparkle" style={{ fontSize: 13 }} />
                    AI draft
                  </span>
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 20, lineHeight: 1.3 }}>{draft.headline}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text)' }}>{draft.body}</p>
                </div>
              )}

              {status === 'error' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--error)', fontSize: 15, fontWeight: 700 }}>
                    <i className="ph-fill ph-warning-circle" style={{ fontSize: 20 }} />
                    This screen did not come back
                  </span>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-2)' }}>
                    The file resolved too low to read reliably, so nothing was written rather than guessed. Regenerate, or replace it with a higher-resolution export.
                  </p>
                </div>
              )}

              {status === 'skipped' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', color: 'var(--text-3)', fontSize: 13, fontWeight: 700 }}>
                  <i className="ph ph-minus-circle" style={{ fontSize: 18 }} />
                  Skipped — left out of the case study
                </span>
              )}
            </div>
          </div>

          {hasExtraction && (
            <button
              type="button"
              onClick={() => actions.askFollowUp()}
              style={{ alignSelf: 'flex-start', marginTop: 20, height: 34, padding: '0 12px', border: '1px solid var(--border)', borderRadius: 999, background: 'transparent', color: 'var(--text-2)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}
            >
              <i className="ph-fill ph-sparkle" style={{ fontSize: 13, color: 'var(--violet)' }} />
              Vitrine has one question about this screen
              <i className="ph ph-arrow-right" style={{ fontSize: 13 }} />
            </button>
          )}

          {hasExtraction && (
            <>
              <div style={{ marginTop: 24, border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>What we found in your design</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, letterSpacing: '0.04em', color: 'var(--text-3)' }}>Extracted, not inferred</span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {PALETTE.map((hex) => (
                    <div key={hex} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ width: 64, height: 44, borderRadius: 10, border: '1px solid var(--border)', background: hex, display: 'block' }} />
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, letterSpacing: '0.04em', color: 'var(--text-2)' }}>{hex}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 48, lineHeight: 1, letterSpacing: '-0.03em' }}>Aa</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>Geometric sans · Semibold 600</span>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, letterSpacing: '0.04em', color: 'var(--text-3)' }}>Headings −3% tracking · Body 400 / 1.6</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                  {PATTERNS.map((p) => (
                    <span key={p.label} style={{ height: 28, padding: '0 12px', border: '1px solid var(--border)', borderRadius: 999, background: 'var(--surface-2)', color: 'var(--text-2)', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <i className={p.icon} style={{ fontSize: 14, color: 'var(--text-3)' }} />
                      {p.label}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 20, border: '1px solid #FDD8CE', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16, background: 'var(--surface)' }}>
                <span style={{ flex: 'none', height: 24, padding: '0 10px', borderRadius: 999, background: 'var(--coral-gradient)', color: '#FFFFFF', fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <i className="ph ph-lightbulb" style={{ fontSize: 13 }} />
                  AI-suggested
                </span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 15, lineHeight: 1.6 }}>Signup deferral of this kind typically recovers 20–30% of first-run drop-off.</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, letterSpacing: '0.04em', color: 'var(--text-3)' }}>Not visible in the upload — verify before publishing</span>
                </div>
                <div style={{ flex: 'none', display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => actions.editSuggestion()} title="Edit" style={miniIconBtn()}>
                    <i className="ph ph-pencil-simple" style={{ fontSize: 15 }} />
                  </button>
                  <button type="button" onClick={() => actions.dropSuggestion()} title="Remove" style={miniIconBtn()}>
                    <i className="ph ph-x" style={{ fontSize: 15 }} />
                  </button>
                </div>
              </div>
            </>
          )}

          {status === 'drafted' && idx === 1 && !state.fuOff && (
            <div style={{ marginTop: 20, border: '1px solid var(--border)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, animation: 'v-in 240ms ease-out' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ height: 22, padding: '0 8px', borderRadius: 999, background: 'var(--violet-light)', color: 'var(--violet-deep)', fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <i className="ph ph-question" style={{ fontSize: 12 }} />
                  Low confidence
                </span>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>Was the empty state a deliberate call, or a constraint you inherited?</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Deliberate', 'Inherited constraint', 'A bit of both'].map((label) => {
                  const on = state.fuAns === label;
                  return (
                    <button key={label} type="button" onClick={() => actions.answerFollowUp(label)} style={{ height: 34, padding: '0 14px', border: `1px solid ${on ? 'var(--violet)' : 'var(--border)'}`, borderRadius: 999, background: on ? 'var(--violet-light)' : 'transparent', color: on ? 'var(--violet-deep)' : 'var(--text-2)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>
                      {label}
                    </button>
                  );
                })}
                <button type="button" onClick={() => actions.dismissFollowUp()} style={{ height: 34, padding: '0 12px', border: 0, borderRadius: 999, background: 'transparent', color: 'var(--text-3)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>
                  Skip this
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => actions.approve()}
              style={{ height: 48, minWidth: 132, padding: '0 24px', border: 0, borderRadius: 10, background: canApprove ? 'var(--violet-gradient)' : 'var(--surface-3)', color: canApprove ? '#FFFFFF' : 'var(--text-3)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
            >
              {status === 'approved' ? 'Approved' : 'Approve'}
            </button>
            <button
              type="button"
              onClick={() => actions.regenerate()}
              style={{ height: 48, padding: '0 20px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'transparent', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
            >
              Regenerate
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Not relevant to this case study?</span>
          <button
            type="button"
            onClick={() => actions.skip()}
            style={{ height: 32, padding: '0 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-2)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <i className="ph ph-minus-circle" style={{ fontSize: 15 }} />
            Skip this screen
          </button>
        </div>

        {allDecided && (
          <div style={{ marginTop: 40, border: '1px solid var(--border)', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', gap: 8, animation: 'v-in 300ms ease-out' }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
              Review complete · {approved.length} {approved.length === 1 ? 'section approved' : 'sections approved'}
            </span>
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 28, lineHeight: 1.2, letterSpacing: '-0.02em' }}>Both of these are finished.</h3>
            <p style={{ margin: '0 0 12px', fontSize: 15, lineHeight: 1.6, color: 'var(--text-2)', maxWidth: '56ch' }}>
              Publish what you approved as it stands, or open the editor if you want to art-direct it first. Editing is optional.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, maxWidth: 640 }}>
              <button
                type="button"
                onClick={() => actions.finish()}
                style={{ minHeight: 96, padding: 20, border: 0, borderRadius: 12, background: 'var(--violet-gradient)', color: '#FFFFFF', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 17, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <i className="ph-fill ph-check-circle" style={{ fontSize: 20 }} />
                  Approve &amp; finish
                </span>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, letterSpacing: '0.04em', opacity: 0.86 }}>Publish the approved sections</span>
              </button>
              <button
                type="button"
                onClick={() => actions.goRefine()}
                style={{ minHeight: 96, padding: 20, border: '1.5px solid var(--border)', borderRadius: 12, background: 'transparent', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 17, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <i className="ph ph-sliders-horizontal" style={{ fontSize: 20 }} />
                  Refine in the editor
                </span>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, letterSpacing: '0.04em', color: 'var(--text-3)' }}>Type, crops, motion</span>
              </button>
            </div>
          </div>
        )}
      </div>
      <ClarifyingQuestion />
    </main>
  );
}

function navBtn(enabled: boolean) {
  return {
    width: 28,
    height: 28,
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: 'transparent',
    color: enabled ? 'var(--text-2)' : 'var(--border-strong)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: enabled ? 'pointer' : 'default',
  } as const;
}

function shimmer(height: number, width: string) {
  return {
    height,
    width,
    borderRadius: 8,
    background: 'linear-gradient(90deg, var(--surface-2) 0%, var(--surface-3) 40%, var(--surface-2) 80%)',
    backgroundSize: '420px 100%',
    animation: 'v-shimmer 1.4s linear infinite',
  } as const;
}

function miniIconBtn() {
  return {
    width: 30,
    height: 30,
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: 'transparent',
    color: 'var(--text-2)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  } as const;
}
