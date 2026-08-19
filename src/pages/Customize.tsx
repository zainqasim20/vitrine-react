import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../lib/store';
import { Logo } from '../components/Logo';
import { FreeformCanvas } from '../components/customize/FreeformCanvas';
import type { FreeformElement, FreeformElementType, FreeformPage } from '../lib/templates/freeform-types';

function mono(): React.CSSProperties {
  return { fontFamily: "'Geist Mono', monospace", fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' };
}

function IconBtn({ icon, title, onClick, danger, disabled }: { icon: string; title: string; onClick: (e: React.MouseEvent) => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{ width: 26, height: 26, border: 0, borderRadius: 7, background: 'transparent', color: disabled ? 'var(--border-strong)' : danger ? 'var(--error)' : 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer' }}
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

function findFreeformElement(pages: FreeformPage[], id: string): { page: FreeformPage; el: FreeformElement } | null {
  for (const p of pages) {
    const el = p.elements.find((e) => e.id === id);
    if (el) return { page: p, el };
  }
  return null;
}

// /templates/customize -- the real editable draft the user asked for, laid
// out as one continuous scroll (all pages render at once, stacked, like the
// actual published case study would read) instead of an exclusive
// one-page-at-a-time view -- switching pages used to hide every other page,
// which broke the sense that this is one flowing document. The Pages
// sidebar now scrolls to a page rather than swapping to it, and a
// scroll-spy (below) tracks whichever page is currently in view to decide
// what the "+ element" toolbar and page-background panel act on.
//
// Every element is independently draggable/resizable/editable/deletable;
// shift-click multi-selects and drags/deletes as a group; single-element
// drags snap to nearby edges/centers; Ctrl/Cmd+Z and Shift+Ctrl/Cmd+Z
// undo/redo. Not yet built: this draft doesn't feed into Publish's actual
// downloadable HTML export yet -- see /preview for the read-only render of
// it, which does work end to end.
export function Customize() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const pageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const pages = state.freeform?.pages ?? [];
  const pageIdsKey = pages.map((p) => p.id).join(',');

  // Scroll-spy: whichever page's top is closest to a line just below the
  // header becomes "active" -- drives the toolbar's add-target and the
  // background panel when nothing is selected. rAF-throttled scroll
  // listener rather than IntersectionObserver, since the page set changes
  // (add/duplicate/delete) and re-wiring an observer's targets each time is
  // more moving parts than re-reading refs on scroll.
  useEffect(() => {
    const container = mainRef.current;
    if (!container || pages.length === 0) return;
    let raf = 0;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const containerTop = container!.getBoundingClientRect().top;
        let bestId: string | null = null;
        let bestDist = Infinity;
        for (const p of pages) {
          const el = pageRefs.current[p.id];
          if (!el) continue;
          const dist = Math.abs(el.getBoundingClientRect().top - containerTop - 40);
          if (dist < bestDist) {
            bestDist = dist;
            bestId = p.id;
          }
        }
        if (bestId) actions.setActiveFreeformPage(bestId);
      });
    }
    container.addEventListener('scroll', onScroll);
    onScroll();
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIdsKey]);

  // Ctrl/Cmd+Z undo, Shift+Ctrl/Cmd+Z redo -- ignored while focus is in a
  // text input/textarea/contentEditable so it doesn't fight the browser's
  // own native undo inside that field.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return;
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
      e.preventDefault();
      if (e.shiftKey) actions.redoFreeform();
      else actions.undoFreeform();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [actions]);

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

  const activePageId = state.freeformActivePageId && pages.some((p) => p.id === state.freeformActivePageId) ? state.freeformActivePageId : pages[0].id;
  const activePage = pages.find((p) => p.id === activePageId)!;

  const selectedIds = state.freeformSelectedIds;
  const selectedEntries = selectedIds.map((id) => findFreeformElement(pages, id)).filter((x): x is { page: FreeformPage; el: FreeformElement } => x !== null);
  const selectedPage = selectedEntries[0]?.page ?? activePage;
  const selected = selectedEntries.length === 1 ? selectedEntries[0].el : null;
  const multiCount = selectedEntries.length;

  function patchSelected(patch: Record<string, unknown>) {
    if (selected) actions.patchFreeformElement(selectedPage.id, selected.id, patch);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, borderRight: '1px solid var(--border)', paddingRight: 10, marginRight: 2 }}>
            <IconBtn icon="ph ph-arrow-counter-clockwise" title="Undo (Ctrl/Cmd+Z)" disabled={!state.freeformCanUndo} onClick={() => actions.undoFreeform()} />
            <IconBtn icon="ph ph-arrow-clockwise" title="Redo (Shift+Ctrl/Cmd+Z)" disabled={!state.freeformCanRedo} onClick={() => actions.redoFreeform()} />
          </div>
          <button
            type="button"
            onClick={() => navigate('/preview')}
            title="See the read-only final look"
            style={{ height: 34, padding: '0 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <i className="ph ph-eye" style={{ fontSize: 14 }} />
            Preview
          </button>
          <span style={{ width: 1, height: 20, background: 'var(--border)' }} />
          {ADD_TOOLS.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => actions.addFreeformElement(activePage.id, t.type)}
              title={`Add ${t.label.toLowerCase()} to "${activePage.name}"`}
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
                  onClick={() => {
                    actions.setActiveFreeformPage(p.id);
                    pageRefs.current[p.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
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

        <main ref={mainRef} style={{ flex: 1, overflow: 'auto', background: 'var(--surface-3)', padding: '32px 32px 96px' }}>
          {/* alignItems: flex-start, not center -- the canvas is a fixed
              1200px and the two sidebars can leave less room than that at
              common viewport widths. Centering an overflowing flex item
              clips it symmetrically with no way to scroll back to the
              hidden left edge; left-aligning keeps x=0 (where most of a
              page's important content sits, e.g. Cover's PRODUCTS label)
              always reachable at scrollLeft 0, with the rest a normal
              rightward scroll away. */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 28 }}>
            {pages.map((p, i) => (
              <div
                key={p.id}
                ref={(el) => {
                  pageRefs.current[p.id] = el;
                }}
                style={{ flex: 'none' }}
              >
                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={mono()}>
                    {i + 1} · {p.name}
                  </span>
                </div>
                <div style={{ boxShadow: 'var(--shadow-lg)' }}>
                  <FreeformCanvas
                    page={p}
                    selectedIds={selectedIds}
                    onSelect={(id, additive) => actions.selectFreeform(p.id, id, additive)}
                    onPatch={(id, patch) => actions.patchFreeformElement(p.id, id, patch)}
                    onDelete={(ids) => actions.removeFreeformElements(p.id, ids)}
                  />
                </div>
              </div>
            ))}
          </div>
        </main>

        <aside style={{ flex: 'none', width: 280, borderLeft: '1px solid var(--border)', overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Elements can overlap (e.g. Cover's dark scrim sits directly on
              top of its full-bleed photo) -- clicking the canvas only ever
              reaches the topmost one at that point, same as any layered
              editor. This list is the way to reach whatever's underneath. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={mono()}>Layers · {activePage.name}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 180, overflowY: 'auto' }}>
              {[...activePage.elements]
                .sort((a, b) => b.zIndex - a.zIndex)
                .map((el) => {
                  const active = selectedIds.includes(el.id);
                  const icon = el.type === 'text' ? 'ph ph-text-t' : el.type === 'image' ? 'ph ph-image' : el.type === 'shape' ? 'ph ph-square' : 'ph ph-cursor-click';
                  const label = el.type === 'text' ? el.text.slice(0, 30) || 'Text' : el.type === 'button' ? el.text : el.type.charAt(0).toUpperCase() + el.type.slice(1);
                  return (
                    <div
                      key={el.id}
                      onClick={(e) => actions.selectFreeform(activePage.id, el.id, e.shiftKey)}
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

          {multiCount > 1 ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={mono()}>{multiCount} elements</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  <IconBtn icon="ph ph-copy" title="Duplicate group" onClick={() => actions.duplicateFreeformElements(selectedPage.id, selectedIds)} />
                  <IconBtn icon="ph ph-trash" title="Delete group" danger onClick={() => actions.removeFreeformElements(selectedPage.id, selectedIds)} />
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--text-3)' }}>Shift-click to add or remove elements from the selection. Drag any of them to move the whole group.</p>
            </>
          ) : selected ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={mono()}>{selected.type}</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  <IconBtn
                    icon="ph ph-arrow-line-up"
                    title="Bring to front"
                    onClick={() => patchSelected({ zIndex: Math.max(...selectedPage.elements.map((e) => e.zIndex)) + 1 })}
                  />
                  <IconBtn
                    icon="ph ph-arrow-line-down"
                    title="Send to back"
                    onClick={() => patchSelected({ zIndex: Math.min(...selectedPage.elements.map((e) => e.zIndex)) - 1 })}
                  />
                  <IconBtn icon="ph ph-copy" title="Duplicate" onClick={() => actions.duplicateFreeformElement(selectedPage.id, selected.id)} />
                  <IconBtn icon="ph ph-trash" title="Delete" danger onClick={() => actions.removeFreeformElement(selectedPage.id, selected.id)} />
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
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--text-3)' }}>
                Click any element to select it, shift-click to select more than one. Drag to move (snaps to nearby edges), drag the bottom-right handle to resize, double-click text to edit.
              </p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
