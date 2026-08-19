import { useEffect, useRef, useState } from 'react';
import type { FreeformElement, FreeformPage } from '../../lib/templates/freeform-types';
import { FREEFORM_CANVAS_WIDTH } from '../../lib/templates/freeform-types';

const FONT_STACK: Record<'display' | 'body' | 'mono', string> = {
  display: "'Bricolage Grotesque', sans-serif",
  body: "'Plus Jakarta Sans', system-ui, sans-serif",
  mono: "'Geist Mono', monospace",
};

interface FreeformCanvasProps {
  page: FreeformPage;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onPatch: (elementId: string, patch: Partial<FreeformElement>) => void;
  onDelete: (elementId: string) => void;
}

// The core editing surface for /templates/customize -- a fixed-width
// (FREEFORM_CANVAS_WIDTH) absolutely-positioned canvas, one per page. Every
// element is independently selectable, draggable, and (for images) resizable
// and replaceable, and text is edited in place via contentEditable. This is
// deliberately NOT a scaled/zoomable viewport: interactions stay in real
// pixel units to keep drag/resize math simple and reliable, and the
// surrounding page (Customize.tsx) scrolls horizontally on narrow viewports
// instead.
export function FreeformCanvas({ page, selectedId, onSelect, onPatch, onDelete }: FreeformCanvasProps) {
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
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
    function onKeyDown(e: KeyboardEvent) {
      if (!selectedId || editingTextId) return;
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
      e.preventDefault();
      onDelete(selectedId);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, editingTextId, onDelete]);

  function startMove(e: React.PointerEvent, el: FreeformElement) {
    if (editingTextId === el.id) return;
    e.stopPropagation();
    onSelect(el.id);
    const sx = e.clientX;
    const sy = e.clientY;
    const ox = el.x;
    const oy = el.y;
    const mv = (ev: PointerEvent) => {
      onPatch(el.id, { x: Math.round(ox + (ev.clientX - sx)), y: Math.round(oy + (ev.clientY - sy)) });
    };
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
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
      {[...page.elements].sort((a, b) => a.zIndex - b.zIndex).map((el) => {
        const selected = selectedId === el.id;
        const wrapStyle: React.CSSProperties = { position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h, zIndex: el.zIndex, cursor: editingTextId === el.id ? 'text' : 'move' };

        return (
          <div key={el.id} style={wrapStyle} onPointerDown={(e) => startMove(e, el)} onClick={(e) => e.stopPropagation()}>
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
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingTextId(el.id);
                  }}
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
                <span
                  onPointerDown={(e) => startResize(e, el)}
                  style={{ position: 'absolute', right: -6, bottom: -6, width: 12, height: 12, border: '1.5px solid var(--violet)', borderRadius: 3, background: '#FFFFFF', cursor: 'nwse-resize' }}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
