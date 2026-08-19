import type { SectionDividerModuleContent } from '../../../lib/templates/editorial-modules.types';

// Editorial template, Module 2/5 -- reusable chapter-break divider every
// later section reuses. Same meta-strip pattern as CoverModule, scaled
// down: left = 2-line section label, right = project name + year.
// Background is a solid color or an image -- when an image is used it must
// be one of the project's own uploaded screenshots (never a stock photo),
// so this component only ever renders whatever backgroundImageUrl it's
// given; it doesn't fetch or choose one itself.
function isDarkHex(hex: string): boolean {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return true;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

export function SectionDividerModule({ content }: { content: SectionDividerModuleContent }) {
  const { sectionLabelLines, projectName, year, backgroundColorHex, backgroundImageUrl } = content;
  const hasImage = !!backgroundImageUrl;
  const solidBg = backgroundColorHex || '#14141A';
  const textOnDark = hasImage || isDarkHex(solidBg);
  const textColor = textOnDark ? '#FFFFFF' : 'var(--text)';
  const mutedColor = textOnDark ? 'rgba(255,255,255,0.6)' : 'var(--text-3)';

  return (
    <section style={{ position: 'relative', minHeight: 200, display: 'flex', alignItems: 'center', background: hasImage ? '#14141A' : solidBg, overflow: 'hidden' }}>
      {hasImage && (
        <>
          <img src={backgroundImageUrl} alt="" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <span aria-hidden style={{ position: 'absolute', inset: 0, background: 'rgba(20,20,26,0.55)' }} />
        </>
      )}
      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: '28px 48px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sectionLabelLines.map((line, i) => (
            <span
              key={i}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, letterSpacing: 'var(--tracking-label-wide)', textTransform: 'uppercase', color: textColor }}
            >
              {line}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: textColor }}>{projectName}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em', color: mutedColor }}>{year}</span>
        </div>
      </div>
    </section>
  );
}
