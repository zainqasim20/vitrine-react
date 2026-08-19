import { Fragment } from 'react';
import type { LogoDerivationModuleContent } from '../../../lib/templates/editorial-modules.types';

// Editorial template, Phase 2 -- N equal-width panels (built generic, not
// hardcoded to 3), each an icon/shape with an optional "+"/"=" operator
// glyph after it. shapeSvg is trusted, caller-supplied raw markup -- same
// trust boundary as the rest of this content-prop-driven module set (e.g.
// Cover/Testimonial's own image URLs), not sanitized here.
export function LogoDerivationModule({ content }: { content: LogoDerivationModuleContent }) {
  const { panels } = content;

  return (
    <section style={{ background: 'var(--bg)', padding: '56px 48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      {panels.map((panel, i) => (
        <Fragment key={i}>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              maxWidth: 160,
              aspectRatio: '1 / 1',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            {panel.shapeSvg ? (
              <span aria-hidden style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: panel.shapeSvg }} />
            ) : panel.shapeUrl ? (
              <img src={panel.shapeUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : null}
          </div>
          {panel.operatorAfter && i < panels.length - 1 && (
            <span aria-hidden style={{ flex: 'none', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 32, color: 'var(--text-3)' }}>
              {panel.operatorAfter}
            </span>
          )}
        </Fragment>
      ))}
    </section>
  );
}
