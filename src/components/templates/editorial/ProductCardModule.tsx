import type { ProductCardModuleContent } from '../../../lib/templates/editorial-modules.types';

// Editorial template, Phase 3 -- category/name/price stack over a product
// photo, with an optional quantity badge on the photo's corner.
//
// Price color: reuses an existing accent token from tokens.css rather than
// hardcoding a color, per the original ticket. Phase 5 resolved the
// integration point flagged back then: accentColorHex now lets the mapping
// function key this to the real project's own extracted accent when one
// exists, falling back to var(--violet) -- the app's own existing accent
// token, used here as UI chrome the same way TypographyColorSheetModule's
// active pill reuses var(--violet-gradient) -- when it doesn't.
export function ProductCardModule({ content }: { content: ProductCardModuleContent }) {
  const { category, name, price, photoUrl, qtyBadge, accentColorHex } = content;

  return (
    <section style={{ background: 'var(--bg)', padding: '48px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{category}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>{name}</span>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: accentColorHex || 'var(--violet)' }}>{price}</span>
        <div style={{ position: 'relative', marginTop: 10, borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '1 / 1' }}>
          <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {qtyBadge !== undefined && (
            <span
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                minWidth: 24,
                height: 24,
                padding: '0 6px',
                borderRadius: 999,
                background: 'var(--text)',
                color: 'var(--bg)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {qtyBadge}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
