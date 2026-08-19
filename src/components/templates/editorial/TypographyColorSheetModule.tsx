import type { ReactNode } from 'react';
import type { TypographyColorSheetModuleContent } from '../../../lib/templates/editorial-modules.types';

// Editorial template, Phase 2 -- "Font"/"Colors" pill labels, a display-type
// specimen, and a divided color-swatch bar.
//
// Pill labels: checked for an existing reusable tab component first. Found
// two precedents, neither reusable here -- Refine.tsx's own TabBar()
// (underline-style, not a pill look, and private/unexported besides being
// in a file this ticket forbids importing from) and Templates.tsx's
// category-filter buttons (the right pill *look*, but likewise an inline,
// unexported pattern in a page file, not a component). So these are static,
// non-interactive pills styled to match that existing pill-button
// convention rather than a genuinely new visual language.
//
// colors is a plain prop, not a read from DesignSystemSheet.colors, on
// purpose: this module set stays decoupled from pipeline types (same
// reasoning as every other module here), and wiring a real
// DesignSystemSheet read through would mean either importing pipeline
// types into this decoupled module set or threading resolved data through
// from a caller that itself reaches into store state -- more coupling than
// this pass should take on. Flagging this as the integration point for
// whenever this template gets wired into the real pipeline.
function isDarkHex(hex: string): boolean {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return true;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

function StaticPill({ active, children }: { active?: boolean; children: ReactNode }) {
  return (
    <span
      style={{
        padding: '8px 18px',
        borderRadius: 999,
        fontFamily: 'var(--font-mono)',
        fontSize: 11.5,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background: active ? 'var(--violet-gradient)' : 'transparent',
        color: active ? '#FFFFFF' : 'var(--text-2)',
      }}
    >
      {children}
    </span>
  );
}

export function TypographyColorSheetModule({ content }: { content: TypographyColorSheetModuleContent }) {
  const { fontName, fontSpecimenText, colors } = content;

  return (
    <section style={{ background: 'var(--bg)', padding: '56px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
      <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 999, padding: 4, gap: 4 }}>
        <StaticPill active>Font</StaticPill>
        <StaticPill>Colors</StaticPill>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(40px, 7vw, 88px)', letterSpacing: '-0.02em', color: 'var(--text)', textAlign: 'center' }}>
          {fontSpecimenText}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{fontName}</span>
      </div>

      {colors.length > 0 && (
        <div style={{ display: 'flex', width: '100%', maxWidth: 720, borderRadius: 999, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {colors.map((c) => {
            const textColor = isDarkHex(c.hex) ? '#FFFFFF' : '#14141A';
            return (
              <div key={c.hex} style={{ flex: 1, background: c.hex, padding: '14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: textColor }}>{c.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.03em', color: textColor }}>{c.hex.toUpperCase()}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
