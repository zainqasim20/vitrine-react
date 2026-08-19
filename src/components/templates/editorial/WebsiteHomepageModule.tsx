import type { CSSProperties, ReactNode } from 'react';
import { SectionDividerModule } from './SectionDividerModule';
import type { WebsiteHomepageModuleContent } from '../../../lib/templates/editorial-modules.types';

// Editorial template, Phase 4 -- reuses the Phase 1 SectionDividerModule
// directly for this module's own chapter break, per the ticket's explicit
// "reuse it, don't duplicate its pattern" instruction.
//
// Re-checked src/components/DeviceFrame.tsx specifically for its 'browser'
// kind before building a frame here, per the ticket ("don't skip the check
// just because you already ruled it out once this template"). Still not
// reusable, for reasons more specific than Phase 3's phone/watch case:
//   1. deviceFrameKindFor() still requires an ImageFeatureRecord
//      (src/lib/pipeline/types.ts) to decide the kind -- the same real
//      pipeline coupling this module set avoids, independent of which kind
//      is chosen.
//   2. deviceFrameBoxStyle('browser') literally returns {} -- only the
//      'phone' and 'laptop' branches carry any border/radius styling.
//      There's no frame styling to reuse for 'browser' at all, coupling
//      issue aside.
//   3. The only 'browser' treatment DeviceFrame.tsx provides is
//      DeviceChrome({kind:'browser'}) -- a traffic-light top bar meant to
//      overlay onto an EXISTING sized box (absolute-positioned top:0/left:
//      0/right:0 inside a parent that already has Refine's own resize-
//      derived width/height), not a standalone bordered frame a caller can
//      wrap arbitrary content in.
// BrowserFrame below reuses DeviceChrome's exact traffic-light colors and
// top-bar treatment for visual consistency with the rest of the app's
// device-mockup language -- duplicated, not imported, same precedent as
// DeviceMockupModule's phone/watch bezels in Phase 3.
function BrowserFrame({ children }: { children: ReactNode }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: '#EDEDF0', borderBottom: '1px solid #D7D7DC' }}>
        <span style={{ width: 9, height: 9, borderRadius: 999, background: '#FF5F57' }} />
        <span style={{ width: 9, height: 9, borderRadius: 999, background: '#FEBC2E' }} />
        <span style={{ width: 9, height: 9, borderRadius: 999, background: '#28C840' }} />
      </div>
      <div>{children}</div>
    </div>
  );
}

function SplitHero({
  heroHeadline,
  heroBody,
  ctaLabel,
  heroImageUrl,
  thumbnails,
  thumbnailsCaption,
}: Pick<WebsiteHomepageModuleContent, 'heroHeadline' | 'heroBody' | 'ctaLabel' | 'heroImageUrl' | 'thumbnails' | 'thumbnailsCaption'>) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr', gap: 32, alignItems: 'center', padding: '48px 40px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, lineHeight: 1.2, color: 'var(--text)' }}>{heroHeadline}</h3>
        <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6, color: 'var(--text-2)' }}>{heroBody}</p>
        <span
          style={{
            alignSelf: 'flex-start',
            padding: '10px 20px',
            borderRadius: 999,
            background: 'var(--violet-gradient)',
            color: '#FFFFFF',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {ctaLabel}
        </span>
      </div>

      <img src={heroImageUrl} alt="" style={{ width: '100%', display: 'block', borderRadius: 'var(--radius-md)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {thumbnails.map((t, i) => (
            <img key={i} src={t} alt="" style={{ width: '100%', height: 64, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
          ))}
        </div>
        {thumbnailsCaption && <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-3)' }}>{thumbnailsCaption}</p>}
      </div>
    </div>
  );
}

// Positions up to 4 stats at the band's four corners, in the order given.
// Extra stats beyond 4 are dropped rather than overlapping a corner --
// the ticket described exactly "4 numeric stats in the corners", not an
// arbitrary-N layout like ClosingMosaicModule's grid.
const CORNER_STYLES: CSSProperties[] = [
  { position: 'absolute', top: 32, left: 40, textAlign: 'left' },
  { position: 'absolute', top: 32, right: 40, textAlign: 'right' },
  { position: 'absolute', bottom: 32, left: 40, textAlign: 'left' },
  { position: 'absolute', bottom: 32, right: 40, textAlign: 'right' },
];

function StatsBand({ statHeadline, stats, avatarUrls }: Pick<WebsiteHomepageModuleContent, 'statHeadline' | 'stats' | 'avatarUrls'>) {
  return (
    <div style={{ position: 'relative', background: '#14141A', padding: '72px 40px', minHeight: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
      {stats.slice(0, 4).map((s, i) => (
        <div key={i} style={{ ...CORNER_STYLES[i], display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: '#F2F2F4' }}>{s.value}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#77777F' }}>{s.label}</span>
        </div>
      ))}

      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(22px, 3vw, 34px)', lineHeight: 1.3, color: '#F2F2F4', textAlign: 'center', maxWidth: 560 }}>
        {statHeadline}
      </span>

      {avatarUrls && avatarUrls.length > 0 && (
        <div style={{ display: 'flex' }}>
          {avatarUrls.map((a, i) => (
            <img key={i} src={a} alt="" style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #14141A', marginLeft: i === 0 ? 0 : -10 }} />
          ))}
        </div>
      )}
    </div>
  );
}

export function WebsiteHomepageModule({ content }: { content: WebsiteHomepageModuleContent }) {
  const { divider, heroHeadline, heroBody, ctaLabel, heroImageUrl, thumbnails, thumbnailsCaption, statHeadline, stats, avatarUrls } = content;

  return (
    <>
      <SectionDividerModule content={divider} />
      <section style={{ background: 'var(--bg)', padding: '56px 48px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <BrowserFrame>
            <SplitHero heroHeadline={heroHeadline} heroBody={heroBody} ctaLabel={ctaLabel} heroImageUrl={heroImageUrl} thumbnails={thumbnails} thumbnailsCaption={thumbnailsCaption} />
          </BrowserFrame>
        </div>
      </section>
      <StatsBand statHeadline={statHeadline} stats={stats} avatarUrls={avatarUrls} />
    </>
  );
}
