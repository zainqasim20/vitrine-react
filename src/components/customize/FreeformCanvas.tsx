import { useEffect, useRef, useState } from 'react';
import type { FreeformElement, FreeformPage } from '../../lib/templates/freeform-types';
import { FREEFORM_CANVAS_WIDTH } from '../../lib/templates/freeform-types';

const FONT_STACK: Record<'display' | 'body' | 'mono', string> = {
  display: "'Bricolage Grotesque', sans-serif",
  body: "'Plus Jakarta Sans', system-ui, sans-serif",
  mono: "'Geist Mono', monospace",
};

const SNAP_THRESHOLD = 6;

interface SnapGuides {
  x: number | null;
  y: number | null;
}

// Compares the moving element's edges/center against every other element on
// the page and returns the closest within-threshold alignment on each axis,
// plus the guide-line position to draw. Only used for single-element drags
// (see startMove) -- snapping a whole multi-selected group against itself
// doesn't have one unambiguous "moving edge" to compare, so groups move at
// the raw pointer delta instead.
function computeSnap(moving: { x: number; y: number; w: number; h: number }, others: FreeformElement[]): { dx: number; dy: number; guides: SnapGuides } {
  const mLeft = moving.x;
  const mRight = moving.x + moving.w;
  const mCenterX = moving.x + moving.w / 2;
  const mTop = moving.y;
  const mBottom = moving.y + moving.h;
  const mCenterY = moving.y + moving.h / 2;

  let bestDx = 0;
  let bestDxAbs = Infinity;
  let guideX: number | null = null;
  let bestDy = 0;
  let bestDyAbs = Infinity;
  let guideY: number | null = null;

  for (const o of others) {
    const oLeft = o.x;
    const oRight = o.x + o.w;
    const oCenterX = o.x + o.w / 2;
    const oTop = o.y;
    const oBottom = o.y + o.h;
    const oCenterY = o.y + o.h / 2;

    for (const [m, target] of [
      [mLeft, oLeft],
      [mCenterX, oCenterX],
      [mRight, oRight],
    ]) {
      const d = target - m;
      if (Math.abs(d) <= SNAP_THRESHOLD && Math.abs(d) < bestDxAbs) {
        bestDxAbs = Math.abs(d);
        bestDx = d;
        guideX = target;
      }
    }
    for (const [m, target] of [
      [mTop, oTop],
      [mCenterY, oCenterY],
      [mBottom, oBottom],
    ]) {
      const d = target - m;
      if (Math.abs(d) <= SNAP_THRESHOLD && Math.abs(d) < bestDyAbs) {
        bestDyAbs = Math.abs(d);
        bestDy = d;
        guideY = target;
      }
    }
  }

  return { dx: bestDx, dy: bestDy, guides: { x: guideX, y: guideY } };
}

interface FreeformCanvasProps {
  page: FreeformPage;
  selectedIds: string[];
  onSelect: (id: string | null, additive?: boolean) => void;
  onPatch: (elementId: string, patch: Partial<FreeformElement>) => void;
  onDelete: (elementIds: string[]) => void;
  // Used by /preview to render the exact same doc with zero editing
  // chrome/interactivity -- no drag/resize/select/replace/edit, just the
  // final look. Reuses this component instead of a second renderer so the
  // two can never drift out of sync with each other.
  readOnly?: boolean;
}

