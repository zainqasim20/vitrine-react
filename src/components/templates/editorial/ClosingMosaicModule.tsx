import type { ClosingMosaicModuleContent, ClosingMosaicTile } from '../../../lib/templates/editorial-modules.types';

// Editorial template, Phase 4 -- asymmetric bento-style closing grid.
//
// Checked the codebase first for an existing grid/bento/gallery layout
// component, per the ticket, before building a new one. Found none: every
// CSS Grid usage elsewhere (Templates.tsx, Refine.tsx, DesignSystem.tsx,
// etc.) is a private, page-local layout for that page's own controls or
// cards, not an exported, reusable tile-grid component.
//
// Built as a generic N-tile grid, not hardcoded to 6: CSS Grid's own
// `grid-auto-flow: dense` packing handles an arbitrary number of tiles with
// mixed spans on its own, with no per-tile positioning logic needed. That
// made generalizing past exactly 6 tiles free, so the ticket's "ship
// 6-fixed if that's genuinely simpler" escape hatch wasn't needed here.
const SPAN_STYLE: Record<NonNullable<ClosingMosaicTile['span']>, { gridColumn: string; gridRow: string }> = {
  tall: { gridColumn: 'span 1', gridRow: 'span 2' },
  wide: { gridColumn: 'span 2', gridRow: 'span 1' },
  square: { gridColumn: 'span 1', gridRow: 'span 1' },
};

// "Light/dark canvas per tile" is read as a colored mat behind each image
// (a fixed dark neutral, not var(--bg), so a tile deliberately marked dark
// stays dark regardless of the app's own light/dark theme -- same
// disclosed-content-color reasoning as SectionDividerModuleContent's
// backgroundColorHex) rather than literally alternating by index, per the
// ticket's own instruction not to hardcode index%2.
function Tile({ tile }: { tile: ClosingMosaicTile }) {
  const span = SPAN_STYLE[tile.span ?? 'square'];
  return (
    <div style={{ ...span, borderRadius: 'var(--radius-lg)', padding: 14, background: tile.dark ? '#14141A' : 'var(--surface-2)' }}>
      <img src={tile.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)', display: 'block' }} />
    </div>
  );
}

export function ClosingMosaicModule({ content }: { content: ClosingMosaicModuleContent }) {
  const { tiles } = content;

  return (
    <section style={{ background: 'var(--bg)', padding: '56px 48px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: 160, gridAutoFlow: 'dense', gap: 12, maxWidth: 1040, margin: '0 auto' }}>
        {tiles.map((t, i) => (
          <Tile key={i} tile={t} />
        ))}
      </div>
    </section>
  );
}
