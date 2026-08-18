import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, type AppActions } from '../lib/store';
import { DRAFTS, JOURNEY, MOTION_PRESETS, MOTION_TRIGGERS, PALETTE, PATTERNS } from '../lib/data';
import type { AppState, CanvasSection, SceneTreatment } from '../lib/types';
import type { DesignSystemSheet } from '../lib/pipeline/types';
import { NarrationIntro } from '../components/NarrationIntro';

const SPEED_SCALE: Record<string, number> = { '0.5x': 2, '1x': 1, '1.5x': 0.7, '2x': 0.5 };
const EASE_CSS: Record<string, string> = { Linear: 'linear', Ease: 'ease-in-out', Bounce: 'cubic-bezier(.34,1.56,.64,1)' };
const DIR_CSS: Record<string, string> = { Forward: 'normal', Reverse: 'reverse', Alternate: 'alternate' };
const COVERS = ['Bold statement', 'Card breakdown', 'Image-forward'];
const LAYOUT_OPTS = [
  { key: 'grid', icon: 'ph ph-grid-four', title: 'Grid layout' },
  { key: 'editorial', icon: 'ph ph-columns', title: 'Editorial layout' },
  { key: 'list', icon: 'ph ph-rows', title: 'List layout' },
] as const;

function typeOf(id: string | null): 'text' | 'image' | 'shape' | null {
  if (!id) return null;
  if (id === 'logo') return 'shape';
  if (id.includes('img')) return 'image';
  return 'text';
}

function stop(e: React.MouseEvent) {
  e.stopPropagation();
}

