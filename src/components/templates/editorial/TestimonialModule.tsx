import type { TestimonialModuleContent } from '../../../lib/templates/editorial-modules.types';

// Editorial template, Module 4/5 -- attribution for the Brief module's
// quote. Built as its own module (not folded into Brief) so it can be
// independently placed/removed later, per the ticket. backgroundColorHex
// lets it visually continue whatever background BriefModule above it is
// using -- same isDarkHex() logic BriefModule already uses for text color,
// duplicated locally here rather than cross-imported (matches this
// module set's existing self-contained-per-file style, e.g.
// SectionDividerModule's own local copy).
function isDarkHex(hex: string): boolean {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return true;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

export function TestimonialModule({ content }: { content: TestimonialModuleContent }) {
  const { quoteAuthorName, quoteAuthorRole, avatarUrl, backgroundColorHex } = content;
  // No backgroundColorHex -> unchanged default (var(--bg), current
  // var(--text)/var(--text-3) behavior). A hex is only ever dark-checked
  // when one is actually supplied.
  const dark = backgroundColorHex ? isDarkHex(backgroundColorHex) : false;
  const nameColor = dark ? '#FFFFFF' : 'var(--text)';
  const roleColor = dark ? 'rgba(255,255,255,0.6)' : 'var(--text-3)';

  const initials =
    quoteAuthorName
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  return (
    <section style={{ background: backgroundColorHex || 'var(--bg)', padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={quoteAuthorName} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
      ) : (
        <span
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--violet-gradient)',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 17,
          }}
        >
          {initials}
        </span>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: nameColor }}>{quoteAuthorName}</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: roleColor }}>{quoteAuthorRole}</span>
      </div>
    </section>
  );
}
