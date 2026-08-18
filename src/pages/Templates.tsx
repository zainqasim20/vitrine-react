import { useEffect, useState } from 'react';
import { useApp } from '../lib/store';
import { TEMPLATE_CATEGORIES, TEMPLATES, TEMPLATE_QUERY } from '../lib/data';
import { TemplateThumb } from '../components/TemplateThumb';

export function Templates() {
  const { state, actions } = useApp();
  const [hover, setHover] = useState<string | null>(null);
  const filtered = state.templateFilter === 'All' ? TEMPLATES : TEMPLATES.filter((t) => t.cat === state.templateFilter);

  // Real Pexels fetch, triggered per visible template's query -- mirrors the
  // live site's render()-triggers-a-fetch getStockPhoto() model, adapted to
  // React (which can't fetch during render itself).
  useEffect(() => {
    filtered.forEach((t) => actions.fetchStockPhoto(TEMPLATE_QUERY[t.kind]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.templateFilter, state.apiStatus.checked, state.apiStatus.pexels]);

  return (
    <>
      <h1 style={{ margin: '0 0 6px', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 28 }}>Templates</h1>
      <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-2)' }}>Presentation styles, not categories — pick a starting point, then art-direct it in Refine.</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {TEMPLATE_CATEGORIES.map((c) => {
          const active = state.templateFilter === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => actions.setTemplateFilter(c)}
              style={{
                height: 32,
                padding: '0 14px',
                borderRadius: 999,
                border: active ? '1px solid transparent' : '1px solid var(--border)',
                background: active ? 'var(--violet-gradient)' : 'transparent',
                color: active ? '#FFFFFF' : 'var(--text-2)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
        {filtered.map((t) => {
          const query = TEMPLATE_QUERY[t.kind];
          const stock = actions.getStockPhoto(query);
          const isReady = stock.status === 'ready';
          const tagTitle =
            stock.status === 'unavailable'
              ? 'Live photos need a Pexels key'
              : stock.status === 'error'
                ? 'Sample photo unavailable right now'
                : isReady
                  ? `Photo: ${stock.photo.photographer} / Pexels`
                  : 'Loading sample photo…';
          return (
          <div key={t.name} style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', background: 'var(--surface)' }}>
            <div
              onMouseEnter={() => setHover(t.name)}
              onMouseLeave={() => setHover(null)}
              style={{ position: 'relative', aspectRatio: '4 / 3', borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: isReady ? 0 : 20 }}
            >
              {isReady ? (
                <img
                  src={stock.photo.thumb}
                  alt={stock.photo.alt || t.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <TemplateThumb kind={t.kind} />
              )}
              <span
                title={tagTitle}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: 10,
                  height: 20,
                  padding: '0 8px',
                  borderRadius: 999,
                  background: 'var(--surface-3)',
                  color: 'var(--text-3)',
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 9.5,
                  letterSpacing: '0.03em',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                Sample
              </span>
              {hover === t.name && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(20,20,26,0.55)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => actions.useTemplate(t.name)}
                    style={{
                      width: '100%',
                      height: 40,
                      border: 0,
                      borderRadius: 10,
                      background: 'var(--violet-gradient)',
                      color: '#FFFFFF',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 13.5,
                      cursor: 'pointer',
                    }}
                  >
                    Use template
                  </button>
                </div>
              )}
            </div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, letterSpacing: '0.03em', color: 'var(--text-3)' }}>{t.desc}</span>
            </div>
          </div>
          );
        })}
      </div>
    </>
  );
}