export function Refine() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const approved = actions.approvedIndices();

  if (approved.length === 0) {
    return (
      <main style={{ flex: 1, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '96px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
          <i className="ph ph-stack-simple" style={{ fontSize: 24, color: 'var(--text-3)' }} />
          <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 28, lineHeight: 1.2, letterSpacing: '-0.02em' }}>Nothing approved yet</h3>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-2)', maxWidth: '48ch' }}>
            There's no draft to art-direct until at least one section is approved. Your screens and drafts are saved — pick up where you left off.
          </p>
          <button
            type="button"
            onClick={() => navigate('/review')}
            style={{ marginTop: 12, height: 48, padding: '0 24px', border: 0, borderRadius: 10, background: 'var(--violet-gradient)', color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <i className="ph ph-arrow-left" style={{ fontSize: 18 }} />
            Back to review
          </button>
        </div>
      </main>
    );
  }

  // Real content when the pipeline actually ran (Design System sheet +
  // canvas sections from Present) -- the mock DRAFTS/PALETTE/PATTERNS path
  // stays exactly as it was before this pipeline existed otherwise.
  const usingRealSections = state.apiStatus.gemini;
  const realSections: CanvasSection[] | null = usingRealSections ? actions.canvasSections() : null;
  const realFeatureSections = realSections?.filter((sec) => sec.kind !== 'design-system') || null;
  // Computed once per render from the project's own real extracted colors +
  // category, then reused for every Key Features frame below -- see
  // sceneTreatment()'s comment in store.tsx for why that guarantees
  // consistency across frames rather than needing to enforce it here.
  const scene = usingRealSections ? actions.sceneTreatment() : null;

  const sel = state.sel;
  const kind = typeOf(sel);
  const selName = sel === 'logo' ? 'Northwind mark' : kind === 'image' ? 'Screen image' : 'Selected element';
  const selSize = sel ? actions.sizeOf(sel) : { w: 560, h: 315 };

  const baseDur = 2.2 * SPEED_SCALE[state.speed];
  const motionDef = MOTION_PRESETS.find((m) => m.name === state.motion);
  const liveAnim = state.motion === 'Keep static' ? 'none' : `${motionDef?.keyframe || 'v-static'} ${baseDur.toFixed(2)}s ${EASE_CSS[state.ease]} ${state.loop ? 'infinite' : '1'} ${DIR_CSS[state.dir]} both`;
  const durMs = Math.round(baseDur * 1000);

  function resizer(id: string, dx: number, dy: number) {
    return (e: ReactPointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const sx = e.clientX;
      const sy = e.clientY;
      const s0 = actions.sizeOf(id);
      const lock = state.lock;
      const mv = (ev: PointerEvent) => {
        const mx = ev.clientX - sx;
        const my = ev.clientY - sy;
        let w = dx ? Math.max(240, Math.min(624, s0.w + dx * mx)) : s0.w;
        let h = dy ? Math.max(160, Math.min(480, s0.h + dy * my)) : s0.h;
        if (lock) {
          const a = s0.w / s0.h;
          if (dx) h = w / a;
          else w = h * a;
        }
        actions.setSize(id, w, h);
      };
      const up = () => {
        window.removeEventListener('pointermove', mv);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', mv);
      window.addEventListener('pointerup', up);
    };
  }

  const fits = state.prevLay === 'list';
  const editorial = state.prevLay === 'editorial';

  return (
    <main onClick={() => actions.deselect()} style={{ flex: 1, position: 'relative', background: 'var(--surface-2)', padding: '48px 24px 140px' }}>
      <div style={{ width: 720, maxWidth: '100%', margin: '0 auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 48 }}>
        <div onClick={stop} style={{ position: 'relative', marginBottom: 8 }}>
          <input
            value={state.title}
            onChange={(e) => actions.setTitle(e.target.value)}
            onFocus={() => actions.select('title')}
            placeholder="Untitled case study"
            style={{
              width: '100%',
              border: `1.5px solid ${state.sel === 'title' ? 'transparent' : 'transparent'}`,
              borderRadius: 8,
              background: 'transparent',
              padding: '4px 8px',
              margin: '-4px -8px',
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 600,
              fontSize: 40,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: 'var(--text)',
              outline: 'none',
            }}
          />
          {state.sel === 'title' && (
            <span style={pickTag(-22)}>Title</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <span style={mono()}>Overview</span>
          <span style={{ flex: 'none', width: 24, height: 1, background: 'var(--border)' }} />
          <span style={mono()}>Case study · {approved.length} {approved.length === 1 ? 'section' : 'sections'}</span>
          <span style={{ flex: 'none', width: 24, height: 1, background: 'var(--border)' }} />
          <div onClick={(e) => { stop(e); actions.select('logo'); }} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: `1.5px solid ${state.sel === 'logo' ? 'transparent' : 'transparent'}`, borderRadius: 10, cursor: 'pointer' }}>
            <span style={{ width: 24, height: 24, borderRadius: 8, background: 'var(--violet-gradient)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ph-fill ph-sparkle" style={{ fontSize: 14, color: '#FFFFFF' }} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Northwind</span>
            <i className="ph-fill ph-play-circle" style={{ fontSize: 14, color: 'var(--violet)' }} />
            {state.sel === 'logo' && (
              <>
                <span style={{ position: 'absolute', inset: -1.5, border: '1.5px solid var(--violet)', borderRadius: 10, boxShadow: '0 0 0 4px rgba(122,71,245,0.12)', pointerEvents: 'none' }} />
                <span style={pickTag(-22)}>Logo mark</span>
              </>
            )}
          </div>
        </div>

        {/* Outcome framing moved to the real Closing section below, where it
            reads as an actual closing statement instead of duplicating the
            same paragraph twice on one page -- only the problem statement
            stays up here as the intro. */}
        {usingRealSections && state.pipeline.narration && (
          <NarrationIntro
            problemLabel={state.pipeline.narration.problemLabel}
            problemStatement={state.pipeline.narration.problemStatement}
            outcomeLabel=""
            outcomeFraming=""
          />
        )}

        <SectionRule label="Design system" />
        {usingRealSections && state.pipeline.designSystemSheet ? (
          <RealDesignSystemBlock sheet={state.pipeline.designSystemSheet} />
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 48 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {PALETTE.map((hex) => (
                <div key={hex} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ width: 72, height: 48, borderRadius: 10, border: '1px solid var(--border)', background: hex, display: 'block' }} />
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, letterSpacing: '0.04em', color: 'var(--text-2)' }}>{hex}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 56, lineHeight: 1, letterSpacing: '-0.03em' }}>Aa</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Geometric sans · Semibold 600</span>
                <span style={mono()}>Headings −3% tracking · Body 400 / 1.6</span>
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
        )}

        <SectionRule label="Key features" />
        <div style={state.prevLay === 'grid' ? { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 32 } : { display: 'block' }}>
          {usingRealSections
            ? realFeatureSections!.map((sec, i) => (
                // A real image section and an adjacent AI-generated one used
                // to blend into what looked like one contradictory block
                // (a real screenshot immediately followed by "no screen
                // uploaded"). Each frame after the first now gets a real
                // divider, so every real/generated boundary is unambiguous.
                <div key={sec.id} style={i > 0 ? { borderTop: '1px solid var(--border)', paddingTop: 32 } : undefined}>
                  {sec.kind === 'generated' ? (
                    <GeneratedSectionBlock label={sec.label} headline={sec.headline} body={sec.body} editorial={editorial} scene={scene!} />
                  ) : (
                    <RealImageSectionBlock
                      id={sec.id}
                      fileUrl={sec.file.url}
                      fileName={sec.file.name}
                      headline={sec.headline}
                      body={sec.body}
                      fits={fits}
                      editorial={editorial}
                      state={state}
                      actions={actions}
                      sel={sel}
                      resizer={resizer}
                      scene={scene!}
                    />
                  )}
                </div>
              ))
            : approved.map((i) => {
                const id = `s${i}`;
                const d = DRAFTS[i % DRAFTS.length];
                const sz = actions.sizeOf(id);
                const hovered = state.hover === id;
                const selImg = sel === `${id}-img`;
                const selHead = sel === `${id}-head`;
                const selBody = sel === `${id}-body`;

                return (
                  <div
                    key={id}
                    onMouseEnter={() => actions.setHover(id)}
                    onMouseLeave={() => actions.setHover(null)}
                    style={{ position: 'relative', paddingBottom: 48, ...(editorial ? { display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 28, alignItems: 'start' } : {}) }}
                  >
                    {hovered && (
                      <span style={{ position: 'absolute', top: 2, left: -34, width: 24, height: 32, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', cursor: 'grab', background: 'var(--surface-2)' }}>
                        <i className="ph ph-dots-six-vertical" style={{ fontSize: 18 }} />
                      </span>
                    )}

                    <div onClick={(e) => { stop(e); actions.select(`${id}-img`); }} style={{ position: 'relative', marginBottom: 24, cursor: 'pointer', gridRow: editorial ? 'span 2' : 'auto' }}>
                      <div
                        style={{
                          position: 'relative',
                          width: fits ? sz.w : '100%',
                          height: sz.h,
                          maxWidth: '100%',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          background: 'var(--surface-2)',
                          overflow: 'hidden',
                          filter: `brightness(${state.adjB}%) contrast(${state.adjC}%) saturate(${state.adjS}%)`,
                        }}
                      >
                        <div style={{ position: 'absolute', inset: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4 }}>
                          <div style={{ height: 32, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px' }}>
                            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--border)' }} />
                            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--border)' }} />
                            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--border)' }} />
                          </div>
                          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <span style={{ display: 'block', height: 12, width: '48%', background: '#14141A' }} />
                            <span style={{ display: 'block', height: 7, background: 'var(--border)' }} />
                            <span style={{ display: 'block', height: 7, width: '82%', background: 'var(--border)' }} />
                            <span style={{ display: 'block', height: 7, width: '64%', background: 'var(--border)' }} />
                            <span style={{ display: 'block', height: 28, width: 108, borderRadius: 8, background: 'rgba(122,71,245,0.16)', marginTop: 8 }} />
                          </div>
                        </div>
                      </div>

                      {selImg && (
                        <>
                          <span style={{ ...pickTag(-26), whiteSpace: 'nowrap' }}>Screenshot · {sz.w} × {sz.h}</span>
                          {!fits && <span style={{ position: 'absolute', top: -1.5, left: -1.5, right: -1.5, height: sz.h + 3, border: '1.5px solid var(--violet)', borderRadius: 10, pointerEvents: 'none' }} />}
                          {fits && (
                            <>
                              <span style={{ position: 'absolute', top: -1.5, left: -1.5, width: sz.w + 3, height: sz.h + 3, border: '1.5px solid var(--violet)', borderRadius: 10, pointerEvents: 'none' }} />
                              {handleSpots(sz).map((h) => (
                                <span key={h.key} onPointerDown={resizer(`${id}-img`, h.dx, h.dy)} style={{ position: 'absolute', top: h.top, left: h.left, width: 10, height: 10, border: '1.5px solid var(--violet)', borderRadius: 2, background: 'var(--surface)', cursor: h.cursor }} />
                              ))}
                            </>
                          )}
                        </>
                      )}
                    </div>

                    <div onClick={(e) => { stop(e); actions.select(`${id}-head`); }} style={{ position: 'relative', cursor: 'pointer', marginBottom: 12 }}>
                      <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 28, lineHeight: 1.2, letterSpacing: '-0.02em' }}>{d.headline}</h3>
                      {selHead && (
                        <>
                          <span style={{ position: 'absolute', inset: '-6px -8px', border: '1.5px solid var(--violet)', borderRadius: 8, boxShadow: '0 0 0 4px rgba(122,71,245,0.12)', pointerEvents: 'none' }} />
                          <span style={{ ...pickTag(-28), whiteSpace: 'nowrap' }}>Headline · H2</span>
                        </>
                      )}
                    </div>

                    <div onClick={(e) => { stop(e); actions.select(`${id}-body`); }} style={{ position: 'relative', cursor: 'pointer' }}>
                      <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--text-2)' }}>{d.body}</p>
                      {selBody && (
                        <>
                          <span style={{ position: 'absolute', inset: '-6px -8px', border: '1.5px solid var(--violet)', borderRadius: 8, boxShadow: '0 0 0 4px rgba(122,71,245,0.12)', pointerEvents: 'none' }} />
                          <span style={{ ...pickTag(-28), whiteSpace: 'nowrap' }}>Body</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
        </div>

        <SectionRule label="User journey" />
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, marginBottom: 48, flexWrap: 'wrap' }}>
          {JOURNEY.map((j, i) => (
            <div key={j.label} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <div style={{ width: 168, border: '1px solid var(--border)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ height: 64, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{j.label}</span>
                <span style={mono()}>{j.step}</span>
              </div>
              {i < JOURNEY.length - 1 && <i className="ph ph-arrow-right" style={{ fontSize: 16, color: 'var(--border-strong)', margin: '0 12px' }} />}
            </div>
          ))}
        </div>

        <SectionRule label="Highlights" marginBottom={16} />
        <div style={{ border: '1.5px dashed var(--border)', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
          <span style={{ fontSize: 15, color: 'var(--text-3)' }}>Nothing here yet. This section stays out of the published page until you add to it.</span>
          <button type="button" onClick={() => actions.addHighlight()} style={{ height: 36, padding: '0 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i className="ph ph-plus" style={{ fontSize: 14 }} />
            Add a highlight
          </button>
        </div>

        {/* Real pipeline: closing is Narrate's outcome framing -- the part
            of the labeled output that's actually a closing statement, not
            the fake "Northwind shipped..." mock. Omitted entirely (no
            dangling "Closing" divider) while narration hasn't resolved yet,
            same never-blocks honesty as the intro block. Untouched mock
            fallback when the pipeline never ran (no Gemini key). */}
        {(!usingRealSections || state.pipeline.narration?.outcomeFraming) && (
          <>
            <SectionRule label="Closing" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 24 }}>
              {usingRealSections && state.pipeline.narration ? (
                <>
                  {state.pipeline.narration.outcomeLabel && <span style={mono()}>{state.pipeline.narration.outcomeLabel}</span>}
                  <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--text-2)', maxWidth: '60ch' }}>{state.pipeline.narration.outcomeFraming}</p>
                </>
              ) : (
                <>
                  <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 28, lineHeight: 1.2, letterSpacing: '-0.02em' }}>Northwind shipped in eleven weeks.</h3>
                  <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--text-2)', maxWidth: '60ch' }}>Written and art-directed by the designer who did the work. Reach out if you want the longer version.</p>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <div style={{ width: 720, maxWidth: '100%', margin: '20px auto 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={mono()}>Cover variants</span>
          <span style={{ height: 20, padding: '0 8px', borderRadius: 999, background: 'var(--violet-gradient)', color: '#FFFFFF', fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <i className="ph-fill ph-sparkle" style={{ fontSize: 11 }} />
            AI-generated
          </span>
          <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={mono()}>Template · {state.template}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
          {COVERS.map((name, i) => {
            const on = state.cover === i;
            return (
              <div key={name} onClick={() => actions.setCover(i)} style={{ border: `1.5px solid ${on ? 'var(--violet)' : 'var(--border)'}`, borderRadius: 12, overflow: 'hidden', background: 'var(--surface)', cursor: 'pointer' }}>
                <div style={{ position: 'relative', aspectRatio: '16 / 9', overflow: 'hidden', background: i === 0 ? 'var(--violet-gradient)' : i === 1 ? '#F4F6FB' : 'linear-gradient(160deg, #BEDFD7 0%, #8FC4BA 100%)' }} />
                <div style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {state.layers && (
        <div onClick={stop} style={{ position: 'fixed', left: 24, bottom: 96, zIndex: 12, width: 300, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid var(--border)' }}>
            <span style={mono()}>Layers</span>
            <button type="button" onClick={() => actions.toggleLayers()} style={{ width: 40, height: 40, margin: -8, border: 0, borderRadius: 10, background: 'transparent', color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <i className="ph ph-x" style={{ fontSize: 16 }} />
            </button>
          </div>
          <div style={{ maxHeight: 340, overflow: 'auto', padding: 8 }}>
            {layerRows(approved).map((l) => {
              const on = sel === l.id;
              return (
                <div key={l.id} onClick={() => actions.select(l.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: `0 8px 0 ${l.indent}px`, borderRadius: 8, cursor: 'pointer', background: on ? 'var(--violet-light)' : 'transparent' }}>
                  <i className={l.icon} style={{ fontSize: 16, color: on ? 'var(--violet-deep)' : 'var(--text-3)', flex: 'none' }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: l.indent > 8 ? 500 : 700, color: on ? 'var(--violet-deep)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</span>
                  {l.motion && (
                    <span style={{ height: 20, padding: '0 8px', borderRadius: 999, background: 'var(--violet-light)', color: 'var(--violet-deep)', fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4, flex: 'none' }}>
                      <i className="ph-fill ph-play-circle" style={{ fontSize: 12 }} />
                      Motion
                    </span>
                  )}
                  <i className="ph ph-eye" style={{ fontSize: 16, color: 'var(--text-3)', flex: 'none' }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {kind === 'text' && !state.studio && (
        <div onClick={stop} style={{ position: 'fixed', right: 24, bottom: 96, zIndex: 12, width: 340, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
          <TabBar tabs={['Font', 'Style', 'Align', 'AI rewrite']} active={state.textTab} onPick={actions.setTextTab} />
          {state.textTab === 'Font' && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={mono()}>Typeface</span>
                {[
                  { name: 'Bricolage Grotesque', stack: "'Bricolage Grotesque', sans-serif", role: 'Display' },
                  { name: 'Plus Jakarta Sans', stack: "'Plus Jakarta Sans', sans-serif", role: 'UI / body' },
                ].map((f) => {
                  const on = state.font === f.name;
                  return (
                    <div key={f.name} onClick={() => actions.setFont(f.name)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, height: 48, padding: '0 12px', border: `1.5px solid ${on ? 'var(--violet)' : 'var(--border)'}`, borderRadius: 10, cursor: 'pointer' }}>
                      <span style={{ fontFamily: f.stack, fontSize: 17, fontWeight: 600 }}>{f.name}</span>
                      <span style={mono()}>{f.role}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={mono()}>Size</span>
                  <div style={{ display: 'flex', alignItems: 'center', height: 40, border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                    <button type="button" onClick={() => actions.sizeDown()} style={stepBtn()}><i className="ph ph-minus" style={{ fontSize: 14 }} /></button>
                    <span style={{ flex: 1, textAlign: 'center', fontFamily: "'Geist Mono', monospace", fontSize: 13 }}>{state.fontSize} px</span>
                    <button type="button" onClick={() => actions.sizeUp()} style={stepBtn()}><i className="ph ph-plus" style={{ fontSize: 14 }} /></button>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={mono()}>Weight</span>
                  <div style={{ display: 'flex', height: 40, border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                    {['Regular', 'Medium', 'Semibold'].map((w) => {
                      const on = state.weight === w;
                      return (
                        <button key={w} type="button" onClick={() => actions.setWeight(w)} style={{ flex: 1, border: 0, background: on ? 'var(--violet-light)' : 'transparent', color: on ? 'var(--violet-deep)' : 'var(--text-2)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          {w}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={mono()}>Line height</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, color: 'var(--text-2)' }}>{(state.lead / 100).toFixed(2)}</span>
                </div>
                <input type="range" min={100} max={180} value={state.lead} onChange={(e) => actions.setLead(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--violet)' }} />
              </div>
            </div>
          )}
          {state.textTab === 'Style' && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={mono()}>Colour</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { name: 'Ink', value: 'var(--text)' },
                    { name: 'Secondary', value: 'var(--text-2)' },
                    { name: 'Violet', value: 'var(--violet)' },
                    { name: 'Tertiary', value: 'var(--text-3)' },
                  ].map((c) => (
                    <button key={c.name} type="button" title={c.name} onClick={() => actions.setColor(c.name)} style={{ width: 40, height: 40, border: `1.5px solid ${state.color === c.name ? 'var(--violet)' : 'var(--border)'}`, borderRadius: 10, background: c.value, cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={mono()}>Emphasis</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { name: 'None', icon: 'ph ph-text-t' },
                    { name: 'Bold', icon: 'ph ph-text-b' },
                    { name: 'Italic', icon: 'ph ph-text-italic' },
                  ].map((e) => {
                    const on = state.emph === e.name;
                    return (
                      <button key={e.name} type="button" onClick={() => actions.setEmph(e.name)} style={{ width: 40, height: 40, border: 0, borderRadius: 10, background: on ? 'var(--violet-light)' : '#FAFAFA', color: on ? 'var(--violet-deep)' : 'var(--text-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <i className={e.icon} style={{ fontSize: 18 }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {state.textTab === 'Align' && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={mono()}>Alignment</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { name: 'Left', icon: 'ph ph-text-align-left' },
                  { name: 'Center', icon: 'ph ph-text-align-center' },
                  { name: 'Right', icon: 'ph ph-text-align-right' },
                ].map((a) => {
                  const on = state.align === a.name;
                  return (
                    <button key={a.name} type="button" onClick={() => actions.setAlign(a.name)} style={{ flex: 1, height: 40, border: 0, borderRadius: 10, background: on ? 'var(--violet-light)' : '#FAFAFA', color: on ? 'var(--violet-deep)' : 'var(--text-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <i className={a.icon} style={{ fontSize: 18 }} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {state.textTab === 'AI rewrite' && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ph-fill ph-sparkle" style={{ fontSize: 14, color: 'var(--violet)' }} />
                <span style={mono()}>Rewrite the selected text</span>
              </div>
              <textarea
                value={state.rwPrompt}
                onChange={(e) => actions.setRwPrompt(e.target.value)}
                rows={2}
                placeholder="Shorter, less jargon, keep the numbers"
                style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 10, background: 'transparent', padding: '10px 12px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, lineHeight: 1.5, color: 'var(--text)', outline: 'none', resize: 'none' }}
              />
              <button type="button" onClick={() => actions.runRewrite()} style={{ height: 40, border: 0, borderRadius: 10, background: 'var(--violet-gradient)', color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Rewrite
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <span style={mono()}>Three options</span>
                {[
                  'Progress made legible, one screen at a time.',
                  'Each upload becomes a numbered step with its own status.',
                  'A sequence, not a percentage bar.',
                ].map((text, i) => (
                  <button key={i} type="button" onClick={() => actions.pickRewrite(i)} style={{ padding: '10px 12px', border: `1.5px solid ${state.rwPick === i ? 'var(--violet)' : 'var(--border)'}`, borderRadius: 10, background: state.rwPick === i ? 'var(--violet-light)' : 'transparent', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, lineHeight: 1.5, textAlign: 'left', cursor: 'pointer' }}>
                    {text}
                  </button>
                ))}
                <span style={mono()}>Applied text is tagged AI-suggested</span>
              </div>
            </div>
          )}
        </div>
      )}

      {kind === 'image' && !state.studio && (
        <div onClick={stop} style={{ position: 'fixed', right: 24, bottom: 96, zIndex: 12, width: 340, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
          <TabBar tabs={['Crop & reposition', 'Adjust']} active={state.imgTab} onPick={actions.setImgTab} />
          {state.imgTab === 'Adjust' && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                { label: 'Brightness', val: state.adjB, set: actions.setAdjB },
                { label: 'Contrast', val: state.adjC, set: actions.setAdjC },
                { label: 'Saturation', val: state.adjS, set: actions.setAdjS },
              ].map((a) => (
                <div key={a.label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={mono()}>{a.label}</span>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, color: 'var(--text-2)' }}>{a.val}%</span>
                  </div>
                  <input type="range" min={40} max={160} value={a.val} onChange={(e) => a.set(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--violet)' }} />
                </div>
              ))}
              <button type="button" onClick={() => actions.resetAdj()} style={resetBtn()}>
                <i className="ph ph-arrow-counter-clockwise" style={{ fontSize: 16 }} />
                Reset adjustments
              </button>
            </div>
          )}
          {state.imgTab === 'Crop & reposition' && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={mono()}>W</span>
                  <input value={selSize.w} onChange={(e) => actions.setW(Number(e.target.value))} style={numInput()} />
                </div>
                <button type="button" onClick={() => actions.toggleLock()} style={{ width: 40, height: 40, border: 0, borderRadius: 10, background: state.lock ? 'var(--violet-light)' : '#FAFAFA', color: state.lock ? 'var(--violet-deep)' : 'var(--text-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <i className={state.lock ? 'ph-fill ph-lock-simple' : 'ph ph-lock-simple-open'} style={{ fontSize: 16 }} />
                </button>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={mono()}>H</span>
                  <input value={selSize.h} onChange={(e) => actions.setH(Number(e.target.value))} style={numInput()} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={mono()}>Aspect ratio</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['Free', '16:9', '4:3', '1:1'].map((label) => {
                    const on = state.ratio === label;
                    return (
                      <button key={label} type="button" onClick={() => actions.setRatio(label)} style={{ height: 32, padding: '0 12px', border: `1.5px solid ${on ? 'var(--violet)' : 'var(--border)'}`, borderRadius: 999, background: on ? 'var(--violet-light)' : 'transparent', color: on ? 'var(--violet-deep)' : 'var(--text-2)', fontFamily: "'Geist Mono', monospace", fontSize: 11.5, letterSpacing: '0.04em', cursor: 'pointer' }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button type="button" onClick={() => actions.resetImg()} style={resetBtn()}>
                <i className="ph ph-arrow-counter-clockwise" style={{ fontSize: 16 }} />
                Reset size
              </button>
              <span style={mono()}>Drag any handle on the canvas</span>
            </div>
          )}
        </div>
      )}

      {state.studio && (kind === 'shape' || kind === 'image') && (
        <div onClick={stop} style={{ position: 'fixed', right: 24, top: 88, bottom: 96, zIndex: 12, width: 420, display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', overflow: 'hidden', animation: 'v-in 220ms ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 20, letterSpacing: '-0.02em' }}>Motion Studio</span>
              <span style={mono()}>{selName} · {state.motion}</span>
            </div>
            <button type="button" onClick={() => actions.closeStudio()} style={{ width: 32, height: 32, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <i className="ph ph-x" style={{ fontSize: 16 }} />
            </button>
          </div>

          <div style={{ position: 'relative', height: 200, flex: 'none', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <span key={state.replayKey} style={{ width: 76, height: 76, borderRadius: 20, background: 'var(--violet-gradient)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', animation: liveAnim }}>
              <i className="ph-fill ph-sparkle" style={{ fontSize: 34, color: '#FFFFFF' }} />
            </span>
            <span style={{ position: 'absolute', left: 16, bottom: 14, ...(mono() as CSSProperties) }}>{durMs}ms · {state.ease.toLowerCase()} · {state.dir.toLowerCase()}</span>
            <button type="button" onClick={() => actions.replay()} title="Replay" style={{ position: 'absolute', right: 14, bottom: 12, height: 32, padding: '0 12px', border: '1px solid var(--border)', borderRadius: 999, background: 'var(--surface)', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <i className="ph ph-arrow-clockwise" style={{ fontSize: 15 }} />
              Replay
            </button>
          </div>

          <TabBar tabs={['Suggested', 'Customize', 'Trigger']} active={state.mTab} onPick={actions.setMTab} />

          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {state.mTab === 'Suggested' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)' }}>
                  Read from the selected {kind === 'image' ? 'image' : 'mark'}. Pick by watching, not by reading.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                  {MOTION_PRESETS.map((m) => {
                    const on = state.motion === m.name;
                    const stat = m.name === 'Keep static';
                    return (
                      <div key={m.name} onClick={() => actions.applyMotion(m.name)} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, border: `1.5px solid ${on ? 'var(--violet)' : 'var(--border)'}`, borderRadius: 10, cursor: 'pointer', background: on ? 'var(--violet-light)' : 'transparent' }}>
                        <span style={{ height: 72, borderRadius: 8, background: 'var(--surface-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          <span style={{ width: 26, height: 26, borderRadius: 8, background: stat ? '#F3F3F5' : 'var(--violet-gradient)', border: stat ? '1.5px solid var(--border)' : 0, animation: stat ? 'none' : `${m.keyframe} 2.2s ease-in-out infinite` }} />
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{m.name}</span>
                          <i className={on ? 'ph-fill ph-check-circle' : 'ph ph-play'} style={{ fontSize: 16, color: on ? 'var(--violet-deep)' : 'var(--text-3)' }} />
                        </div>
                        <span style={mono()}>{m.meta}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {state.mTab === 'Customize' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <Segmented label="Speed" options={['0.5x', '1x', '1.5x', '2x']} value={state.speed} onPick={actions.setSpeed} />
                <Segmented label="Direction" options={['Forward', 'Reverse', 'Alternate']} value={state.dir} onPick={actions.setDir} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>Loop</span>
                    <span style={mono()}>{state.loop ? 'Repeats forever' : 'Plays once'}</span>
                  </div>
                  <ToggleSwitch on={state.loop} onClick={() => actions.toggleLoop()} />
                </div>
                <button type="button" onClick={() => actions.toggleAdv()} style={{ height: 40, padding: '0 12px', border: '1px solid var(--border)', borderRadius: 10, background: 'transparent', color: 'var(--text-2)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  {state.adv ? 'Hide advanced' : 'Advanced — easing, keyframes'}
                  <i className={state.adv ? 'ph ph-caret-up' : 'ph ph-caret-down'} style={{ fontSize: 14 }} />
                </button>
                {state.adv && (
                  <>
                    <Segmented label="Easing" options={['Linear', 'Ease', 'Bounce']} value={state.ease} onPick={actions.setEase} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                        <span style={mono()}>Keyframes</span>
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, color: 'var(--text-2)' }}>{['Start', 'Mid', 'End'][state.kf]} · {Math.round(durMs * (state.kf / 2))}ms</span>
                      </div>
                      <div style={{ position: 'relative', height: 56, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
                        <span style={{ position: 'absolute', left: 16, right: 16, height: 2, background: 'var(--border)' }} />
                        <div style={{ position: 'relative', flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                          {['Start', 'Mid', 'End'].map((k, i) => (
                            <button key={k} type="button" title={k} onClick={() => actions.setKf(i)} style={{ width: 14, height: 14, border: `1.5px solid ${state.kf === i ? 'var(--violet)' : '#D3D3D8'}`, borderRadius: 3, background: state.kf === i ? 'var(--violet)' : '#FFFFFF', transform: 'rotate(45deg)', cursor: 'pointer', padding: 0 }} />
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Geist Mono', monospace", fontSize: 11.5, letterSpacing: '0.04em', color: 'var(--text-3)' }}>
                        <span>0ms</span>
                        <span>{Math.round(durMs / 2)}ms</span>
                        <span>{durMs}ms</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {state.mTab === 'Trigger' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)' }}>When the motion plays on the published page.</p>
                {MOTION_TRIGGERS.map((t) => {
                  const on = state.trigger === t.label;
                  return (
                    <button key={t.label} type="button" onClick={() => actions.setTrigger(t.label)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: `1.5px solid ${on ? 'var(--violet)' : 'var(--border)'}`, borderRadius: 10, background: on ? 'var(--violet-light)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                      <i className={t.icon} style={{ fontSize: 20, color: on ? 'var(--violet-deep)' : 'var(--text-3)' }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{t.label}</span>
                        <span style={mono()}>{t.meta}</span>
                      </div>
                      <i className={on ? 'ph-fill ph-check-circle' : 'ph ph-circle'} style={{ fontSize: 18, color: on ? 'var(--violet-deep)' : 'var(--text-3)' }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {state.fx && (
        <div onClick={stop} style={{ position: 'fixed', right: 24, top: 88, zIndex: 13, width: 380, maxHeight: 'calc(100% - 184px)', overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', animation: 'v-in 220ms ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 20, letterSpacing: '-0.02em' }}>Micro-interactions</span>
              <span style={mono()}>Applies to the whole page</span>
            </div>
            <button type="button" onClick={() => actions.closeFx()} style={{ flex: 'none', width: 32, height: 32, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <i className="ph ph-x" style={{ fontSize: 16 }} />
            </button>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Segmented label="Button feedback" options={['Scale', 'Color', 'Underline']} value={state.btnFx} onPick={actions.setBtnFx} />
            <Segmented label="Image hover" options={['Zoom', 'Lift', 'None']} value={state.imgFx} onPick={actions.setImgFx} />
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <span style={mono()}>Cursor</span>
                <span style={{ height: 20, padding: '0 8px', borderRadius: 999, background: 'var(--surface-3)', color: 'var(--text-2)', fontFamily: "'Geist Mono', monospace", fontSize: 11.5, letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center' }}>Flourish</span>
              </div>
              <Segmented options={['Default', 'Dot']} value={state.cursorFx} onPick={actions.setCursorFx} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Scroll reveal</span>
                <span style={mono()}>{state.reveal ? 'Sections fade up as they enter' : 'Sections appear immediately'}</span>
              </div>
              <ToggleSwitch on={state.reveal} onClick={() => actions.toggleReveal()} />
            </div>
            {state.reveal && <Segmented options={['Subtle', 'Normal']} value={state.revealAmt} onPick={actions.setRevealAmt} />}
          </div>
        </div>
      )}

      <div onClick={stop} style={{ position: 'fixed', left: 0, right: 0, bottom: 24, zIndex: 14, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 56, padding: '0 8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 999, boxShadow: 'var(--shadow-lg)', pointerEvents: 'auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: 3, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 999 }}>
            {LAYOUT_OPTS.map((o) => {
              const on = state.prevLay === o.key;
              return (
                <button key={o.key} type="button" title={o.title} onClick={() => actions.setPrevLay(o.key)} style={{ width: 34, height: 34, border: 0, borderRadius: 999, background: on ? 'var(--surface)' : 'transparent', color: on ? 'var(--violet-deep)' : 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <i className={o.icon} style={{ fontSize: 17 }} />
                </button>
              );
            })}
          </div>
          <span style={{ flex: 'none', width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />

          <ToolButton icon="ph ph-cursor" label="Select" active={!sel} onClick={() => actions.select(null)} />
          {kind === 'text' && <ToolButton icon="ph-fill ph-text-aa" label="Text" active emph onClick={() => {}} />}
          {kind === 'image' && <ToolButton icon="ph-fill ph-image" label="Image" active emph onClick={() => {}} />}
          {(kind === 'shape' || kind === 'image') && <ToolButton icon="ph-fill ph-play-circle" label="Motion" active={state.studio} emph onClick={() => actions.toggleStudio()} />}
          <ToolButton icon={state.layers ? 'ph-fill ph-stack-simple' : 'ph ph-stack-simple'} label="Layers" active={state.layers} onClick={() => actions.toggleLayers()} />
          <span style={{ flex: 'none', width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
          <ToolButton icon={state.more ? 'ph ph-x' : 'ph ph-dots-three'} label={state.more ? 'Close' : 'More'} active={state.more} onClick={() => actions.toggleMore()} />
          {state.more && (
            <>
              <ToolButton icon={state.fx ? 'ph-fill ph-cursor-click' : 'ph ph-cursor-click'} label="Interactions" active={state.fx} emph onClick={() => actions.toggleFx()} />
              <ToolButton icon="ph ph-arrow-counter-clockwise" label="Undo" onClick={() => actions.say('Nothing to undo')} />
              <ToolButton icon="ph ph-arrow-clockwise" label="Redo" onClick={() => actions.say('Nothing to redo')} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

// Real Design System block -- the actual extracted sheet from Extract,
// same fields as the editable Design System screen, read-only here.
function RealDesignSystemBlock({ sheet }: { sheet: DesignSystemSheet }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 48 }}>
      {sheet.colors.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {sheet.colors.slice(0, 8).map((c) => (
            <div key={c.hex} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ width: 72, height: 48, borderRadius: 10, border: '1px solid var(--border)', background: c.hex, display: 'block' }} title={c.role} />
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, letterSpacing: '0.04em', color: 'var(--text-2)' }}>{c.hex}</span>
            </div>
          ))}
        </div>
      )}
      {sheet.typography.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: sheet.colors.length ? 20 : 0, borderTop: sheet.colors.length ? '1px solid var(--border)' : 'none' }}>
          {sheet.typography.map((t) => (
            <div key={t.role} style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize', width: 64, flex: 'none' }}>{t.role}</span>
              <span style={mono()}>
                ~{t.approxPx}px{t.styleDescription ? ` · ${t.styleDescription}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
      {Object.entries(sheet.components).some(([, v]) => v.count > 0) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          {Object.entries(sheet.components)
            .filter(([, v]) => v.count > 0)
            .map(([k, v]) => (
              <span key={k} style={{ height: 28, padding: '0 12px', border: '1px solid var(--border)', borderRadius: 999, background: 'var(--surface-2)', color: 'var(--text-2)', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6, textTransform: 'capitalize' }}>
                {k} · {v.count}
              </span>
            ))}
        </div>
      )}
      {!sheet.colors.length && !sheet.typography.length && !Object.values(sheet.components).some((v) => v.count > 0) && (
        <span style={{ fontSize: 14, color: 'var(--text-3)' }}>Nothing was confidently extracted from these screens.</span>
      )}
    </div>
  );
}

// Present's generated placeholder for a required slot with no matching
// uploaded screen -- real content synthesized from the real design system
// sheet, always tagged so it's never mistaken for a real screenshot.
function GeneratedSectionBlock({ label, headline, body, editorial, scene }: { label: string; headline: string; body: string; editorial: boolean; scene: SceneTreatment }) {
  return (
    <div style={{ position: 'relative', paddingBottom: 48, ...(editorial ? { display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 28, alignItems: 'start' } : {}) }}>
      {/* No real screenshot to stage here, so only the Scene Construction
          Framework's Surface/color-grade layer applies (the project's real
          accent color, same as every other frame) -- the dashed border and
          "no screen uploaded" badge stay untouched so this never looks like
          a real, framed screenshot. */}
      <div style={{ position: 'relative', marginBottom: 24, height: 200, border: '1.5px dashed var(--border)', borderRadius: 10, background: scene.panelBackground, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, gridRow: editorial ? 'span 2' : 'auto' }}>
        <i className="ph ph-image-square" style={{ fontSize: 28, color: 'var(--text-3)' }} />
        <span style={{ height: 22, padding: '0 10px', borderRadius: 999, background: 'var(--violet-gradient)', color: '#FFFFFF', fontFamily: "'Geist Mono', monospace", fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <i className="ph-fill ph-sparkle" style={{ fontSize: 11 }} />
          AI-generated — no {label.toLowerCase()} screen uploaded
        </span>
      </div>
      <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 28, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 12 }}>{headline}</h3>
      <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--text-2)' }}>{body}</p>
    </div>
  );
}

// Real image section -- same select/resize mechanics as the mock path
// (sec.id already matches the 's<fileIdx>' convention those use), fed by
// the real uploaded screenshot and the real caption from Draft/Review.
function RealImageSectionBlock({
  id,
  fileUrl,
  fileName,
  headline,
  body,
  fits,
  editorial,
  state,
  actions,
  sel,
  resizer,
  scene,
}: {
  id: string;
  fileUrl?: string;
  fileName: string;
  headline: string;
  body: string;
  fits: boolean;
  editorial: boolean;
  state: AppState;
  actions: AppActions;
  sel: string | null;
  resizer: (id: string, dx: number, dy: number) => (e: ReactPointerEvent) => void;
  scene: SceneTreatment;
}) {
  const sz = actions.sizeOf(id);
  const hovered = state.hover === id;
  const selImg = sel === `${id}-img`;
  const selHead = sel === `${id}-head`;
  const selBody = sel === `${id}-body`;

  return (
    <div
      onMouseEnter={() => actions.setHover(id)}
      onMouseLeave={() => actions.setHover(null)}
      style={{ position: 'relative', paddingBottom: 48, ...(editorial ? { display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 28, alignItems: 'start' } : {}) }}
    >
      {hovered && (
        <span style={{ position: 'absolute', top: 2, left: -34, width: 24, height: 32, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', cursor: 'grab', background: 'var(--surface-2)' }}>
          <i className="ph ph-dots-six-vertical" style={{ fontSize: 18 }} />
        </span>
      )}

      {/* Scene Construction Framework's Surface (panel background) and
          Composition (generous negative space) layers, as a "mat" around
          the real screenshot. Deliberately NOT rotated (Angle layer) here,
          unlike Preview -- this is the interactive canvas, and the resize
          handles below are positioned in the same coordinate space as the
          image box, so a CSS rotate would rotate the handles out of sync
          with the pointer math. Preview (read-only) gets the real tilt. */}
      <div style={{ background: scene.panelBackground, borderRadius: 20, padding: scene.padding, marginBottom: 24, gridRow: editorial ? 'span 2' : 'auto' }}>
        <div onClick={(e) => { stop(e); actions.select(`${id}-img`); }} style={{ position: 'relative', cursor: 'pointer' }}>
          <div
            style={{
              position: 'relative',
              width: fits ? sz.w : '100%',
              height: sz.h,
              maxWidth: '100%',
              border: '1px solid var(--border)',
              borderRadius: 10,
              background: 'var(--surface-2)',
              overflow: 'hidden',
              boxShadow: scene.imageShadow,
              filter: `brightness(${state.adjB}%) contrast(${state.adjC}%) saturate(${state.adjS}%)`,
            }}
          >
            {fileUrl && <img src={fileUrl} alt={fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            {scene.glossy && (
              <span
                aria-hidden
                style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 42%)', pointerEvents: 'none' }}
              />
            )}
          </div>

          {selImg && (
            <>
              <span style={{ ...pickTag(-26), whiteSpace: 'nowrap' }}>Screenshot · {sz.w} × {sz.h}</span>
              {!fits && <span style={{ position: 'absolute', top: -1.5, left: -1.5, right: -1.5, height: sz.h + 3, border: '1.5px solid var(--violet)', borderRadius: 10, pointerEvents: 'none' }} />}
              {fits && (
                <>
                  <span style={{ position: 'absolute', top: -1.5, left: -1.5, width: sz.w + 3, height: sz.h + 3, border: '1.5px solid var(--violet)', borderRadius: 10, pointerEvents: 'none' }} />
                  {handleSpots(sz).map((h) => (
                    <span key={h.key} onPointerDown={resizer(`${id}-img`, h.dx, h.dy)} style={{ position: 'absolute', top: h.top, left: h.left, width: 10, height: 10, border: '1.5px solid var(--violet)', borderRadius: 2, background: 'var(--surface)', cursor: h.cursor }} />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div onClick={(e) => { stop(e); actions.select(`${id}-head`); }} style={{ position: 'relative', cursor: 'pointer', marginBottom: 12 }}>
        <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 28, lineHeight: 1.2, letterSpacing: '-0.02em' }}>{headline}</h3>
        {selHead && (
          <>
            <span style={{ position: 'absolute', inset: '-6px -8px', border: '1.5px solid var(--violet)', borderRadius: 8, boxShadow: '0 0 0 4px rgba(122,71,245,0.12)', pointerEvents: 'none' }} />
            <span style={{ ...pickTag(-28), whiteSpace: 'nowrap' }}>Headline · H2</span>
          </>
        )}
      </div>

      <div onClick={(e) => { stop(e); actions.select(`${id}-body`); }} style={{ position: 'relative', cursor: 'pointer' }}>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--text-2)' }}>{body}</p>
        {selBody && (
          <>
            <span style={{ position: 'absolute', inset: '-6px -8px', border: '1.5px solid var(--violet)', borderRadius: 8, boxShadow: '0 0 0 4px rgba(122,71,245,0.12)', pointerEvents: 'none' }} />
            <span style={{ ...pickTag(-28), whiteSpace: 'nowrap' }}>Body</span>
          </>
        )}
      </div>
    </div>
  );
}

function SectionRule({ label, marginBottom = 24 }: { label: string; marginBottom?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom }}>
      <span style={mono()}>{label}</span>
      <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

function TabBar({ tabs, active, onPick }: { tabs: string[]; active: string; onPick: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
      {tabs.map((t) => {
        const on = active === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onPick(t)}
            style={{ flex: 1, padding: '15px 4px', border: 0, background: 'transparent', textAlign: 'center', fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap', color: on ? 'var(--violet-deep)' : 'var(--text-3)', borderBottom: `1.5px solid ${on ? 'var(--violet)' : 'transparent'}`, marginBottom: -1, cursor: 'pointer' }}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

function Segmented({ label, options, value, onPick }: { label?: string; options: string[]; value: string; onPick: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && <span style={mono()}>{label}</span>}
      <div style={{ display: 'flex', gap: 6, padding: 4, border: '1px solid var(--border)', borderRadius: 10 }}>
        {options.map((o) => {
          const on = value === o;
          return (
            <button key={o} type="button" onClick={() => onPick(o)} style={{ flex: 1, height: 36, border: 0, borderRadius: 8, background: on ? 'var(--text)' : 'transparent', color: on ? 'var(--bg)' : 'var(--text-2)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleSwitch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ width: 52, height: 30, border: 0, borderRadius: 999, background: on ? 'var(--violet)' : '#D3D3D8', cursor: 'pointer', padding: 3, display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start' }}>
      <span style={{ width: 24, height: 24, borderRadius: 999, background: 'var(--surface)', boxShadow: '0 1px 3px rgba(20,20,26,0.2)' }} />
    </button>
  );
}

function ToolButton({ icon, label, active, emph, onClick }: { icon: string; label: string; active?: boolean; emph?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      style={{
        height: 40,
        padding: active || emph ? '0 16px 0 12px' : '0 10px',
        border: 0,
        borderRadius: 999,
        background: active ? 'var(--violet-light)' : 'transparent',
        color: active ? 'var(--violet-deep)' : 'var(--text-2)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 700,
        fontSize: 13,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
      }}
    >
      <i className={icon} style={{ fontSize: 20 }} />
      {(active || emph) && <span>{label}</span>}
    </button>
  );
}

function layerRows(approved: number[]) {
  const rows: { id: string; name: string; icon: string; indent: number; motion?: boolean }[] = [
    { id: 'title', name: 'Title', icon: 'ph ph-text-h-one', indent: 8 },
    { id: 'logo', name: 'Northwind mark', icon: 'ph ph-sparkle', indent: 8, motion: true },
  ];
  approved.forEach((i, n) => {
    const id = `s${i}`;
    const d = DRAFTS[i % DRAFTS.length];
    rows.push({ id, name: `Section ${n + 1}`, icon: 'ph ph-square-half', indent: 8 });
    rows.push({ id: `${id}-img`, name: 'Screenshot', icon: 'ph ph-image', indent: 28 });
    rows.push({ id: `${id}-head`, name: d.headline, icon: 'ph ph-text-aa', indent: 28 });
    rows.push({ id: `${id}-body`, name: 'Body copy', icon: 'ph ph-text-align-left', indent: 28 });
  });
  return rows;
}

function handleSpots(sz: { w: number; h: number }) {
  const midX = sz.w / 2 - 5;
  const rightX = sz.w - 5;
  const midY = sz.h / 2 - 5;
  const bottomY = sz.h - 5;
  return [
    { key: 'nw', top: -5, left: -5, dx: -1, dy: -1, cursor: 'nwse-resize' },
    { key: 'n', top: -5, left: midX, dx: 0, dy: -1, cursor: 'ns-resize' },
    { key: 'ne', top: -5, left: rightX, dx: 1, dy: -1, cursor: 'nesw-resize' },
    { key: 'w', top: midY, left: -5, dx: -1, dy: 0, cursor: 'ew-resize' },
    { key: 'e', top: midY, left: rightX, dx: 1, dy: 0, cursor: 'ew-resize' },
    { key: 'sw', top: bottomY, left: -5, dx: -1, dy: 1, cursor: 'nesw-resize' },
    { key: 's', top: bottomY, left: midX, dx: 0, dy: 1, cursor: 'ns-resize' },
    { key: 'se', top: bottomY, left: rightX, dx: 1, dy: 1, cursor: 'nwse-resize' },
  ];
}

function mono(): CSSProperties {
  return { fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' };
}

function pickTag(top: number): CSSProperties {
  return { position: 'absolute', top, left: -8, height: 20, padding: '0 8px', borderRadius: 999, background: 'var(--violet)', color: '#FFFFFF', fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center' };
}

function stepBtn(): CSSProperties {
  return { width: 36, height: '100%', border: 0, background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
}

function resetBtn(): CSSProperties {
  return { height: 40, border: '1.5px solid var(--border)', borderRadius: 10, background: 'transparent', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 };
}

function numInput(): CSSProperties {
  return { height: 40, border: '1.5px solid var(--border)', borderRadius: 10, background: 'transparent', padding: '0 12px', fontFamily: "'Geist Mono', monospace", fontSize: 13, color: 'var(--text)', outline: 'none', width: '100%' };
}