// The core editing surface for /templates/customize -- a fixed-width
// (FREEFORM_CANVAS_WIDTH) absolutely-positioned canvas, one instance per
// page (Customize.tsx mounts every page's canvas at once in a continuous
// scroll, not one at a time). Every element is independently selectable,
// draggable, and (for images) resizable and replaceable, text is edited in
// place via contentEditable, shift-click multi-selects and drags/deletes as
// a group, and single-element drags snap to nearby edges/centers. This is
// deliberately NOT a scaled/zoomable viewport: interactions stay in real
// pixel units to keep drag/resize/snap math simple and reliable.
export function FreeformCanvas({ page, selectedIds, onSelect, onPatch, onDelete, readOnly = false }: FreeformCanvasProps) {
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const [guides, setGuides] = useState<SnapGuides>({ x: null, y: null });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingTextId && editRef.current) {
      const el = editRef.current;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editingTextId]);

  useEffect(() => {
    if (editingTextId && !page.elements.some((el) => el.id === editingTextId)) setEditingTextId(null);
  }, [page.elements, editingTextId]);

  useEffect(() => {
    if (readOnly) return;
    function onKeyDown(e: KeyboardEvent) {
      const mine = selectedIds.filter((id) => page.elements.some((el) => el.id === id));
      if (mine.length === 0 || editingTextId) return;
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
      e.preventDefault();
      onDelete(mine);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [readOnly, selectedIds, page.elements, editingTextId, onDelete]);

  function startMove(e: React.PointerEvent, el: FreeformElement) {
    if (editingTextId === el.id) return;
    e.stopPropagation();
    const additive = e.shiftKey;
    const alreadySelected = selectedIds.includes(el.id);

    if (additive) {
      onSelect(el.id, true);
      if (alreadySelected) return; // shift-click on a selected item deselects it -- nothing to drag
    } else if (!alreadySelected) {
      onSelect(el.id, false);
    }

    const dragIds = additive ? [...selectedIds, el.id] : alreadySelected ? selectedIds : [el.id];
    const group = page.elements.filter((e2) => dragIds.includes(e2.id));
    const starts = group.map((e2) => ({ id: e2.id, x: e2.x, y: e2.y, w: e2.w, h: e2.h }));
    const others = page.elements.filter((e2) => !dragIds.includes(e2.id));
    const singleSnap = starts.length === 1;

    const sx = e.clientX;
    const sy = e.clientY;
    const mv = (ev: PointerEvent) => {
      let dx = ev.clientX - sx;
      let dy = ev.clientY - sy;
      if (singleSnap) {
        const s0 = starts[0];
        const snap = computeSnap({ x: s0.x + dx, y: s0.y + dy, w: s0.w, h: s0.h }, others);
        dx += snap.dx;
        dy += snap.dy;
        setGuides(snap.guides);
      }
      for (const s of starts) onPatch(s.id, { x: Math.round(s.x + dx), y: Math.round(s.y + dy) });
    };
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
      setGuides({ x: null, y: null });
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  }

  function startResize(e: React.PointerEvent, el: FreeformElement) {
    e.stopPropagation();
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    const ow = el.w;
    const oh = el.h;
    const mv = (ev: PointerEvent) => {
      const w = Math.max(24, Math.round(ow + (ev.clientX - sx)));
      const h = Math.max(24, Math.round(oh + (ev.clientY - sy)));
      onPatch(el.id, { w, h });
    };
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  }

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const targetId = replaceTargetId;
    e.target.value = '';
    setReplaceTargetId(null);
    if (!file || !targetId) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onPatch(targetId, { src: reader.result });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div
      onClick={() => onSelect(null)}
      style={{ position: 'relative', width: FREEFORM_CANVAS_WIDTH, height: page.height, background: page.backgroundColor, overflow: 'hidden', flex: 'none' }}
    >
      <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChosen} style={{ display: 'none' }} />
      {guides.x !== null && <span style={{ position: 'absolute', left: guides.x, top: 0, bottom: 0, width: 1, background: 'var(--violet)', zIndex: 9999, pointerEvents: 'none' }} />}
      {guides.y !== null && <span style={{ position: 'absolute', top: guides.y, left: 0, right: 0, height: 1, background: 'var(--violet)', zIndex: 9999, pointerEvents: 'none' }} />}
      {[...page.elements].sort((a, b) => a.zIndex - b.zIndex).map((el) => {
        const selected = selectedIds.includes(el.id);
        const wrapStyle: React.CSSProperties = { position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h, zIndex: el.zIndex, cursor: readOnly ? 'default' : editingTextId === el.id ? 'text' : 'move' };

        return (
          <div key={el.id} style={wrapStyle} onPointerDown={readOnly ? undefined : (e) => startMove(e, el)} onClick={(e) => e.stopPropagation()}>
            {el.type === 'text' &&
              (editingTextId === el.id ? (
                <div
                  ref={editRef}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    onPatch(el.id, { text: e.currentTarget.textContent || '' });
                    setEditingTextId(null);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    height: '100%',
                    fontFamily: FONT_STACK[el.fontFamily],
                    fontSize: el.fontSize,
                    fontWeight: el.fontWeight,
                    color: el.color,
                    textAlign: el.align,
                    lineHeight: el.lineHeight ?? 1.3,
                    letterSpacing: el.letterSpacing,
                    textTransform: el.uppercase ? 'uppercase' : 'none',
                    outline: '2px solid var(--violet)',
                    outlineOffset: 2,
                    cursor: 'text',
                    overflow: 'visible',
                  }}
                >
                  {el.text}
                </div>
              ) : (
                <div
                  onDoubleClick={
                    readOnly
                      ? undefined
                      : (e) => {
                          e.stopPropagation();
                          setEditingTextId(el.id);
                        }
                  }
                  style={{
                    width: '100%',
                    height: '100%',
                    fontFamily: FONT_STACK[el.fontFamily],
                    fontSize: el.fontSize,
                    fontWeight: el.fontWeight,
                    color: el.color,
                    textAlign: el.align,
                    lineHeight: el.lineHeight ?? 1.3,
                    letterSpacing: el.letterSpacing,
                    textTransform: el.uppercase ? 'uppercase' : 'none',
                    whiteSpace: 'pre-wrap',
                    overflow: 'visible',
                  }}
                >
                  {el.text}
                </div>
              ))}

            {el.type === 'image' && (
              <img src={el.src} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: el.objectFit, borderRadius: el.borderRadius, display: 'block', pointerEvents: 'none' }} />
            )}

            {el.type === 'shape' && (
              <div style={{ width: '100%', height: '100%', background: el.fill, opacity: el.opacity, borderRadius: el.shape === 'ellipse' ? '50%' : el.borderRadius }} />
            )}

            {el.type === 'button' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: el.bg,
                  color: el.color,
                  borderRadius: el.borderRadius,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT_STACK.body,
                  fontWeight: 700,
                  fontSize: 13,
                  textAlign: 'center',
                  padding: '0 8px',
                }}
              >
                {el.text}
              </div>
            )}

            {selected && (
              <>
                <span style={{ position: 'absolute', inset: -1.5, border: '1.5px solid var(--violet)', borderRadius: el.type === 'shape' && el.shape === 'ellipse' ? '50%' : 4, boxShadow: '0 0 0 4px rgba(122,71,245,0.12)', pointerEvents: 'none' }} />
                {el.type === 'image' && editingTextId !== el.id && (
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setReplaceTargetId(el.id);
                      fileInputRef.current?.click();
                    }}
                    style={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                      height: 26,
                      padding: '0 10px',
                      border: 0,
                      borderRadius: 999,
                      background: 'rgba(20,20,26,0.75)',
                      color: '#FFFFFF',
                      fontFamily: FONT_STACK.body,
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    Replace image
                  </button>
                )}
                {selectedIds.length === 1 && (
                  <span
                    onPointerDown={(e) => startResize(e, el)}
                    style={{ position: 'absolute', right: -6, bottom: -6, width: 12, height: 12, border: '1.5px solid var(--violet)', borderRadius: 3, background: '#FFFFFF', cursor: 'nwse-resize' }}
                  />
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
