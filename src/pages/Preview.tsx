import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../lib/store';
import type { CanvasSection } from '../lib/types';
import { NarrationIntro } from '../components/NarrationIntro';

// Real, public case-study preview -- ported from the live site's
// renderPreview()/renderPreviewSection() family. Reads the same
// canvasSections() the Refine canvas renders from, so this can never
// silently disagree with what the designer actually approved and edited.
// Layout/theme are real, applied here for real; the Micro-interactions fx
// (image hover, cursor, scroll reveal) Refine's fx panel already lets you
// configure also run here for real, for the first time.
//
// Note: the live site's four preview themes (minimal/editorial/bold/
// playful) are named/swatched in the source I was given, but I wasn't
// shown their actual CSS -- these are my own reasonable visual
// interpretations from the swatch colors, not a byte-for-byte port. Flag
// it if they look different from what you see live.

const LAYOUTS: Array<{ key: 'stacked' | 'side-by-side' | 'compact'; icon: string; label: string }> = [
  { key: 'stacked', icon: 'ph ph-rows', label: 'Stacked' },
  { key: 'side-by-side', icon: 'ph ph-columns', label: 'Side by side' },
  { key: 'compact', icon: 'ph ph-list-dashes', label: 'Compact' },
];

const THEMES: Array<{ key: 'minimal' | 'editorial' | 'bold' | 'playful'; label: string; swatch: string; accent: string; heading: string; bodyFont: string }> = [
  { key: 'minimal', label: 'Minimal', swatch: '#7A47F5', accent: '#7A47F5', heading: "'Bricolage Grotesque', sans-serif", bodyFont: "'Plus Jakarta Sans', sans-serif" },
  { key: 'editorial', label: 'Editorial', swatch: '#8A6D3B', accent: '#8A6D3B', heading: "'Bricolage Grotesque', serif", bodyFont: "'Plus Jakarta Sans', sans-serif" },
  { key: 'bold', label: 'Bold', swatch: '#14141A', accent: '#14141A', heading: "'Bricolage Grotesque', sans-serif", bodyFont: "'Plus Jakarta Sans', sans-serif" },
  { key: 'playful', label: 'Playful', swatch: '#FF6F91', accent: '#FF6F91', heading: "'Bricolage Grotesque', sans-serif", bodyFont: "'Plus Jakarta Sans', sans-serif" },
];

