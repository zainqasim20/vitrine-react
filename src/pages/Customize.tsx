import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../lib/store';
import { Logo } from '../components/Logo';
import { FreeformCanvas } from '../components/customize/FreeformCanvas';
import type { FreeformElement, FreeformElementType, FreeformGradient, FreeformPage, FreeformShapeKind } from '../lib/templates/freeform-types';
import { buildFreeformGradientCss, FREEFORM_SCENERY_PRESETS, FREEFORM_VIBRANT_PRESETS, parseFreeformGradient } from '../lib/templates/freeform-types';
import { FONT_CATEGORY_LABELS, GOOGLE_FONTS, loadGoogleFont, resolveFreeformFontCss, type GoogleFontCategory } from '../lib/templates/google-fonts';
import { captureFreeformCoverThumb, exportFreeformPagesAsImages, exportFreeformPagesAsPdf } from '../lib/templates/freeform-export';
import type { PexelsPhoto } from '../lib/types';

function mono(): React.CSSProperties {
  return { fontFamily: "'Geist Mono', monospace", fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' };
}

function alignBtnStyle(): React.CSSProperties {
  return { flex: 1, height: 32, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
}

function FileMenuItem({ icon, label, onClick, disabled }: { icon: string; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ height: 34, padding: '0 10px', border: 0, borderRadius: 8, background: 'transparent', color: disabled ? 'var(--text-3)' : 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12.5, cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}
    >
      <i className={icon} style={{ fontSize: 15, color: disabled ? 'var(--text-3)' : 'var(--text-2)' }} />
      {label}
    </button>
  );
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

function tabBtnStyle(active: boolean): React.CSSProperties {
  return { flex: 1, height: 28, border: `1px solid ${active ? 'var(--violet)' : 'var(--border)'}`, borderRadius: 8, background: active ? 'var(--violet-light)' : 'transparent', color: active ? 'var(--violet-deep)' : 'var(--text-2)', fontSize: 11.5, fontWeight: 700, textTransform: 'capitalize', cursor: 'pointer' };
}

function isGradientCss(v: string): boolean {
  return /^(linear|radial|conic)-gradient\(/.test(v);
}

// A compact editable number, for the couple of spots (gradient angle, stop
// position) where a fixed-width read-only number sat next to a range
// input -- same commit-on-blur/Enter pattern as NumberField/SliderField,
// just small enough to sit inline.
function MiniNumberInput({ value, onCommit, width = 32, min, max }: { value: number; onCommit: (n: number) => void; width?: number; min?: number; max?: number }) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  function commit() {
    const n = Number(text);
    if (text.trim() === '' || !Number.isFinite(n)) {
      setText(String(value));
      return;
    }
    let clamped = n;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);
    onCommit(clamped);
    setText(String(clamped));
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onFocus={() => setFocused(true)}
      onChange={(e) => setText(e.target.value.replace(/[^0-9.-]/g, ''))}
      onBlur={() => {
        setFocused(false);
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          setText(String(value));
          e.currentTarget.blur();
        }
      }}
      style={{ width, height: 20, border: '1px solid var(--border)', borderRadius: 5, padding: '0 4px', fontFamily: "'Geist Mono', monospace", fontSize: 11, color: 'var(--text-2)', background: 'transparent', outline: 'none', textAlign: 'right', flex: 'none' }}
    />
  );
}

