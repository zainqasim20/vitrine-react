import { useEffect, useRef, useState } from 'react';
import type { FreeformElement, FreeformImageElement, FreeformPage } from '../../lib/templates/freeform-types';
import { freeformImageFilter, FREEFORM_CANVAS_WIDTH } from '../../lib/templates/freeform-types';
import { resolveFreeformFontCss } from '../../lib/templates/google-fonts';

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

type HandleKey = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const RESIZE_HANDLES: Array<{ key: HandleKey; cursor: string; style: React.CSSProperties }> = [
  { key: 'nw', cursor: 'nwse-resize', style: { top: -6, left: -6 } },
  { key: 'ne', cursor: 'nesw-resize', style: { top: -6, right: -6 } },
  { key: 'sw', cursor: 'nesw-resize', style: { bottom: -6, left: -6 } },
  { key: 'se', cursor: 'nwse-resize', style: { bottom: -6, right: -6 } },
  { key: 'n', cursor: 'ns-resize', style: { top: -6, left: '50%', transform: 'translateX(-50%)' } },
  { key: 's', cursor: 'ns-resize', style: { bottom: -6, left: '50%', transform: 'translateX(-50%)' } },
  { key: 'e', cursor: 'ew-resize', style: { top: '50%', right: -6, transform: 'translateY(-50%)' } },
  { key: 'w', cursor: 'ew-resize', style: { top: '50%', left: -6, transform: 'translateY(-50%)' } },
];

// Unit outward direction per handle, used to turn "drag zoom" into one
// number regardless of which of the 8 handles was grabbed: dragging away
// from the element's center (in that handle's own direction) zooms in,
// dragging back toward center zooms out.
const HANDLE_VECTOR: Record<HandleKey, [number, number]> = {
  n: [0, -1],
  s: [0, 1],
  e: [1, 0],
  w: [-1, 0],
  ne: [0.7071, -0.7071],
  nw: [-0.7071, -0.7071],
  se: [0.7071, 0.7071],
  sw: [-0.7071, 0.7071],
};

interface FreeformCanvasProps {
  page: FreeformPage;
  selectedIds: string[];
  onSelect: (id: string | null, additive?: boolean) => void;
  onPatch: (elementId: string, patch: Partial<FreeformElement>) => void;
  onDelete: (elementIds: string[]) => void;
  // Drag-to-resize the page itself from a handle at its bottom edge.
  // Omitted (as it is from /preview's read-only usage) hides the handle.
  onResizeHeight?: (height: number) => void;
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
// draggable, and resizable from any of 8 handles (shift-drag a corner locks
// aspect ratio), text is edited in place via contentEditable, shift-click
// multi-selects and drags/deletes as a group, alt-click steps down through
// whatever's stacked at that point, and single-element drags snap to
// nearby edges/centers.
//
// A `locked` image is a special case, not just "frozen": its frame
// (x/y/w/h) never changes, but drag pans the image content within that
// frame (focalX/focalY) and the resize handles zoom it (the `zoom` field)
// via a CSS transform clipped by the frame's own overflow:hidden -- so the
// content can never visually escape the frame no matter how far it's
// panned or zoomed. A locked non-image element has no such content to pan/
// zoom, so it's simply frozen, same as before. This is deliberately NOT a
// scaled/zoomable viewport at the canvas level: interactions stay in real
// pixel units to keep drag/resize/snap/zoom math simple and reliable.
export function FreeformCanvas({ page, selectedIds, onSelect, onPatch, onDelete, onResizeHeight, readOnly = false }: FreeformCanvasProps) {
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const [guides, setGuides] = useState<SnapGuides>({ x: null, y: null });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

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

  // Alt+click steps down through whatever's stacked at that point instead
  // of selecting the topmost every time -- the way to reach e.g. Cover's
  // full-bleed photo directly on the canvas when its dark scrim shape sits
  // on top of it, without needing the Layers panel.
  function selectBelow(e: React.PointerEvent, hitEl: FreeformElement) {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) {
      onSelect(hitEl.id, false);
      return;
    }
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const stack = page.elements
      .filter((el2) => px >= el2.x && px <= el2.x + el2.w && py >= el2.y && py <= el2.y + el2.h)
      .sort((a, b) => b.zIndex - a.zIndex);
    if (stack.length === 0) {
      onSelect(hitEl.id, false);
      return;
    }
    const idx = stack.findIndex((el2) => el2.id === hitEl.id);
    const next = stack[(idx + 1) % stack.length];
    onSelect(next.id, false);
  }

