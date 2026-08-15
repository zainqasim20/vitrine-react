// Real, illustrative mock visuals for each presentation-style template --
// ported/extended from the live site's TemplateTeaserMock (Landing) so the
// Templates gallery and Landing's teaser section share one visual language.
// These are shape sketches, not real screenshots or stock photos.
export type TemplateKind = 'grid' | 'story' | 'split' | 'metrics' | 'editorial' | 'timeline' | 'visual' | 'deepdive';

export function TemplateThumb({ kind }: { kind: TemplateKind }) {
  if (kind === 'grid') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr', gap: 8, height: '100%' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} style={{ borderRadius: 3, background: i === 4 ? '#14141A' : 'var(--surface-3)' }} />
        ))}
      </div>
    );
  }
  if (kind === 'story') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', justifyContent: 'center' }}>
        <span style={{ height: 8, width: '58%', borderRadius: 2, background: '#14141A' }} />
        <span style={{ height: 34, borderRadius: 4, background: 'var(--surface-3)' }} />
        <span style={{ height: 6, borderRadius: 2, background: 'var(--border)' }} />
        <span style={{ height: 6, width: '72%', borderRadius: 2, background: 'var(--border)' }} />
        <span style={{ height: 20, width: '40%', borderRadius: 4, background: 'var(--surface-3)' }} />
      </div>
    );
  }
  if (kind === 'metrics') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, height: '100%', alignItems: 'end' }}>
        {[0.9, 0.55, 0.75, 0.4].map((h, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ height: `${h * 100}%`, borderRadius: 3, background: '#14141A' }} />
            <span style={{ height: 5, borderRadius: 2, background: 'var(--border)' }} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'editorial') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12, height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
          <span style={{ height: 9, width: '90%', borderRadius: 2, background: '#14141A' }} />
          <span style={{ height: 9, width: '60%', borderRadius: 2, background: '#14141A' }} />
          <span style={{ height: 5, width: '100%', borderRadius: 2, background: 'var(--border)', marginTop: 6 }} />
          <span style={{ height: 5, width: '80%', borderRadius: 2, background: 'var(--border)' }} />
        </div>
        <span style={{ borderRadius: 4, background: 'var(--surface-3)' }} />
      </div>
    );
  }
  if (kind === 'split') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, height: '100%' }}>
        <span style={{ borderRadius: 4, background: 'var(--surface-3)' }} />
        <span style={{ borderRadius: 4, background: '#14141A' }} />
      </div>
    );
  }
  if (kind === 'timeline') {
    return (
      <div style={{ display: 'flex', gap: 12, height: '100%' }}>
        <span style={{ flex: 'none', width: 2, borderRadius: 1, background: 'var(--border-strong)' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
          <span style={{ height: 6, width: '70%', borderRadius: 2, background: '#14141A' }} />
          <span style={{ height: 6, width: '55%', borderRadius: 2, background: 'var(--border)' }} />
          <span style={{ height: 6, width: '80%', borderRadius: 2, background: 'var(--border)' }} />
        </div>
      </div>
    );
  }
  if (kind === 'visual') {
    return <span style={{ display: 'block', height: '100%', borderRadius: 4, background: 'var(--surface-3)' }} />;
  }
  // deepdive
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ width: '55%', height: '70%', borderRadius: 6, background: 'var(--surface-3)', border: '1.5px solid var(--border-strong)' }} />
    </div>
  );
}
