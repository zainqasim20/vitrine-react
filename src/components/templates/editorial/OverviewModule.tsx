import type { OverviewModuleContent } from '../../../lib/templates/editorial-modules.types';

// Editorial template, Module 5/5 -- centered, readability-constrained
// summary paragraph.
export function OverviewModule({ content }: { content: OverviewModuleContent }) {
  return (
    <section style={{ background: 'var(--bg)', padding: '64px 48px', display: 'flex', justifyContent: 'center' }}>
      <p style={{ maxWidth: '65ch', margin: 0, fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.7, color: 'var(--text-2)', textAlign: 'center' }}>{content.body}</p>
    </section>
  );
}