// The Media tab writes exactly this shorthand (see MediaFillPicker below),
// so recognizing it is just checking the prefix -- same round-trip
// approach as isGradientCss/parseFreeformGradient above.
function isMediaCss(v: string): boolean {
  return /^url\(/.test(v.trim());
}

// Linear/radial/conic, any number of stops, built from freeform-types.ts's
// canonical gradient string format (buildFreeformGradientCss /
// parseFreeformGradient) -- editing here always round-trips through that
// same real CSS string, no separate gradient data type stored anywhere.
function GradientEditor({ value, onChange }: { value: string; onChange: (css: string) => void }) {
  const g: FreeformGradient = parseFreeformGradient(value) ?? { type: 'linear', angle: 135, stops: [{ color: '#6038EE', position: 0 }, { color: '#AD5BFC', position: 100 }] };

  function update(next: FreeformGradient) {
    onChange(buildFreeformGradientCss(next));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {(['linear', 'radial', 'conic'] as const).map((t) => (
          <button key={t} type="button" onClick={() => update({ ...g, type: t })} style={tabBtnStyle(g.type === t)}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ height: 56, borderRadius: 8, border: '1px solid var(--border)', background: buildFreeformGradientCss(g) }} />
      {g.type !== 'radial' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={mono()}>Angle</span>
          <input type="range" min={0} max={360} value={g.angle} onChange={(e) => update({ ...g, angle: Number(e.target.value) })} style={{ flex: 1, accentColor: 'var(--violet)' }} />
          <MiniNumberInput value={g.angle} min={0} max={360} onCommit={(angle) => update({ ...g, angle })} />
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: 'var(--text-3)' }}>°</span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={mono()}>Stops</span>
          <button
            type="button"
            title="Add stop"
            onClick={() => update({ ...g, stops: [...g.stops, { color: '#FFFFFF', position: Math.min(100, (g.stops[g.stops.length - 1]?.position ?? 50) + 10) }] })}
            style={{ width: 20, height: 20, border: '1px solid var(--border-strong)', borderRadius: 6, background: 'transparent', color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <i className="ph ph-plus" style={{ fontSize: 12 }} />
          </button>
        </div>
        {g.stops.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="color" value={s.color} onChange={(e) => update({ ...g, stops: g.stops.map((st, j) => (j === i ? { ...st, color: e.target.value } : st)) })} style={{ width: 28, height: 28, padding: 0, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', background: 'none', flex: 'none' }} />
            <input type="range" min={0} max={100} value={s.position} onChange={(e) => update({ ...g, stops: g.stops.map((st, j) => (j === i ? { ...st, position: Number(e.target.value) } : st)) })} style={{ flex: 1, accentColor: 'var(--violet)' }} />
            <MiniNumberInput value={s.position} min={0} max={100} width={30} onCommit={(position) => update({ ...g, stops: g.stops.map((st, j) => (j === i ? { ...st, position } : st)) })} />
            <span style={{ fontSize: 10.5, fontFamily: "'Geist Mono', monospace", color: 'var(--text-3)', flex: 'none' }}>%</span>
            {g.stops.length > 2 && <IconBtn icon="ph ph-x" title="Remove stop" onClick={() => update({ ...g, stops: g.stops.filter((_, j) => j !== i) })} />}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Each preset is one real, parseable gradient in this editor's own
            canonical format -- clicking one both applies it AND updates the
            stops list above to match, so it's a starting point to keep
            editing, not a one-way stamp. */}
        <span style={mono()}>Vibrant presets</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {FREEFORM_VIBRANT_PRESETS.map((p) => (
            <button key={p.name} type="button" title={p.name} onClick={() => onChange(p.css)} style={{ height: 36, borderRadius: 8, border: '1px solid var(--border)', background: p.css, cursor: 'pointer', padding: 0 }} />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Stylized gradient backdrops evocative of a landscape's color
            grade -- not real photography, disclosed plainly since this
            environment has no legitimate photo source to pull real
            scenery images from. Same one-click-then-edit behavior as the
            vibrant presets above. */}
        <span style={mono()}>Scenery presets</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {FREEFORM_SCENERY_PRESETS.map((p) => (
            <button key={p.name} type="button" title={p.name} onClick={() => onChange(p.css)} style={{ height: 36, borderRadius: 8, border: '1px solid var(--border)', background: p.css, cursor: 'pointer', padding: 0 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// A shape-fill/button-background/page-background-only third tab on
// ColorField: uploads a photo and writes it as a plain CSS `background`
// shorthand (`url(<data-uri>) center/cover no-repeat`) -- the exact same
// string type every other fill value already is, so no new data field or
// rendering path is needed; the shape's own border-radius/clip-path masks
// it automatically. Video isn't offered: CSS has no background-video, and
// giving these fields a real <video> would need a broader rendering
// change than this pass covers -- disclosed in the empty state below
// rather than faked with a static poster frame.
function MediaFillPicker({ value, onChange }: { value: string | null; onChange: (css: string) => void }) {
  const { state } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'upload' | 'search'>(state.apiStatus.pexels ? 'search' : 'upload');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ height: 100, borderRadius: 8, border: '1px solid var(--border)', background: value ?? 'var(--surface-2)', display: value ? undefined : 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!value && <i className="ph ph-image" style={{ fontSize: 22, color: 'var(--text-3)' }} />}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button type="button" onClick={() => setMode('search')} style={tabBtnStyle(mode === 'search')}>
          Search photos
        </button>
        <button type="button" onClick={() => setMode('upload')} style={tabBtnStyle(mode === 'upload')}>
          Upload
        </button>
      </div>
      {mode === 'search' ? (
        <StockPhotoSearch onPick={onChange} />
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === 'string') onChange(`url(${reader.result}) center/cover no-repeat`);
              };
              reader.readAsDataURL(file);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{ height: 34, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
          >
            {value ? 'Replace image' : 'Upload image'}
          </button>
        </>
      )}
      <p style={{ margin: 0, fontSize: 11, lineHeight: 1.5, color: 'var(--text-3)' }}>Video fill isn't available yet — only image fills work here.</p>
    </div>
  );
}

// Real Pexels search, not a stand-in -- hits the exact same /api/pexels-search
// route the Templates gallery already uses (see fetchStockPhoto in store.tsx),
// just with more results per query (perPage=20 vs that path's perPage=1) and
// its own local state, since this needs a browsable grid rather than one
// cached photo per fixed category query. Picking a result writes the same
// `url(...) center/cover no-repeat` shorthand the Upload tab does, so it
// slots into fill/background exactly the same way -- a real photographer's
// photo becomes the shape/button/page's fill via its real hosted URL (not
// downloaded/re-encoded), same as how the Templates gallery already
// references Pexels images directly rather than mirroring them.
function StockPhotoSearch({ onPick }: { onPick: (css: string) => void }) {
  const { state } = useApp();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [results, setResults] = useState<PexelsPhoto[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  function runSearch() {
    const q = query.trim();
    if (!q || status === 'loading') return;
    setStatus('loading');
    setErrorMsg('');
    fetch(`/api/pexels-search?query=${encodeURIComponent(q)}&perPage=20`)
      .then((r) => r.json())
      .then((data: { photos?: PexelsPhoto[]; error?: string }) => {
        if (data.error || !data.photos) {
          setStatus('error');
          setErrorMsg(data.error || 'No results');
          setResults([]);
          return;
        }
        setResults(data.photos);
        setStatus(data.photos.length ? 'idle' : 'error');
        if (!data.photos.length) setErrorMsg(`No results for "${q}"`);
      })
      .catch((e: Error) => {
        setStatus('error');
        setErrorMsg(e.message);
      });
  }

  if (state.apiStatus.checked && !state.apiStatus.pexels) {
    return (
      <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.6, color: 'var(--text-3)' }}>
        Real photo search needs a Pexels API key set as <code>PEXELS_API_KEY</code> in the environment — the same key the Templates gallery already uses. Once it's set there, search works here too automatically, nothing else to configure.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') runSearch();
          }}
          placeholder="Search real photos…"
          style={{ flex: 1, height: 32, border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', fontSize: 12.5, outline: 'none', background: 'transparent', color: 'var(--text)' }}
        />
        <button
          type="button"
          onClick={runSearch}
          disabled={status === 'loading' || !query.trim()}
          style={{ height: 32, padding: '0 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text)', fontSize: 12, fontWeight: 700, cursor: status === 'loading' ? 'default' : 'pointer' }}
        >
          {status === 'loading' ? '…' : 'Search'}
        </button>
      </div>
      {status === 'error' && <p style={{ margin: 0, fontSize: 11.5, color: 'var(--error)' }}>{errorMsg}</p>}
      {results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              title={`Photo by ${p.photographer} on Pexels`}
              onClick={() => onPick(`url(${p.src}) center/cover no-repeat`)}
              style={{ height: 64, borderRadius: 6, border: '1px solid var(--border)', background: `url(${p.thumb}) center/cover`, cursor: 'pointer', padding: 0 }}
            />
          ))}
        </div>
      )}
      <p style={{ margin: 0, fontSize: 10, lineHeight: 1.5, color: 'var(--text-3)' }}>Real photos via Pexels — hover a result to see its photographer. Free to use; attribution appreciated but not required.</p>
    </div>
  );
}

// A Figma-style swatch: click opens a floating popover with Solid/Gradient
// tabs on top, closing on outside click. Solid and gradient both write
// into the exact same field (a plain CSS `background`-compatible string --
// freeform-types.ts never modeled color as its own type), so nothing else
// needs to know which mode produced the value.
function ColorField({ label, value, onChange, allowMedia }: { label: string; value: string; onChange: (css: string) => void; allowMedia?: boolean }) {
  const [open, setOpen] = useState(false);
  const isGrad = isGradientCss(value);
  const isMedia = allowMedia && isMediaCss(value);
  const safeSolid = !isGrad && !isMedia && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';
  // Which tab is being VIEWED, distinct from what `value` currently is --
  // needed so clicking "Media" can show the upload UI even before a file
  // is picked (there's nothing to onChange to yet at that point). Synced
  // from the real value each time the popover opens.
  const [viewTab, setViewTab] = useState<'solid' | 'gradient' | 'media'>(isGrad ? 'gradient' : isMedia ? 'media' : 'solid');

  function openPopover() {
    setViewTab(isGrad ? 'gradient' : isMedia ? 'media' : 'solid');
    setOpen(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={mono()}>{label}</span>
      <button
        type="button"
        onClick={openPopover}
        style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, border: '1px solid var(--border)', borderRadius: 8, padding: '0 8px', background: 'transparent', cursor: 'pointer' }}
      >
        <span style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--border)', background: value, flex: 'none' }} />
        <span style={{ flex: 1, textAlign: 'left', fontSize: 11.5, fontFamily: "'Geist Mono', monospace", color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {isGrad ? 'Gradient' : isMedia ? 'Image' : value}
        </span>
        <i className="ph ph-caret-down" style={{ fontSize: 12, color: 'var(--text-3)' }} />
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
          <div style={{ position: 'fixed', top: 70, right: 16, width: 300, maxHeight: '80vh', overflowY: 'auto', zIndex: 101, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-lg)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
              <IconBtn icon="ph ph-x" title="Close" onClick={() => setOpen(false)} />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={() => {
                  setViewTab('solid');
                  if (isGrad) onChange(parseFreeformGradient(value)?.stops[0]?.color ?? '#000000');
                  else if (isMedia) onChange('#000000');
                }}
                style={tabBtnStyle(viewTab === 'solid')}
              >
                Solid
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewTab('gradient');
                  if (!isGrad) onChange(`linear-gradient(135deg, ${safeSolid} 0%, #7A47F5 100%)`);
                }}
                style={tabBtnStyle(viewTab === 'gradient')}
              >
                Gradient
              </button>
              {allowMedia && (
                <button type="button" onClick={() => setViewTab('media')} style={tabBtnStyle(viewTab === 'media')}>
                  Media
                </button>
              )}
            </div>
            {viewTab === 'gradient' ? (
              <GradientEditor value={isGrad ? value : `linear-gradient(135deg, ${safeSolid} 0%, #7A47F5 100%)`} onChange={onChange} />
            ) : viewTab === 'media' ? (
              <MediaFillPicker value={isMedia ? value : null} onChange={onChange} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="color" value={safeSolid} onChange={(e) => onChange(e.target.value)} style={{ width: 36, height: 36, padding: 0, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: 'none' }} />
                <input
                  value={isMedia ? safeSolid : value}
                  onChange={(e) => onChange(e.target.value)}
                  style={{ flex: 1, height: 36, border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', fontFamily: "'Geist Mono', monospace", fontSize: 12, color: 'var(--text)', background: 'transparent', outline: 'none' }}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Same floating-popover shell as ColorField, but for picking a font:
// search box + category tabs on top, a scrollable list previewing each
// font in itself, and a free-text fallback so any valid Google Font name
// works even if it isn't in the curated list below.
function FontPicker({ value, onChange }: { value: string; onChange: (family: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<'all' | GoogleFontCategory>('all');
  const [previewFamily, setPreviewFamily] = useState<string | null>(null);

  const filtered = GOOGLE_FONTS.filter((f) => (cat === 'all' || f.category === cat) && f.family.toLowerCase().includes(search.toLowerCase()));
  const builtIns: { key: string; label: string }[] = [
    { key: 'display', label: 'Bricolage Grotesque' },
    { key: 'body', label: 'Plus Jakarta Sans' },
    { key: 'mono', label: 'Geist Mono' },
  ];
  const currentLabel = builtIns.find((b) => b.key === value)?.label ?? value;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={mono()}>Font</span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ height: 36, border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
      >
        <span style={{ fontFamily: resolveFreeformFontCss(value), fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentLabel}</span>
        <i className="ph ph-caret-down" style={{ fontSize: 12, color: 'var(--text-3)', flex: 'none' }} />
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
          <div style={{ position: 'fixed', top: 70, right: 16, width: 320, maxHeight: '75vh', zIndex: 101, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Font</span>
                <IconBtn icon="ph ph-x" title="Close" onClick={() => setOpen(false)} />
              </div>
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fonts…"
                style={{ height: 34, border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', fontSize: 13, outline: 'none', background: 'transparent', color: 'var(--text)' }}
              />
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(['all', 'sans-serif', 'serif', 'display', 'handwriting', 'monospace'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCat(c)}
                    style={{ height: 24, padding: '0 8px', borderRadius: 999, border: `1px solid ${cat === c ? 'var(--violet)' : 'var(--border)'}`, background: cat === c ? 'var(--violet-light)' : 'transparent', color: cat === c ? 'var(--violet-deep)' : 'var(--text-3)', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {c === 'all' ? 'All' : FONT_CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ overflowY: 'auto', padding: 6 }}>
              {search === '' &&
                builtIns.map((b) => (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => {
                      onChange(b.key);
                      setOpen(false);
                    }}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 10px', border: 0, background: value === b.key ? 'var(--violet-light)' : 'transparent', borderRadius: 8, cursor: 'pointer', display: 'block' }}
                  >
                    <div style={{ fontFamily: resolveFreeformFontCss(b.key), fontSize: 16, color: 'var(--text)' }}>{b.label}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: "'Geist Mono', monospace" }}>App font</div>
                  </button>
                ))}
              {filtered.map((f) => (
                <button
                  key={f.family}
                  type="button"
                  onMouseEnter={() => {
                    setPreviewFamily(f.family);
                    loadGoogleFont(f.family);
                  }}
                  onClick={() => {
                    onChange(f.family);
                    setOpen(false);
                  }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 10px', border: 0, background: value === f.family ? 'var(--violet-light)' : 'transparent', borderRadius: 8, cursor: 'pointer', display: 'block' }}
                >
                  <div style={{ fontFamily: previewFamily === f.family || value === f.family ? resolveFreeformFontCss(f.family) : 'inherit', fontSize: 16, color: 'var(--text)' }}>{f.family}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: "'Geist Mono', monospace" }}>{FONT_CATEGORY_LABELS[f.category]}</div>
                </button>
              ))}
              {filtered.length === 0 && <p style={{ padding: 12, fontSize: 12, color: 'var(--text-3)', margin: 0 }}>No matches in the curated list — type an exact Google Fonts name below to load it anyway.</p>}
            </div>
            <div style={{ padding: 10, borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
              <input
                placeholder="Or type any Google Font name…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const v = e.currentTarget.value.trim();
                    if (v) {
                      onChange(v);
                      setOpen(false);
                    }
                  }
                }}
                style={{ flex: 1, height: 32, border: '1px solid var(--border)', borderRadius: 8, padding: '0 8px', fontSize: 12, outline: 'none', background: 'transparent', color: 'var(--text)' }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Deliberately NOT <input type="number"> -- browsers' own clamping/
// formatting on that input type fights a controlled value and was exactly
// why the field couldn't be fully cleared while typing (it kept snapping
// back to a partial number). Plain text input with local, uncommitted
// state instead: typing freely edits local text only; the real value only
// changes on blur or Enter, and an empty/invalid entry reverts to
// whatever the value already was rather than committing anything.
function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  const [text, setText] = useState(String(Math.round(value)));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(String(Math.round(value)));
  }, [value, focused]);

  function commit() {
    const n = Number(text);
    if (text.trim() === '' || !Number.isFinite(n)) {
      setText(String(Math.round(value)));
      return;
    }
    let clamped = n;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);
    onChange(clamped);
    setText(String(Math.round(clamped)));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={mono()}>{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        onFocus={() => setFocused(true)}
        onChange={(e) => setText(e.target.value.replace(/[^0-9.-]/g, ''))}
        onBlur={() => {
          setFocused(false);
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') {
            setText(String(Math.round(value)));
            e.currentTarget.blur();
          }
        }}
        style={{ height: 32, border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', fontFamily: "'Geist Mono', monospace", fontSize: 12, color: 'var(--text)', background: 'transparent', outline: 'none' }}
      />
    </div>
  );
}

// The value next to the label used to be read-only text -- a slider alone
// can't reliably land on an exact number, so this is now a real editable
// field (same commit-on-blur/Enter pattern as NumberField) sitting right
// next to the slider it mirrors; dragging and typing both write the same
// value, whichever's more precise for the moment.
function SliderField({ label, value, onChange, min, max, displaySuffix = '' }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number; displaySuffix?: string }) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  function commit() {
    const n = Number(text);
    if (text.trim() === '' || !Number.isFinite(n)) {
      setText(String(value));
      return;
    }
    const clamped = Math.max(min, Math.min(max, n));
    onChange(clamped);
    setText(String(clamped));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={mono()}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <input
            type="text"
            inputMode="decimal"
            value={text}
            onFocus={() => setFocused(true)}
            onChange={(e) => setText(e.target.value.replace(/[^0-9.-]/g, ''))}
            onBlur={() => {
              setFocused(false);
              commit();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') {
                setText(String(value));
                e.currentTarget.blur();
              }
            }}
            style={{ width: 40, height: 20, border: '1px solid var(--border)', borderRadius: 5, padding: '0 4px', fontFamily: "'Geist Mono', monospace", fontSize: 11, color: 'var(--text-2)', background: 'transparent', outline: 'none', textAlign: 'right' }}
          />
          {displaySuffix && <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: 'var(--text-3)' }}>{displaySuffix}</span>}
        </div>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--violet)' }} />
    </div>
  );
}

const ADD_TOOLS: { type: FreeformElementType; icon: string; label: string }[] = [
  { type: 'text', icon: 'ph ph-text-t', label: 'Text' },
  { type: 'image', icon: 'ph ph-image', label: 'Image' },
  { type: 'button', icon: 'ph ph-cursor-click', label: 'Button' },
];

const SHAPE_KINDS: { kind: FreeformShapeKind; icon: string; label: string }[] = [
  { kind: 'rect', icon: 'ph ph-square', label: 'Rectangle' },
  { kind: 'ellipse', icon: 'ph ph-circle', label: 'Ellipse' },
  { kind: 'triangle', icon: 'ph ph-triangle', label: 'Triangle' },
  { kind: 'pentagon', icon: 'ph ph-pentagon', label: 'Pentagon' },
  { kind: 'hexagon', icon: 'ph ph-hexagon', label: 'Hexagon' },
  { kind: 'star', icon: 'ph ph-star', label: 'Star' },
  { kind: 'arrow', icon: 'ph ph-arrow-right', label: 'Arrow' },
  { kind: 'line', icon: 'ph ph-minus', label: 'Line' },
];

const MOCKUP_KINDS: { kind: 'phone' | 'laptop' | 'browser' | 'tablet'; icon: string; label: string }[] = [
  { kind: 'phone', icon: 'ph ph-device-mobile', label: 'Phone' },
  { kind: 'tablet', icon: 'ph ph-device-tablet', label: 'Tablet' },
  { kind: 'laptop', icon: 'ph ph-laptop', label: 'Laptop' },
  { kind: 'browser', icon: 'ph ph-browser', label: 'Browser' },
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
// undo/redo. The File menu (Save draft / Publish / Export) saves the whole
// doc to My Projects (real localStorage persistence -- see saveFreeformProject
// in store.tsx) and exports real rasterized PNG/JPG/PDF via html2canvas.
export function Customize() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  const [renamingLayerId, setRenamingLayerId] = useState<string | null>(null);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState<string | null>(null);
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [mockupMenuOpen, setMockupMenuOpen] = useState(false);
  const [aspectLocked, setAspectLocked] = useState(false);
  const [leftWidth, setLeftWidth] = useState(220);
  const [rightWidth, setRightWidth] = useState(280);
  const [layersHeight, setLayersHeight] = useState(180);
  const aspectRatioRef = useRef(1);
  const mainRef = useRef<HTMLElement>(null);
  const pageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const surfaceRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  // The W/H lock-aspect-ratio toggle is a transient UI mode, not part of
  // the element's own data -- reset it whenever the single selection
  // changes so it doesn't silently carry over and scale an unrelated
  // element the next time a W/H field is edited.
  const soleSelectedId = state.freeformSelectedIds.length === 1 ? state.freeformSelectedIds[0] : null;
  useEffect(() => {
    setAspectLocked(false);
  }, [soleSelectedId]);

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

  // Drag-to-resize for the two side panels (width) and the Layers list
  // (height) -- a generic pointer-delta-to-clamped-value helper shared by
  // all three, rather than three copies of the same drag math.
  function startEdgeResize(e: React.PointerEvent, axis: 'x' | 'y', get: () => number, set: (n: number) => void, min: number, max: number, invert = false) {
    e.preventDefault();
    e.stopPropagation();
    const start = axis === 'x' ? e.clientX : e.clientY;
    const startVal = get();
    const mv = (ev: PointerEvent) => {
      const delta = (axis === 'x' ? ev.clientX : ev.clientY) - start;
      set(Math.max(min, Math.min(max, Math.round(startVal + (invert ? -delta : delta)))));
    };
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  }

  function exportPages(): { name: string; el: HTMLDivElement }[] {
    return pages.map((p) => ({ name: p.name, el: surfaceRefs.current[p.id] })).filter((x): x is { name: string; el: HTMLDivElement } => !!x.el);
  }

  async function coverThumb(): Promise<string | undefined> {
    const el = surfaceRefs.current[pages[0]?.id];
    if (!el) return undefined;
    const thumb = await captureFreeformCoverThumb(el);
    return thumb ?? undefined;
  }

  async function handleSaveDraft() {
    setFileMenuOpen(false);
    actions.selectFreeform(activePage.id, null);
    const cover = await coverThumb();
    actions.saveFreeformProject({ cover });
  }

  async function handlePublish() {
    setFileMenuOpen(false);
    actions.selectFreeform(activePage.id, null);
    const cover = await coverThumb();
    actions.saveFreeformProject({ publish: true, cover });
  }

  async function handleExport(format: 'png' | 'jpg' | 'pdf') {
    setFileMenuOpen(false);
    actions.selectFreeform(activePage.id, null);
    setExportBusy(format);
    // Let the deselect re-render (clears selection outlines/handles) commit
    // before capturing, so the export never includes editing chrome.
    await new Promise((r) => setTimeout(r, 60));
    try {
      const targets = exportPages();
      if (format === 'pdf') await exportFreeformPagesAsPdf(targets, state.title || activePage.name);
      else await exportFreeformPagesAsImages(targets, format, state.title || activePage.name);
    } catch {
      actions.say('Export failed — try again, or export fewer pages at once.');
    } finally {
      setExportBusy(null);
    }
  }

  return (
    <div
      onClick={(e) => {
        // Clicking anywhere that isn't the header chrome or a side panel
        // (which includes their floating popovers -- see the comment
        // below) deselects the current element. Real canvas elements
        // already stopPropagation() on their own click/pointerdown, so
        // this only ever fires for genuine empty-space clicks.
        const t = e.target as HTMLElement;
        if (t.closest('header, aside')) return;
        actions.selectFreeform(activePage.id, null);
      }}
      style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)' }}
    >
      <header style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Logo height={22} />
          <Link to="/templates" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
            <i className="ph ph-arrow-left" style={{ fontSize: 14 }} />
            Templates
          </Link>
          <span style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <input
            value={state.title}
            onChange={(e) => actions.setTitle(e.target.value)}
            placeholder="Untitled case study"
            style={{ width: 200, height: 30, border: '1px solid transparent', borderRadius: 8, padding: '0 8px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13.5, color: 'var(--text)', background: 'transparent', outline: 'none' }}
            onFocus={(e) => (e.currentTarget.style.border = '1px solid var(--border)')}
            onBlur={(e) => (e.currentTarget.style.border = '1px solid transparent')}
          />
          {state.published && (
            <span style={{ height: 22, padding: '0 8px', borderRadius: 999, background: 'var(--success-bg)', color: 'var(--success)', fontFamily: "'Geist Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <i className="ph-fill ph-check-circle" style={{ fontSize: 11 }} />
              Published
            </span>
          )}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setFileMenuOpen((v) => !v)}
              style={{ height: 30, padding: '0 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              File
              <i className="ph ph-caret-down" style={{ fontSize: 11 }} />
            </button>
            {fileMenuOpen && (
              <>
                <div onClick={() => setFileMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
                <div style={{ position: 'absolute', top: 36, left: 0, width: 220, zIndex: 101, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FileMenuItem icon="ph ph-floppy-disk" label="Save as draft" onClick={handleSaveDraft} />
                  <FileMenuItem icon="ph ph-rocket-launch" label="Publish" onClick={handlePublish} />
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                  <FileMenuItem icon="ph ph-file-png" label={exportBusy === 'png' ? 'Exporting…' : 'Export as PNG'} onClick={() => handleExport('png')} disabled={!!exportBusy} />
                  <FileMenuItem icon="ph ph-file-jpg" label={exportBusy === 'jpg' ? 'Exporting…' : 'Export as JPG'} onClick={() => handleExport('jpg')} disabled={!!exportBusy} />
                  <FileMenuItem icon="ph ph-file-pdf" label={exportBusy === 'pdf' ? 'Exporting…' : 'Export as PDF'} onClick={() => handleExport('pdf')} disabled={!!exportBusy} />
                  <p style={{ margin: '4px 8px 2px', fontSize: 10.5, lineHeight: 1.5, color: 'var(--text-3)' }}>Multiple pages export as one PDF, or a .zip of PNG/JPG files.</p>
                </div>
              </>
            )}
          </div>
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
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShapeMenuOpen((v) => !v)}
              title="Add a shape"
              style={{ height: 34, padding: '0 10px 0 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <i className="ph ph-square" style={{ fontSize: 14 }} />
              Shape
              <i className="ph ph-caret-down" style={{ fontSize: 10 }} />
            </button>
            {shapeMenuOpen && (
              <>
                <div onClick={() => setShapeMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
                <div style={{ position: 'absolute', top: 38, right: 0, width: 168, zIndex: 101, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', padding: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  {SHAPE_KINDS.map((s) => (
                    <button
                      key={s.kind}
                      type="button"
                      onClick={() => {
                        actions.addFreeformElement(activePage.id, 'shape', s.kind);
                        setShapeMenuOpen(false);
                      }}
                      title={s.label}
                      style={{ height: 56, border: 0, borderRadius: 8, background: 'transparent', color: 'var(--text-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', fontSize: 9.5, fontFamily: "'Geist Mono', monospace" }}
                    >
                      <i className={s.icon} style={{ fontSize: 18 }} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setMockupMenuOpen((v) => !v)}
              title="Add a device mockup"
              style={{ height: 34, padding: '0 10px 0 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <i className="ph ph-device-mobile" style={{ fontSize: 14 }} />
              Mockup
              <i className="ph ph-caret-down" style={{ fontSize: 10 }} />
            </button>
            {mockupMenuOpen && (
              <>
                <div onClick={() => setMockupMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
                <div style={{ position: 'absolute', top: 38, right: 0, width: 220, zIndex: 101, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {MOCKUP_KINDS.map((m) => (
                    <div key={m.kind} style={{ display: 'flex', gap: 2 }}>
                      <button
                        type="button"
                        onClick={() => {
                          actions.addFreeformMockup(activePage.id, m.kind, false);
                          setMockupMenuOpen(false);
                        }}
                        style={{ flex: 1, height: 34, border: 0, borderRadius: 8, background: 'transparent', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }}
                      >
                        <i className={m.icon} style={{ fontSize: 15, color: 'var(--text-2)' }} />
                        {m.label}
                      </button>
                      <button
                        type="button"
                        title={`${m.label}, tilted`}
                        onClick={() => {
                          actions.addFreeformMockup(activePage.id, m.kind, true);
                          setMockupMenuOpen(false);
                        }}
                        style={{ width: 34, height: 34, border: 0, borderRadius: 8, background: 'transparent', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <i className="ph ph-arrows-clockwise" style={{ fontSize: 14 }} />
                      </button>
                    </div>
                  ))}
                  <p style={{ margin: '4px 8px 2px', fontSize: 10.5, lineHeight: 1.5, color: 'var(--text-3)' }}>The rotate icon adds a tilted variant. Frame + screen insert together — the screen is locked/crop-ready, ready to replace.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <aside style={{ position: 'relative', flex: 'none', width: leftWidth, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div
            onPointerDown={(e) => startEdgeResize(e, 'x', () => leftWidth, setLeftWidth, 180, 420)}
            title="Drag to resize"
            style={{ position: 'absolute', top: 0, bottom: 0, right: -4, width: 8, cursor: 'ew-resize', zIndex: 5 }}
          />
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
                  {renamingPageId !== p.id && <IconBtn icon="ph ph-pencil-simple" title="Rename page" onClick={(e) => { e.stopPropagation(); setRenamingPageId(p.id); }} />}
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
                    onResizeHeight={(height) => actions.setFreeformPageHeight(p.id, height)}
                    onSurfaceRef={(el) => {
                      surfaceRefs.current[p.id] = el;
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </main>

        <aside style={{ position: 'relative', flex: 'none', width: rightWidth, borderLeft: '1px solid var(--border)', overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            onPointerDown={(e) => startEdgeResize(e, 'x', () => rightWidth, setRightWidth, 220, 480, true)}
            title="Drag to resize"
            style={{ position: 'absolute', top: 0, bottom: 0, left: -4, width: 8, cursor: 'ew-resize', zIndex: 5 }}
          />
          {/* Elements can overlap (e.g. Cover's dark scrim sits directly on
              top of its full-bleed photo) -- clicking the canvas only ever
              reaches the topmost one at that point, same as any layered
              editor. This list is the way to reach whatever's underneath. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={mono()}>Layers · {activePage.name}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: layersHeight, overflowY: 'auto' }}>
              {[...activePage.elements]
                .sort((a, b) => b.zIndex - a.zIndex)
                .map((el) => {
                  const active = selectedIds.includes(el.id);
                  const icon = el.type === 'text' ? 'ph ph-text-t' : el.type === 'image' ? 'ph ph-image' : el.type === 'shape' ? 'ph ph-square' : 'ph ph-cursor-click';
                  const autoLabel = el.type === 'text' ? el.text.slice(0, 30) || 'Text' : el.type === 'button' ? el.text : el.type.charAt(0).toUpperCase() + el.type.slice(1);
                  const label = el.name || autoLabel;
                  return (
                    <div
                      key={el.id}
                      onClick={(e) => actions.selectFreeform(activePage.id, el.id, e.shiftKey)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 7, cursor: 'pointer', background: active ? 'var(--violet-light)' : 'transparent' }}
                    >
                      <i className={icon} style={{ fontSize: 13, color: active ? 'var(--violet-deep)' : 'var(--text-3)', flex: 'none' }} />
                      {renamingLayerId === el.id ? (
                        <input
                          autoFocus
                          defaultValue={label}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => {
                            actions.patchFreeformElement(activePage.id, el.id, { name: e.target.value.trim() || undefined });
                            setRenamingLayerId(null);
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                          style={{ flex: 1, minWidth: 0, height: 22, border: '1px solid var(--violet)', borderRadius: 5, padding: '0 6px', fontSize: 12, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
                        />
                      ) : (
                        <span
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setRenamingLayerId(el.id);
                          }}
                          style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: active ? 700 : 500, color: active ? 'var(--violet-deep)' : 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {label}
                        </span>
                      )}
                      {renamingLayerId !== el.id && (
                        <IconBtn
                          icon="ph ph-pencil-simple"
                          title="Rename layer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingLayerId(el.id);
                          }}
                        />
                      )}
                    </div>
                  );
                })}
            </div>
            <div
              onPointerDown={(e) => startEdgeResize(e, 'y', () => layersHeight, setLayersHeight, 60, 520)}
              title="Drag to resize the layers list"
              style={{ height: 8, margin: '-2px 0', cursor: 'ns-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span style={{ width: 26, height: 3, borderRadius: 2, background: 'var(--border-strong)' }} />
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={mono()}>Align</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[
                    { mode: 'left' as const, icon: 'ph ph-align-left' },
                    { mode: 'centerH' as const, icon: 'ph ph-align-center-horizontal' },
                    { mode: 'right' as const, icon: 'ph ph-align-right' },
                  ].map((a) => (
                    <button key={a.mode} type="button" title={`Align ${a.mode}`} onClick={() => actions.alignFreeformElements(selectedPage.id, selectedIds, a.mode)} style={alignBtnStyle()}>
                      <i className={a.icon} style={{ fontSize: 15 }} />
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[
                    { mode: 'top' as const, icon: 'ph ph-align-top' },
                    { mode: 'centerV' as const, icon: 'ph ph-align-center-vertical' },
                    { mode: 'bottom' as const, icon: 'ph ph-align-bottom' },
                  ].map((a) => (
                    <button key={a.mode} type="button" title={`Align ${a.mode}`} onClick={() => actions.alignFreeformElements(selectedPage.id, selectedIds, a.mode)} style={alignBtnStyle()}>
                      <i className={a.icon} style={{ fontSize: 15 }} />
                    </button>
                  ))}
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
                  <IconBtn
                    icon={selected.locked ? 'ph-fill ph-lock-simple' : 'ph ph-lock-simple-open'}
                    title={selected.locked ? 'Unlock (allow moving/resizing again)' : 'Lock position (still editable/replaceable)'}
                    onClick={() => patchSelected({ locked: !selected.locked })}
                  />
                  <IconBtn icon="ph ph-trash" title="Delete" danger onClick={() => actions.removeFreeformElement(selectedPage.id, selected.id)} />
                </div>
              </div>

              {selected.type === 'text' && (
                <>
                  <FontPicker value={selected.fontFamily} onChange={(fontFamily) => patchSelected({ fontFamily })} />
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
                  {/* A real dropdown, not the previous Cover/Contain button
                      pair plus a separate drag-a-dot crop widget -- "Crop"
                      turns on the same pan (drag on canvas) / zoom (drag a
                      handle) interaction a locked mockup image already
                      uses, generalized to work on ANY image via the new
                      cropEnabled field (see freeform-types.ts), not just
                      locked ones. Switching back to Fill/Fit turns it off
                      and returns to normal move/resize. */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={mono()}>Fit</span>
                    <select
                      value={selected.objectFit === 'contain' ? 'fit' : selected.cropEnabled ? 'crop' : 'fill'}
                      onChange={(e) => {
                        const mode = e.target.value;
                        if (mode === 'fit') patchSelected({ objectFit: 'contain', cropEnabled: false });
                        else if (mode === 'crop') patchSelected({ objectFit: 'cover', cropEnabled: true });
                        else patchSelected({ objectFit: 'cover', cropEnabled: false });
                      }}
                      style={{ height: 34, border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text)', background: 'transparent', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="fill">Fill</option>
                      <option value="fit">Fit</option>
                      <option value="crop">Crop</option>
                    </select>
                  </div>
                  <NumberField label="Corner radius" value={selected.borderRadius} min={0} max={999} onChange={(borderRadius) => patchSelected({ borderRadius })} />

                  {(selected.locked || selected.cropEnabled) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <SliderField label="Zoom" min={100} max={400} value={Math.round((selected.zoom ?? 1) * 100)} onChange={(v) => patchSelected({ zoom: v / 100 })} displaySuffix="%" />
                      <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: 'var(--text-3)' }}>
                        Zoom stays centered and clipped to the frame — it can never spill outside it. Drag a handle on the canvas to zoom, or the number above.{' '}
                        {selected.groupId
                          ? 'This is part of a mockup — drag any piece of it on the canvas to move the whole thing.'
                          : selected.locked
                            ? "This frame is locked in place and won't move or resize."
                            : 'Switch back to Fill or Fit to move/resize this image normally again.'}
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                    <span style={mono()}>Adjustments</span>
                    <SliderField label="Opacity" min={0} max={100} value={Math.round((selected.opacity ?? 1) * 100)} onChange={(v) => patchSelected({ opacity: v / 100 })} displaySuffix="%" />
                    <SliderField label="Blur" min={0} max={20} value={selected.blur ?? 0} onChange={(blur) => patchSelected({ blur })} displaySuffix="px" />
                    <SliderField label="Exposure" min={40} max={160} value={selected.brightness ?? 100} onChange={(brightness) => patchSelected({ brightness })} displaySuffix="%" />
                    <SliderField label="Contrast" min={40} max={160} value={selected.contrast ?? 100} onChange={(contrast) => patchSelected({ contrast })} displaySuffix="%" />
                    <SliderField label="Saturation" min={0} max={200} value={selected.saturation ?? 100} onChange={(saturation) => patchSelected({ saturation })} displaySuffix="%" />
                    <SliderField label="Temperature" min={-100} max={100} value={selected.temperature ?? 0} onChange={(temperature) => patchSelected({ temperature })} />
                    <button
                      type="button"
                      onClick={() => patchSelected({ opacity: 1, blur: 0, brightness: 100, contrast: 100, saturation: 100, temperature: 0, focalX: 50, focalY: 50 })}
                      style={{ height: 32, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-2)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <i className="ph ph-arrow-counter-clockwise" style={{ fontSize: 14 }} />
                      Reset adjustments
                    </button>
                  </div>

                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--text-3)' }}>Select the image on the canvas and use "Replace image" to upload your own.</p>
                </>
              )}

              {selected.type === 'shape' && (
                <>
                  <ColorField label="Fill" value={selected.fill} onChange={(fill) => patchSelected({ fill })} allowMedia />
                  <NumberField label="Corner radius" value={selected.borderRadius} min={0} max={999} onChange={(borderRadius) => patchSelected({ borderRadius })} />
                  <SliderField label="Opacity" min={0} max={100} value={Math.round(selected.opacity * 100)} onChange={(v) => patchSelected({ opacity: v / 100 })} displaySuffix="%" />
                  {(selected.shape === 'rect' || selected.shape === 'ellipse') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={mono()}>Stroke</span>
                        {selected.stroke ? (
                          <button type="button" onClick={() => patchSelected({ stroke: undefined, strokeWidth: undefined })} style={{ height: 20, padding: '0 8px', border: '1px solid var(--border)', borderRadius: 999, background: 'transparent', color: 'var(--text-3)', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>
                            Remove
                          </button>
                        ) : (
                          <button type="button" onClick={() => patchSelected({ stroke: '#14141A', strokeWidth: 2 })} style={{ height: 20, padding: '0 8px', border: '1px solid var(--violet)', borderRadius: 999, background: 'var(--violet-light)', color: 'var(--violet-deep)', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>
                            Add
                          </button>
                        )}
                      </div>
                      {selected.stroke && (
                        <>
                          <ColorField label="Stroke color" value={selected.stroke} onChange={(stroke) => patchSelected({ stroke })} />
                          <NumberField label="Stroke width" value={selected.strokeWidth ?? 2} min={1} max={40} onChange={(strokeWidth) => patchSelected({ strokeWidth })} />
                        </>
                      )}
                    </div>
                  )}
                  {/* A scoped-down stand-in for a true freehand "pencil
                      tool" path editor (a full vector anchor-point editor
                      is out of reach for this pass): blur softens the
                      shape, skew shears it -- real, working distortion,
                      just not literally hand-redrawing the outline. */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                    <span style={mono()}>Distort</span>
                    <SliderField label="Blur" min={0} max={20} value={selected.blur ?? 0} onChange={(blur) => patchSelected({ blur })} displaySuffix="px" />
                    <SliderField label="Skew X" min={-60} max={60} value={selected.skewX ?? 0} onChange={(skewX) => patchSelected({ skewX })} displaySuffix="°" />
                    <SliderField label="Skew Y" min={-60} max={60} value={selected.skewY ?? 0} onChange={(skewY) => patchSelected({ skewY })} displaySuffix="°" />
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
                  <ColorField label="Background" value={selected.bg} onChange={(bg) => patchSelected({ bg })} allowMedia />
                  <ColorField label="Text color" value={selected.color} onChange={(color) => patchSelected({ color })} />
                </>
              )}

              {/* Generic rotate -- every element type, not just shapes/
                  mockups -- applied to the whole element (see
                  FreeformCanvas's wrap-level transform). */}
              <SliderField label="Rotate" min={-180} max={180} value={selected.rotate ?? 0} onChange={(rotate) => patchSelected({ rotate })} displaySuffix="°" />

              {!(selected.type === 'image' && (selected.locked || selected.cropEnabled)) && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <div style={{ width: 76, flex: 'none' }}>
                    <NumberField
                      label="W"
                      value={selected.w}
                      min={8}
                      onChange={(w) => {
                        if (aspectLocked) patchSelected({ w, h: Math.max(8, Math.round(w / aspectRatioRef.current)) });
                        else patchSelected({ w });
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    title={aspectLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                    onClick={() => {
                      if (!aspectLocked) aspectRatioRef.current = selected.w / selected.h || 1;
                      setAspectLocked((v) => !v);
                    }}
                    style={{ width: 32, height: 32, flex: 'none', border: `1px solid ${aspectLocked ? 'var(--violet)' : 'var(--border)'}`, borderRadius: 8, background: aspectLocked ? 'var(--violet-light)' : 'transparent', color: aspectLocked ? 'var(--violet-deep)' : 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <i className={aspectLocked ? 'ph-fill ph-link-simple' : 'ph ph-link-simple-break'} style={{ fontSize: 14 }} />
                  </button>
                  <div style={{ width: 76, flex: 'none' }}>
                    <NumberField
                      label="H"
                      value={selected.h}
                      min={8}
                      onChange={(h) => {
                        if (aspectLocked) patchSelected({ h, w: Math.max(8, Math.round(h * aspectRatioRef.current)) });
                        else patchSelected({ h });
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <span style={mono()}>Page background</span>
              <ColorField label="Color" value={activePage.backgroundColor} onChange={(hex) => actions.setFreeformPageBackground(activePage.id, hex)} allowMedia />
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