  // Pans a locked image's content within its frozen frame -- the frame's
  // own x/y/w/h are never touched here, only focalX/focalY.
  function startImagePan(e: React.PointerEvent, el: FreeformImageElement) {
    e.stopPropagation();
    const startFocalX = el.focalX ?? 50;
    const startFocalY = el.focalY ?? 50;
    const zoom = Math.max(1, el.zoom ?? 1);
    const sx = e.clientX;
    const sy = e.clientY;
    const mv = (ev: PointerEvent) => {
      const dxPct = ((ev.clientX - sx) / el.w) * 100 * 1.5 * (1 / zoom);
      const dyPct = ((ev.clientY - sy) / el.h) * 100 * 1.5 * (1 / zoom);
      onPatch(el.id, { focalX: Math.max(0, Math.min(100, startFocalX - dxPct)), focalY: Math.max(0, Math.min(100, startFocalY - dyPct)) });
    };
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  }

  function startMove(e: React.PointerEvent, el: FreeformElement) {
    if (editingTextId === el.id) return;
    e.stopPropagation();
    if (e.altKey && !e.shiftKey) {
      selectBelow(e, el);
      return;
    }
    const additive = e.shiftKey;
    const alreadySelected = selectedIds.includes(el.id);

    if (additive) {
      onSelect(el.id, true);
      if (alreadySelected) return; // shift-click on a selected item deselects it -- nothing to drag
    } else if (!alreadySelected) {
      onSelect(el.id, false);
    }

    if (el.locked) {
      // The frame itself is frozen -- but for an image, dragging still
      // does something real: it pans the content inside the frame.
      if (el.type === 'image' && selectedIds.length <= 1) startImagePan(e, el);
      return;
    }

    const dragIds = additive ? [...selectedIds, el.id] : alreadySelected ? selectedIds : [el.id];
    const group = page.elements.filter((e2) => dragIds.includes(e2.id) && !e2.locked);
    if (group.length === 0) return;
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

  function startResize(e: React.PointerEvent, el: FreeformElement, handle: HandleKey) {
    e.stopPropagation();
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    const ox = el.x;
    const oy = el.y;
    const ow = el.w;
    const oh = el.h;
    const aspect = ow / oh || 1;
    const affectsLeft = handle.includes('w');
    const affectsRight = handle.includes('e');
    const affectsTop = handle.includes('n');
    const affectsBottom = handle.includes('s');
    const affectsW = affectsLeft || affectsRight;
    const affectsH = affectsTop || affectsBottom;

    const mv = (ev: PointerEvent) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      let w = ow;
      let h = oh;
      if (affectsW) w = Math.max(24, affectsLeft ? ow - dx : ow + dx);
      if (affectsH) h = Math.max(24, affectsTop ? oh - dy : oh + dy);
      if (ev.shiftKey && affectsW && affectsH) {
        if (Math.abs(dx) > Math.abs(dy)) h = w / aspect;
        else w = h * aspect;
      }
      const x = affectsLeft ? ox + (ow - w) : ox;
      const y = affectsTop ? oy + (oh - h) : oy;
      onPatch(el.id, { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
    };
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  }

  // The resize-handle equivalent for a locked image: instead of resizing
  // the frame, it zooms the content inside it. Dragging any handle away
  // from the element's center (in that handle's own direction) zooms in;
  // dragging back toward center zooms out, floored at 1 (exact fill).
  function startImageZoom(e: React.PointerEvent, el: FreeformImageElement, handle: HandleKey) {
    e.stopPropagation();
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    const startZoom = Math.max(1, el.zoom ?? 1);
    const [vx, vy] = HANDLE_VECTOR[handle];
    const mv = (ev: PointerEvent) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      const outward = dx * vx + dy * vy;
      const zoom = Math.max(1, Math.min(4, startZoom + outward / 150));
      onPatch(el.id, { zoom: Math.round(zoom * 100) / 100 });
    };
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  }

  function startPageResize(e: React.PointerEvent) {
    if (!onResizeHeight) return;
    e.stopPropagation();
    e.preventDefault();
    const sy = e.clientY;
    const oh = page.height;
    const mv = (ev: PointerEvent) => {
      onResizeHeight(Math.max(120, Math.round(oh + (ev.clientY - sy))));
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
    <div style={{ position: 'relative', width: FREEFORM_CANVAS_WIDTH, flex: 'none' }}>
      <div
        ref={surfaceRef}
        onClick={() => onSelect(null)}
        style={{ position: 'relative', width: '100%', height: page.height, background: page.backgroundColor, overflow: 'hidden' }}
      >
        <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChosen} style={{ display: 'none' }} />
        {guides.x !== null && <span style={{ position: 'absolute', left: guides.x, top: 0, bottom: 0, width: 1, background: 'var(--violet)', zIndex: 9999, pointerEvents: 'none' }} />}
        {guides.y !== null && <span style={{ position: 'absolute', top: guides.y, left: 0, right: 0, height: 1, background: 'var(--violet)', zIndex: 9999, pointerEvents: 'none' }} />}
        {[...page.elements].sort((a, b) => a.zIndex - b.zIndex).map((el) => {
          const selected = selectedIds.includes(el.id);
          const isLockedImage = el.locked && el.type === 'image';
          const wrapStyle: React.CSSProperties = {
            position: 'absolute',
            left: el.x,
            top: el.y,
            width: el.w,
            height: el.h,
            zIndex: el.zIndex,
            cursor: readOnly ? 'default' : editingTextId === el.id ? 'text' : isLockedImage ? 'grab' : el.locked ? 'default' : 'move',
          };

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
                      fontFamily: resolveFreeformFontCss(el.fontFamily),
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
                      fontFamily: resolveFreeformFontCss(el.fontFamily),
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
                <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: el.borderRadius, position: 'relative' }}>
                  <img
                    src={el.src}
                    alt=""
                    draggable={false}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: el.objectFit,
                      objectPosition: `${el.focalX ?? 50}% ${el.focalY ?? 50}%`,
                      transform: el.zoom && el.zoom !== 1 ? `scale(${el.zoom})` : undefined,
                      transformOrigin: `${el.focalX ?? 50}% ${el.focalY ?? 50}%`,
                      display: 'block',
                      pointerEvents: 'none',
                      opacity: el.opacity ?? 1,
                      filter: freeformImageFilter(el) || undefined,
                    }}
                  />
                </div>
              )}

              {el.type === 'shape' &&
                (el.stroke && el.strokeWidth ? (
                  <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', background: el.stroke, borderRadius: el.shape === 'ellipse' ? '50%' : el.borderRadius, padding: el.strokeWidth }}>
                    <div style={{ width: '100%', height: '100%', background: el.fill, opacity: el.opacity, borderRadius: el.shape === 'ellipse' ? '50%' : Math.max(0, el.borderRadius - el.strokeWidth) }} />
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '100%', background: el.fill, opacity: el.opacity, borderRadius: el.shape === 'ellipse' ? '50%' : el.borderRadius }} />
                ))}

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
                    fontFamily: resolveFreeformFontCss('body'),
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
                  <span
                    style={{
                      position: 'absolute',
                      inset: -1.5,
                      border: `1.5px solid ${el.locked && !isLockedImage ? 'var(--text-3)' : 'var(--violet)'}`,
                      borderRadius: el.type === 'shape' && el.shape === 'ellipse' ? '50%' : 4,
                      boxShadow: el.locked && !isLockedImage ? 'none' : '0 0 0 4px rgba(122,71,245,0.12)',
                      pointerEvents: 'none',
                    }}
                  />
                  {el.locked && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        background: 'rgba(20,20,26,0.75)',
                        color: '#FFFFFF',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <i className="ph-fill ph-lock-simple" style={{ fontSize: 12 }} />
                    </span>
                  )}
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
                        fontFamily: resolveFreeformFontCss('body'),
                        fontWeight: 700,
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      Replace image
                    </button>
                  )}
                  {selectedIds.length === 1 &&
                    (!el.locked || isLockedImage) &&
                    RESIZE_HANDLES.map((h) => (
                      <span
                        key={h.key}
                        onPointerDown={(e) => (isLockedImage ? startImageZoom(e, el as FreeformImageElement, h.key) : startResize(e, el, h.key))}
                        title={isLockedImage ? 'Drag to zoom' : undefined}
                        style={{ position: 'absolute', width: 12, height: 12, border: '1.5px solid var(--violet)', borderRadius: 3, background: '#FFFFFF', cursor: isLockedImage ? 'zoom-in' : h.cursor, ...h.style }}
                      />
                    ))}
                </>
              )}
            </div>
          );
        })}
      </div>
      {!readOnly && onResizeHeight && (
        <div
          onPointerDown={startPageResize}
          title="Drag to resize this page's height"
          style={{ position: 'absolute', left: 0, right: 0, bottom: -10, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'ns-resize' }}
        >
          <span style={{ width: 44, height: 5, borderRadius: 3, background: 'var(--border-strong)' }} />
        </div>
      )}
    </div>
  );
}
