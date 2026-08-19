import { Tag } from '../../Tag';
import type { ProblemSolutionModuleContent } from '../../../lib/templates/editorial-modules.types';

// Editorial template, Phase 2 -- two rounded cards side by side. Reuses the
// app's existing Tag component for the "Problem"/"Solution" pill labels
// (checked first, per the ticket) rather than inventing a new pill --
// Tag is a generic, presentation-only primitive with no pipeline/store
// coupling, so importing it doesn't cross the "don't touch the pipeline"
// line the way importing from store.tsx or a page would.
export function ProblemSolutionModule({ content }: { content: ProblemSolutionModuleContent }) {
  const { problemLabel, problemText, solutionLabel, solutionText, photoUrl } = content;

  return (
    <section style={{ background: 'var(--bg)', padding: '64px 48px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 1040, margin: '0 auto' }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 32, background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {photoUrl && <img src={photoUrl} alt="" style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />}
          <span style={{ alignSelf: 'flex-start' }}>
            <Tag tone="neutral">{problemLabel}</Tag>
          </span>
          <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.6, color: 'var(--text-2)' }}>{problemText}</p>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 32, background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={{ alignSelf: 'flex-start' }}>
            <Tag tone="neutral">{solutionLabel}</Tag>
          </span>
          <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.6, color: 'var(--text-2)' }}>{solutionText}</p>
        </div>
      </div>
    </section>
  );
}
