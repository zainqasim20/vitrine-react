import type { CoverModuleContent } from '../../../lib/templates/editorial-modules.types';

// Editorial template, Module 1/5 -- the case study's opening frame.
//
// Layout corrected against a real, high-resolution reference case study
// (not the earlier compressed screenshots): the real cover is a thin,
// single-line meta overlay directly on a full-bleed photo backdrop --
// "PRODUCTS" on the left, "DESIGNERS" + "YEAR" grouped on the right, no
// separating border, no bordered 4-column grid block, and no separate
// "Project" label (the brand name is carried by the mark itself, not a
// text field). backgroundImageUrl is new here, mirroring the pattern
// SectionDividerModuleContent already established (solid color OR an
// image, never both) -- the real reference's cover is photo-first, which
// the flat dark/light-only version this module shipped with couldn't
// represent at all.
export function CoverModule({ content }: { content: CoverModuleContent }) {
  const { projectName, category, designerName, year, logoUrl, dark, backgroundImageUrl } = content;
  const hasImage = Boolean(backgroundImageUrl);
  const bg = hasImage ? '#000000' : dark ? '#14141A' : 'var(--bg)';
  const textColor = hasImage || dark ? '#FFFFFF' : 'var(--text)';
  const mutedColor = hasImage || dark ? 'rgba(255,255,255,0.6)' : 'var(--text-3)';

  return (
    <section style={{ position: 'relative', minHeight: 560, display: 'flex', flexDirection: 'column', background: bg, color: textColor, overflow: 'hidden' }}>
      {hasImage && (
        <>
          <img src={backgroundImageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          {/* Text-legibility wash over the photo -- the real reference's
              photography is dark enough on its own; this is a disclosed
              safety net for photos that aren't. */}
          <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.35) 100%)' }} />
        </>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '32px 48px', zIndex: 1 }}>
        <MetaItem label="Products" value={category} mutedColor={mutedColor} textColor={textColor} />
        <div style={{ display: 'flex', gap: 40 }}>
          <MetaItem label="Designer" value={designerName} mutedColor={mutedColor} textColor={textColor} align="right" />
          <MetaItem label="Year" value={year} mutedColor={mutedColor} textColor={textColor} align="right" />
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', zIndex: 1 }}>
        {logoUrl ? (
          <img src={logoUrl} alt={`${projectName} mark`} style={{ maxHeight: 96, maxWidth: '60%', objectFit: 'contain' }} />
        ) : (
          <InitialMark projectName={projectName} />
        )}
      </div>
    </section>
  );
}

function MetaItem({ label, value, mutedColor, textColor, align }: { label: string; value: string; mutedColor: string; textColor: string; align?: 'left' | 'right' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: 'var(--tracking-label-wide)',
          textTransform: 'uppercase',
          color: mutedColor,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12.5,
          fontWeight: 600,
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          color: textColor,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// Never leave the cover mark blank when there's no real logo asset -- a
// circular initial in the brand gradient, same fallback pattern used
// elsewhere in this app (e.g. Refine's own logo mark, Testimonial's avatar
// fallback below).
function InitialMark({ projectName }: { projectName: string }) {
  const initial = (projectName.trim()[0] || '?').toUpperCase();
  return (
    <span
      style={{
        width: 96,
        height: 96,
        borderRadius: '50%',
        background: 'var(--violet-gradient)',
        color: '#FFFFFF',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 36,
      }}
    >
      {initial}
    </span>
  );
}
