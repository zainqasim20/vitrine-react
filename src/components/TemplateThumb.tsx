// Shape-sketch thumbnails for each presentation-style template -- not real
// screenshots or generated hero photography (that capability doesn't exist
// yet; see presentation-styles-creativity-engine.md Part 7). Each template's
// treatment is now deliberately chosen from that doc's Part 2 named recipes
// / Part 5 per-template guidance, rather than an arbitrary shape:
//
//   grid      -- deliberately NO staging recipe: "even weight, no hierarchy"
//                is the whole concept, so this stays the framework's own
//                plain baseline (Layer 2 dead-flat + Layer 3 flat studio).
//                My own reasoned extension -- Part 5 doesn't name Grid.
//   story     -- Part 5: "apply an Elevated Moment or Oversized Wordmark
//                Overlay recipe". Picked Wordmark Overlay -- Elevated Moment
//                needs real photographic water/light detail a flat CSS
//                sketch can't honestly deliver.
//   split     -- Part 5: "both sides must use identical Layer 1-8 choices
//                except for the one thing that changed" -- same shape, only
//                the color grade (Layer 6) differs, muted vs brand-accent.
//   metrics   -- Part 5: "flat, high-clarity lighting... never a
//                dramatic-tilt scene" -- kept flat, added the real accent.
//   editorial -- Movie Credits Opening recipe (centered, high-contrast type,
//                generous spacing, no photographic element). My own reasoned
//                extension -- Part 5 doesn't name Editorial Magazine.
//   timeline  -- Part 5: "consistent color grade across stages, varying only
//                what the step itself shows" -- one accent-highlighted
//                current stage, rest neutral.
//   visual    -- Part 5, explicit: "do not apply device-mockup staging logic
//                at all here" -- stays plain on purpose.
//   deepdive  -- Part 5: "apply the Annotated Hero recipe directly" -- added
//                callout-style markers around the centered frame.
//   feature-story -- Phase 6: not a staging recipe from the doc above (this
//                kind renders through the separate Editorial module set, not
//                the frame-staging pipeline the rest of this file covers) --
//                a miniaturized version of CoverModule's own real layout
//                (4-item meta strip + centered mark) instead, so it reads as
//                genuinely distinct from the 8 frame-staging templates it
//                sits next to, not a generic placeholder box.
export type TemplateKind = 'grid' | 'story' | 'split' | 'metrics' | 'editorial' | 'timeline' | 'visual' | 'deepdive' | 'feature-story';

export function TemplateThumb({ kind }: { kind: TemplateKind }) {
  if (kind === 'grid') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr', gap: 8, height: '100%' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} style={{ borderRadius: 3, background: i === 4 ? 'var(--violet)' : 'var(--surface-3)' }} />
        ))}
      </div>
    );
  }
  if (kind === 'story') {
    return (
      <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--violet-light)', borderRadius: 6, overflow: 'hidden' }}>
        <span
          style={{
            position: 'absolute',
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 800,
            fontSize: 58,
            color: 'var(--violet)',
            opacity: 0.3,
            letterSpacing: '-0.03em',
            whiteSpace: 'nowrap',
          }}
        >
          STORY
        </span>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 6, zIndex: 1 }}>
          <span style={{ height: 8, width: 56, borderRadius: 2, background: '#14141A' }} />
          <span style={{ height: 5, width: 80, borderRadius: 2, background: 'var(--border-strong)' }} />
        </div>
      </div>
    );
  }
  if (kind === 'metrics') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, height: '100%', alignItems: 'end' }}>
        {[0.9, 0.55, 0.75, 0.4].map((h, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ height: `${h * 100}%`, borderRadius: 3, background: 'var(--violet)' }} />
            <span style={{ height: 5, borderRadius: 2, background: 'var(--border)' }} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'editorial') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <span style={{ height: 9, width: '55%', borderRadius: 2, background: '#14141A' }} />
        <span style={{ height: 5, width: '30%', borderRadius: 2, background: 'var(--violet)' }} />
        <span style={{ height: 5, width: '42%', borderRadius: 2, background: 'var(--border)' }} />
      </div>
    );
  }
  if (kind === 'split') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, height: '100%' }}>
        <span style={{ borderRadius: 4, background: 'var(--surface-3)' }} />
        <span style={{ borderRadius: 4, background: 'var(--violet-gradient)' }} />
      </div>
    );
  }
  if (kind === 'timeline') {
    return (
      <div style={{ display: 'flex', gap: 12, height: '100%' }}>
        <span style={{ flex: 'none', width: 2, borderRadius: 1, background: 'var(--border-strong)' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
          <span style={{ height: 6, width: '70%', borderRadius: 2, background: 'var(--violet)' }} />
          <span style={{ height: 6, width: '55%', borderRadius: 2, background: 'var(--border)' }} />
          <span style={{ height: 6, width: '80%', borderRadius: 2, background: 'var(--border)' }} />
        </div>
      </div>
    );
  }
  if (kind === 'visual') {
    return <span style={{ display: 'block', height: '100%', borderRadius: 4, background: 'var(--surface-3)' }} />;
  }
  if (kind === 'deepdive') {
    // Annotated Hero: centered frame + callout markers
    return (
      <div style={{ height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ width: '55%', height: '70%', borderRadius: 6, background: 'var(--surface-3)', border: '1.5px solid var(--border-strong)' }} />
        <span style={{ position: 'absolute', top: '22%', left: '24%', width: 8, height: 8, borderRadius: '50%', background: 'var(--violet)', boxShadow: '0 0 0 3px var(--violet-light)' }} />
        <span style={{ position: 'absolute', bottom: '26%', right: '24%', width: 8, height: 8, borderRadius: '50%', background: 'var(--violet)', boxShadow: '0 0 0 3px var(--violet-light)' }} />
      </div>
    );
  }
  // feature-story -- miniaturized CoverModule: a 4-item meta strip (each
  // item just a tiny label+value bar pair, real text is unreadable at this
  // size, same convention every other kind above already uses) above a
  // border, then a centered circular mark in the same violet gradient
  // CoverModule's own InitialMark fallback uses.
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ height: 3, width: '70%', borderRadius: 1, background: 'var(--border-strong)' }} />
            <span style={{ height: 4, width: '90%', borderRadius: 1, background: 'var(--text-3)' }} />
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--violet-gradient)' }} />
      </div>
    </div>
  );
}
