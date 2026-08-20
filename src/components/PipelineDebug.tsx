import { useApp } from '../lib/store';

// Temporary, honest visibility into the real Perceive/Classify calls while
// they're wired in but not yet driving any visible UI/flow (that's the next
// step). Only renders when a real Gemini key is configured, so it's
// invisible in the no-key/mocked world. Mirrors the live site's own
// dev-only ?debug=1 precedent for Validate -- a small seam before the real
// screen exists, not a permanent feature.
export function PipelineDebug() {
  const { state } = useApp();
  if (!state.apiStatus.gemini) return null;

  const { perceiveStatus, perceiveError, classifyResult } = state.pipeline;
  const entries = state.files.map((f) => ({ f, status: perceiveStatus[f.id], error: perceiveError[f.id] }));
  if (!entries.length) return null;

  return (
    <div
      style={{
        marginBottom: 16,
        padding: '10px 14px',
        border: '1px dashed var(--violet)',
        borderRadius: 10,
        background: 'var(--violet-light)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontFamily: "'Geist Mono', monospace",
        fontSize: 11.5,
        color: 'var(--on-violet-light)',
      }}
    >
      <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
        Real pipeline (dev) — Perceive + Classify
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {entries.map(({ f, status, error }) => (
          <span key={f.id} title={error || ''}>
            {f.name}: {status || 'pending'}
          </span>
        ))}
      </div>
      <span>
        {classifyResult
          ? `category=${classifyResult.category ?? 'none'} · confidence=${classifyResult.confidence}% · outcome=${classifyResult.outcome}`
          : 'classify: waiting on all Perceive calls to settle…'}
      </span>
    </div>
  );
}
