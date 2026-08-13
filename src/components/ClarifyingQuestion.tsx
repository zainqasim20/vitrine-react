import { useApp } from '../lib/store';
import { FOLLOW_UP_QUESTIONS } from '../lib/data';

const COPY = {
  style: {
    ctx: 'Before generating',
    q: 'Should the new pages lean editorial or product-led?',
    note: 'This only steers the artwork Vitrine paints. Every variant stays editable afterwards.',
    opts: ['Editorial', 'Product-led', 'A mix'],
  },
  variant: {
    ctx: 'Ten variants ready',
    q: 'Which direction reads more like your work?',
    note: 'Vitrine will sort the rest to match. Nothing is deleted.',
    opts: ['Bold statement', 'Card breakdown', 'Icon system'],
  },
};

export function ClarifyingQuestion() {
  const { state, actions } = useApp();
  if (!state.cq) return null;

  const def =
    state.cq === 'brief'
      ? {
          ctx: `About screen ${String(state.idx + 1).padStart(2, '0')}`,
          q: FOLLOW_UP_QUESTIONS[state.idx % FOLLOW_UP_QUESTIONS.length],
          note: 'One tap is enough. The draft is already written either way.',
          opts: ['Yes, lead with it', 'No, keep it secondary'],
        }
      : COPY[state.cq];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(20,20,26,0.34)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'v-in 180ms ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-lg)',
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ph-fill ph-sparkle" style={{ fontSize: 15, color: 'var(--violet)' }} />
          <span
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: 11.5,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--text-3)',
            }}
          >
            {def.ctx}
          </span>
        </div>
        <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 24, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
          {def.q}
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-2)' }}>{def.note}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {def.opts.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => (state.cq === 'brief' ? actions.answerFollowUp(label) : actions.closeCq(`${label} — noted`))}
              style={{
                height: 48,
                padding: '0 16px',
                border: '1.5px solid var(--border)',
                borderRadius: 10,
                background: 'transparent',
                color: 'var(--text)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 180ms ease-out, background 180ms ease-out',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingTop: 14,
            marginTop: 4,
            borderTop: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            onClick={() => (state.cq === 'brief' ? actions.dismissFollowUp() : actions.cqSkip())}
            style={{ height: 36, padding: '0 12px', border: 0, borderRadius: 8, background: 'transparent', color: 'var(--text-3)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => actions.cqDecide()}
            style={{
              height: 36,
              padding: '0 12px',
              border: 0,
              borderRadius: 8,
              background: 'transparent',
              color: 'var(--text-2)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="ph ph-magic-wand" style={{ fontSize: 15 }} />
            Not sure, decide for me
          </button>
        </div>
      </div>
    </div>
  );
}