export function Preview() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const sections = actions.canvasSections();
  const theme = THEMES.find((t) => t.key === state.previewTheme) || THEMES[0];
  const layout = state.previewLayout;
  const cursorDot = state.cursorFx === 'Dot';
  const [cursor, setCursor] = useState({ x: 0, y: 0, active: false, visible: false });

  if (!sections.length) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '96px 32px', background: 'var(--bg)', color: 'var(--text)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
          <i className="ph ph-eye-slash" style={{ fontSize: 24, color: 'var(--text-3)' }} />
          <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 28, lineHeight: 1.2, letterSpacing: '-0.02em' }}>Nothing to preview yet</h3>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-2)', maxWidth: '48ch' }}>
            Approve at least one section in the review step before previewing the compiled case study.
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

  return (
    <main
      onMouseMove={(e) => {
        if (!cursorDot) return;
        const overInteractive = !!(e.target as HTMLElement).closest('button, a, [data-hover-target]');
        setCursor({ x: e.clientX, y: e.clientY, active: overInteractive, visible: true });
      }}
      style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', cursor: cursorDot ? 'none' : 'default', paddingBottom: 120 }}
    >
      <div style={{ position: 'sticky', top: 0, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '16px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: 3, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 999 }}>
          {LAYOUTS.map((l) => {
            const on = layout === l.key;
            return (
              <button
                key={l.key}
                type="button"
                title={l.label}
                onClick={() => actions.setPreviewLayout(l.key)}
                style={{ width: 34, height: 34, border: 0, borderRadius: 999, background: on ? 'var(--surface)' : 'transparent', color: on ? 'var(--violet-deep)' : 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <i className={l.icon} style={{ fontSize: 16 }} />
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {THEMES.map((t) => {
            const on = theme.key === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => actions.setPreviewTheme(t.key)}
                style={{
                  height: 32,
                  padding: '0 12px',
                  border: `1.5px solid ${on ? t.swatch : 'var(--border)'}`,
                  borderRadius: 999,
                  background: on ? 'var(--surface-2)' : 'transparent',
                  color: 'var(--text)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: t.swatch, flex: 'none' }} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 0' }}>
        <h1 style={{ fontFamily: theme.heading, fontWeight: 600, fontSize: 44, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 16 }}>
          {state.title || 'Untitled case study'}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 56 }}>
          <span style={mono()}>
            Case study · {sections.length} {sections.length === 1 ? 'section' : 'sections'}
          </span>
          <span style={{ flex: 'none', width: 24, height: 1, background: 'var(--border)' }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 24, height: 24, borderRadius: 8, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}CC)`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ph-fill ph-sparkle" style={{ fontSize: 14, color: '#FFFFFF' }} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Northwind</span>
          </div>
        </div>

        {state.pipeline.narration && (
          <NarrationIntro
            problemStatement={state.pipeline.narration.problemStatement}
            outcomeFraming={state.pipeline.narration.outcomeFraming}
            bodyFont={theme.bodyFont}
            marginBottom={56}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
          {sections.map((sec) => (
            <RevealItem key={sec.id} enabled={state.reveal} amount={state.revealAmt}>
              <PreviewSectionBlock sec={sec} layout={layout} theme={theme} imgFx={state.imgFx} />
            </RevealItem>
          ))}
        </div>
      </div>

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 24, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
        <MadeWithBadge accent={theme.accent} feedback={state.btnFx} />
      </div>

      {cursorDot && cursor.visible && (
        <span
          style={{
            position: 'fixed',
            left: cursor.x,
            top: cursor.y,
            width: cursor.active ? 28 : 14,
            height: cursor.active ? 28 : 14,
            marginLeft: cursor.active ? -14 : -7,
            marginTop: cursor.active ? -14 : -7,
            borderRadius: '50%',
            background: theme.accent,
            opacity: cursor.active ? 0.9 : 0.6,
            pointerEvents: 'none',
            zIndex: 50,
            transition: 'width 140ms ease-out, height 140ms ease-out, margin 140ms ease-out, opacity 140ms ease-out',
          }}
        />
      )}
    </main>
  );
}

function MadeWithBadge({ accent, feedback }: { accent: string; feedback: string }) {
  const [pressed, setPressed] = useState(false);
  const scale = feedback === 'Scale' && pressed ? 0.96 : 1;
  const color = feedback === 'Color' && pressed ? accent : 'var(--text)';
  const underline = feedback === 'Underline' && pressed;
  return (
    <button
      type="button"
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      data-hover-target
      style={{
        pointerEvents: 'auto',
        height: 44,
        padding: '0 18px',
        border: '1px solid var(--border)',
        borderRadius: 999,
        background: 'var(--surface)',
        color,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 700,
        fontSize: 13,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: 'var(--shadow-lg)',
        transform: `scale(${scale})`,
        textDecoration: underline ? 'underline' : 'none',
        transition: 'transform 120ms ease-out, color 120ms ease-out',
      }}
    >
      <i className="ph-fill ph-sparkle" style={{ fontSize: 14, color: accent }} />
      Made with Vitrine
    </button>
  );
}

function RevealItem({ enabled, amount, children }: { enabled: boolean; amount: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!enabled);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [enabled]);

  const distance = amount === 'Normal' ? 24 : 10;
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : `translateY(${distance}px)`,
        transition: 'opacity 500ms ease-out, transform 500ms ease-out',
      }}
    >
      {children}
    </div>
  );
}

function PreviewSectionBlock({
  sec,
  layout,
  theme,
  imgFx,
}: {
  sec: CanvasSection;
  layout: 'stacked' | 'side-by-side' | 'compact';
  theme: (typeof THEMES)[number];
  imgFx: string;
}) {
  if (sec.kind === 'design-system') return <DesignSystemPreviewBlock sec={sec} />;
  if (sec.kind === 'generated') return <GeneratedPreviewBlock sec={sec} theme={theme} />;

  const [hovered, setHovered] = useState(false);
  const hoverTransform = imgFx === 'Zoom' && hovered ? 'scale(1.03)' : imgFx === 'Lift' && hovered ? 'translateY(-4px)' : 'none';
  const imageFirst = layout !== 'side-by-side';
  const row = layout === 'side-by-side' || layout === 'compact';
  const imgWrap = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-hover-target
      style={{
        flex: row ? '0 0 auto' : 'none',
        width: row ? (layout === 'compact' ? 160 : '46%') : '100%',
        aspectRatio: layout === 'compact' ? '4 / 3' : '16 / 10',
        overflow: 'hidden',
        borderRadius: 12,
        border: '1px solid var(--border)',
        boxShadow: '0 8px 20px rgba(20,20,26,0.08)',
      }}
    >
      {sec.file.url && (
        <img
          src={sec.file.url}
          alt={sec.file.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hoverTransform, transition: 'transform 220ms ease-out' }}
        />
      )}
    </div>
  );
  const textBlock = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: row ? 1 : 'none', marginTop: row ? 0 : 20 }}>
      <h3 style={{ fontFamily: theme.heading, fontWeight: 600, fontSize: layout === 'compact' ? 20 : 26, lineHeight: 1.25, letterSpacing: '-0.01em' }}>{sec.headline}</h3>
      <p style={{ fontFamily: theme.bodyFont, fontSize: layout === 'compact' ? 14 : 16, lineHeight: 1.65, color: 'var(--text-2)' }}>{sec.body}</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: row ? 'row' : 'column', alignItems: row ? 'center' : 'stretch', gap: row ? 28 : 0 }}>
      {imageFirst ? (
        <>
          {imgWrap}
          {textBlock}
        </>
      ) : (
        <>
          {textBlock}
          {imgWrap}
        </>
      )}
    </div>
  );
}

// Design-system section: colors + components only, matching the live
// site's renderDesignSystemPreviewSection() exactly (no typography row).
function DesignSystemPreviewBlock({ sec }: { sec: Extract<CanvasSection, { kind: 'design-system' }> }) {
  const { content } = sec;
  const hasComponents = Object.entries(content.components).some(([, v]) => v.count > 0);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <span style={mono()}>Extracted, not inferred</span>
      {content.colors.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {content.colors.slice(0, 8).map((c) => (
            <span key={c.hex} title={`${c.hex} — ${c.role}`} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: c.hex }} />
          ))}
        </div>
      )}
      {hasComponents && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(content.components)
            .filter(([, v]) => v.count > 0)
            .map(([k, v]) => (
              <span key={k} style={{ height: 26, padding: '0 10px', borderRadius: 999, background: 'var(--surface-2)', color: 'var(--text-2)', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', textTransform: 'capitalize' }}>
                {k} · {v.count}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

function GeneratedPreviewBlock({ sec, theme }: { sec: Extract<CanvasSection, { kind: 'generated' }>; theme: (typeof THEMES)[number] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ height: 220, borderRadius: 12, border: '1.5px dashed var(--border)', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <i className="ph ph-image-square" style={{ fontSize: 26, color: 'var(--text-3)' }} />
        <span style={{ height: 22, padding: '0 10px', borderRadius: 999, background: theme.accent, color: '#FFFFFF', fontFamily: "'Geist Mono', monospace", fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <i className="ph-fill ph-sparkle" style={{ fontSize: 11 }} />
          AI-generated
        </span>
      </div>
      <h3 style={{ fontFamily: theme.heading, fontWeight: 600, fontSize: 26, lineHeight: 1.25, letterSpacing: '-0.01em' }}>{sec.headline}</h3>
      <p style={{ fontFamily: theme.bodyFont, fontSize: 16, lineHeight: 1.65, color: 'var(--text-2)' }}>{sec.body}</p>
    </div>
  );
}

function mono(): CSSProperties {
  return { fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' };
}
