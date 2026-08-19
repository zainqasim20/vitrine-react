import type { CoverModuleContent } from '../../../lib/templates/editorial-modules.types';

// Editorial template, Module 1/5 -- the case study's opening frame. Flat
// canvas with a 4-column meta strip (PROJECT / CATEGORY / DESIGNER / YEAR)
// and a centered project mark. All colors/fonts resolve through
// src/styles/tokens.css -- no hardcoded brand values here.
export function CoverModule({ content }: { content: CoverModuleContent }) {
  const { projectName, category, designerName, year, logoUrl, dark } = content;
  const bg = dark ? '#14141A' : 'var(--bg)';
  const textColor = dark ? '#FFFFFF' : 'var(--text)';
  const mutedColor = dark ? 'rgba(255,255,255,0.55)' : 'var(--text-3)';
  const borderColor = dark ? 'rgba(255,255,255,0.12)' : 'var(--border)';

  return (
    <section style={{ position: 'relative', minHeight: 560, display: 'flex', flexDirection: 'column', background: bg, color: textColor }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 24,
          padding: '36px 48px',
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <MetaItem label="Project" value={projectName} mutedColor={mutedColor} textColor={textColor} />
        <MetaItem label="Category" value={category} mutedColor={mutedColor} textColor={textColor} />
        <MetaItem label="Designer" value={designerName} mutedColor={mutedColor} textColor={textColor} />
        <MetaItem label="Year" value={year} mutedColor={mutedColor} textColor={textColor} />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        {logoUrl ? (
          <img src={logoUrl} alt={`${projectName} mark`} style={{ maxHeight: 96, maxWidth: '60%', objectFit: 'contain' }} />
        ) : (
          <InitialMark projectName={projectName} />
        )}
      </div>
    </section>
  );
}

function MetaItem({ label, value, mutedColor, textColor }: { label: string; value: string; mutedColor: string; textColor: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
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
          fontSize: 14,
          fontWeight: 600,
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
