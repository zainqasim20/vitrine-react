import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../lib/store';
import { Logo } from '../components/Logo';
import { FreeformCanvas } from '../components/customize/FreeformCanvas';
import type { FreeformElementType } from '../lib/templates/freeform-types';

function mono(): React.CSSProperties {
  return { fontFamily: "'Geist Mono', monospace", fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' };
}

function IconBtn({ icon, title, onClick, danger }: { icon: string; title: string; onClick: (e: React.MouseEvent) => void; danger?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{ width: 26, height: 26, border: 0, borderRadius: 7, background: 'transparent', color: danger ? 'var(--error)' : 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
    >
      <i className={icon} style={{ fontSize: 14 }} />
    </button>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={mono()}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="color" value={safe} onChange={(e) => onChange(e.target.value)} style={{ width: 32, height: 32, padding: 0, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: 'none' }} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, height: 32, border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', fontFamily: "'Geist Mono', monospace", fontSize: 12, color: 'var(--text)', background: 'transparent', outline: 'none' }}
        />
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={mono()}>{label}</span>
      <input
        type="number"
        value={Math.round(value)}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ height: 32, border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', fontFamily: "'Geist Mono', monospace", fontSize: 12, color: 'var(--text)', background: 'transparent', outline: 'none' }}
      />
    </div>
  );
}

const ADD_TOOLS: { type: FreeformElementType; icon: string; label: string }[] = [
  { type: 'text', icon: 'ph ph-text-t', label: 'Text' },
  { type: 'image', icon: 'ph ph-image', label: 'Image' },
  { type: 'shape', icon: 'ph ph-square', label: 'Shape' },
  { type: 'button', icon: 'ph ph-cursor-click', label: 'Button' },
];

// /templates/customize -- the real editable draft the user asked for:
// "give a rough draft that he can use to customize his portfolio". Reached
// straight from "Use template" for Feature Story (see useTemplate() in
// store.tsx), seeded from buildFeatureStoryFreeformPages(). Every element on
// every page is a genuinely independent, draggable/resizable/editable/
// deletable object -- not a fixed module rendering, which is what Refine's
// existing Feature Story canvas still is (explicitly labeled read-only
// there). Phase 1 of this: move/resize/edit text/replace image/delete/add
// element, plus add/duplicate/delete/reorder/rename pages and per-page
// background color. Not yet built (flagged, not silently missing): undo/
// redo, multi-select, alignment guides/snapping, and publishing this draft
// into the rest of the pipeline (Preview/Publish) -- this is a standalone
// editing surface for now.
export function Customize() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);

  if (!state.freeform || state.freeform.pages.length === 0) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', padding: '96px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
          <i className="ph ph-cursor" style={{ fontSize: 24, color: 'var(--text-3)' }} />
          <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 28, lineHeight: 1.2, letterSpacing: '-0.02em' }}>Nothing to customize yet</h3>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-2)', maxWidth: '48ch' }}>Pick a template first — this screen opens with its draft already on the canvas, ready to edit.</p>
          <button
            type="button"
            onClick={() => navigate('/templates')}
            style={{ marginTop: 12, height: 48, padding: '0 24px', border: 0, borderRadius: 10, background: 'var(--violet-gradient)', color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            Browse templates
          </button>
        </div>
      </main>
    );
  }

  const { pages } = state.freeform;
  const activePageId = state.freeformActivePageId && pages.some((p) => p.id === state.freeformActivePageId) ? state.freeformActivePageId : pages[0].id;
  const activePage = pages.find((p) => p.id === activePageId)!;
  const selected = state.freeformSelectedId ? activePage.elements.find((el) => el.id === state.freeformSelectedId) || null : null;

  function patchSelected(patch: Record<string, unknown>) {
    if (selected) actions.patchFreeformElement(activePage.id, selected.id, patch);
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)' }}>
      <header style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Logo height={22} />
          <Link to="/templates" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
            <i className="ph ph-arrow-left" style={{ fontSize: 14 }} />
            Templates
          </Link>
        </div>
        <span style={mono()}>Customizing · Feature Story</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {ADD_TOOLS.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => actions.addFreeformElement(activePage.id, t.type)}
              title={`Add ${t.label.toLowerCase()}`}
              style={{ height: 34, padding: '0 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <i className={t.icon} style={{ fontSize: 14 }} />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <aside style={{ flex: 'none', width: 220, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div style={{ padding: '14px 14px 8px' }}>
            <span style={mono()}>Pages</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pages.map((p, i) => {
              const active = p.id === activePage.id;
              return (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex !== null && dragIndex !== i) actions.reorderFreeformPages(dragIndex, i);
                    setDragIndex(null);
                  }}
                  onClick={() => actions.setActiveFreeformPage(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 8px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: active ? 'var(--violet-light)' : 'transparent',
                  }}
                >
                  <i className="ph ph-dots-six-vertical" style={{ fontSize: 14, color: 'var(--text-3)', cursor: 'grab', flex: 'none' }} />
                  <span style={{ width: 16, height: 16, borderRadius: 4, background: p.backgroundColor, border: '1px solid var(--border)', flex: 'none' }} />
                  {renamingPageId === p.id ? (
                    <input
                      autoFocus
                      defaultValue={p.name}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={(e) => {
                        actions.renameFreeformPage(p.id, e.target.value.trim() || p.name);
                        setRenamingPageId(null);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                      style={{ flex: 1, minWidth: 0, height: 24, border: '1px solid var(--violet)', borderRadius: 6, padding: '0 6px', fontSize: 12.5, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setRenamingPageId(p.id);
                      }}
                      style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? 'var(--violet-deep)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {p.name}
                    </span>
                  )}
                  <IconBtn icon="ph ph-copy" title="Duplicate page" onClick={(e) => { e.stopPropagation(); actions.duplicateFreeformPage(p.id); }} />
                  {pages.length > 1 && <IconBtn icon="ph ph-trash" title="Delete page" danger onClick={(e) => { e.stopPropagation(); actions.removeFreeformPage(p.id); }} />}
                </div>
              );
            })}
          </div>
          <div style={{ padding: 10, borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => actions.addFreeformPage()}
              style={{ width: '100%', height: 36, border: '1px dashed var(--border-strong)', borderRadius: 8, background: 'transparent', color: 'var(--text-2)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <i className="ph ph-plus" style={{ fontSize: 13 }} />
              Add page
            </button>
          </div>
        </aside>

        <main style={{ flex: 1, overflow: 'auto', background: 'var(--surface-3)', padding: 32, display: 'flex', justifyContent: 'center' }}>
          <div style={{ boxShadow: 'var(--shadow-lg)', flex: 'none' }}>
            <FreeformCanvas
              page={activePage}
              selectedId={state.freeformSelectedId}
              onSelect={actions.selectFreeform}
              onPatch={(id, patch) => actions.patchFreeformElement(activePage.id, id, patch)}
              onDelete={(id) => actions.removeFreeformElement(activePage.id, id)}
            />
          </div>
        </main>

        <aside style={{ flex: 'none', width: 280, borderLeft: '1px solid var(--border)', overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Elements can overlap (e.g. Cover's dark scrim sits directly on
              top of its full-bleed photo) -- clicking the canvas only ever
              reaches the topmost one at that point, same as any layered
              editor. This list is the way to reach whatever's underneath. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={mono()}>Layers</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 180, overflowY: 'auto' }}>
              {[...activePage.elements]
                .sort((a, b) => b.zIndex - a.zIndex)
                .map((el) => {
                  const active = el.id === state.freeformSelectedId;
                  const icon = el.type === 'text' ? 'ph ph-text-t' : el.type === 'image' ? 'ph ph-image' : el.type === 'shape' ? 'ph ph-square' : 'ph ph-cursor-click';
                  const label = el.type === 'text' ? el.text.slice(0, 30) || 'Text' : el.type === 'button' ? el.text : el.type.charAt(0).toUpperCase() + el.type.slice(1);
                  return (
                    <div
                      key={el.id}
                      onClick={() => actions.selectFreeform(el.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 7, cursor: 'pointer', background: active ? 'var(--violet-light)' : 'transparent' }}
                    >
                      <i className={icon} style={{ fontSize: 13, color: active ? 'var(--violet-deep)' : 'var(--text-3)', flex: 'none' }} />
                      <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: active ? 700 : 500, color: active ? 'var(--violet-deep)' : 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                    </div>
                  );
                })}
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--border)' }} />
          {selected ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={mono()}>{selected.type}</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  <IconBtn
                    icon="ph ph-arrow-line-up"
                    title="Bring to front"
                    onClick={() => patchSelected({ zIndex: Math.max(...activePage.elements.map((e) => e.zIndex)) + 1 })}
                  />
                  <IconBtn
                    icon="ph ph-arrow-line-down"
                    title="Send to back"
                    onClick={() => patchSelected({ zIndex: Math.min(...activePage.elements.map((e) => e.zIndex)) - 1 })}
                  />
                  <IconBtn icon="ph ph-copy" title="Duplicate" onClick={() => actions.duplicateFreeformElement(activePage.id, selected.id)} />
                  <IconBtn icon="ph ph-trash" title="Delete" danger onClick={() => actions.removeFreeformElement(activePage.id, selected.id)} />
                </div>
              </div>

              {selected.type === 'text' && (
                <>
                  <NumberField label="Font size" value={selected.fontSize} min={8} max={140} onChange={(fontSize) => patchSelected({ fontSize })} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={mono()}>Weight</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[400, 600, 700].map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => patchSelected({ fontWeight: w })}
                          style={{ flex: 1, height: 32, border: `1.5px solid ${selected.fontWeight === w ? 'var(--violet)' : 'var(--border)'}`, borderRadius: 8, background: selected.fontWeight === w ? 'var(--violet-light)' : 'transparent', color: selected.fontWeight === w ? 'var(--violet-deep)' : 'var(--text-2)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={mono()}>Align</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['left', 'center', 'right'] as const).map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => patchSelected({ align: a })}
                          style={{ flex: 1, height: 32, border: `1.5px solid ${selected.align === a ? 'var(--violet)' : 'var(--border)'}`, borderRadius: 8, background: selected.align === a ? 'var(--violet-light)' : 'transparent', color: selected.align === a ? 'var(--violet-deep)' : 'var(--text-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <i className={`ph ph-text-align-${a}`} style={{ fontSize: 15 }} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <ColorField label="Color" value={selected.color} onChange={(color) => patchSelected({ color })} />
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--text-3)' }}>Double-click the text on the canvas to edit its content.</p>
                </>
              )}

              {selected.type === 'image' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={mono()}>Fit</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['cover', 'contain'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => patchSelected({ objectFit: f })}
                          style={{ flex: 1, height: 32, border: `1.5px solid ${selected.objectFit === f ? 'var(--violet)' : 'var(--border)'}`, borderRadius: 8, background: selected.objectFit === f ? 'var(--violet-light)' : 'transparent', color: selected.objectFit === f ? 'var(--violet-deep)' : 'var(--text-2)', fontSize: 12, fontWeight: 700, textTransform: 'capitalize', cursor: 'pointer' }}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <NumberField label="Corner radius" value={selected.borderRadius} min={0} max={999} onChange={(borderRadius) => patchSelected({ borderRadius })} />
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--text-3)' }}>Select the image on the canvas and use "Replace image" to upload your own.</p>
                </>
              )}

              {selected.type === 'shape' && (
                <>
                  <ColorField label="Fill" value={selected.fill} onChange={(fill) => patchSelected({ fill })} />
                  <NumberField label="Corner radius" value={selected.borderRadius} min={0} max={999} onChange={(borderRadius) => patchSelected({ borderRadius })} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <span style={mono()}>Opacity</span>
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, color: 'var(--text-2)' }}>{Math.round(selected.opacity * 100)}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={Math.round(selected.opacity * 100)} onChange={(e) => patchSelected({ opacity: Number(e.target.value) / 100 })} style={{ width: '100%', accentColor: 'var(--violet)' }} />
                  </div>
                </>
              )}

              {selected.type === 'button' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={mono()}>Label</span>
                    <input
                      value={selected.text}
                      onChange={(e) => patchSelected({ text: e.target.value })}
                      style={{ height: 34, border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', fontSize: 13, color: 'var(--text)', background: 'transparent', outline: 'none' }}
                    />
                  </div>
                  <ColorField label="Background" value={selected.bg} onChange={(bg) => patchSelected({ bg })} />
                  <ColorField label="Text color" value={selected.color} onChange={(color) => patchSelected({ color })} />
                </>
              )}

              <div style={{ display: 'flex', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <NumberField label="W" value={selected.w} min={8} onChange={(w) => patchSelected({ w })} />
                <NumberField label="H" value={selected.h} min={8} onChange={(h) => patchSelected({ h })} />
              </div>
            </>
          ) : (
            <>
              <span style={mono()}>Page background</span>
              <ColorField label="Color" value={activePage.backgroundColor} onChange={(hex) => actions.setFreeformPageBackground(activePage.id, hex)} />
              <NumberField label="Page height" value={activePage.height} min={120} max={4000} onChange={(height) => actions.setFreeformPageHeight(activePage.id, height)} />
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--text-3)' }}>Click any element on the canvas to select it. Drag to move, drag the bottom-right handle to resize, double-click text to edit.</p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
