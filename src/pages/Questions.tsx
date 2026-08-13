import { useApp } from '../lib/store';
import { AUDIENCE_OPTIONS, PACING_OPTIONS, PROVE_OPTIONS, TECH_LABELS } from '../lib/data';

export function Questions() {
  const { state, actions } = useApp();

  const answered = [!!state.qAud, state.qProve.length > 0, true, !!state.qPace, !!state.qAvoid].filter(Boolean).length;
  const pct = Math.round((answered / 5) * 100);

  const borderFor = (on: boolean) => (on ? 'var(--violet)' : 'var(--border)');

  return (
    <main style={{ flex: 1, padding: '56px 32px 96px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <span
          style={{
            height: 28,
            padding: '0 12px',
            borderRadius: 999,
            background: 'var(--coral-gradient)',
            color: '#FFFFFF',
            fontFamily: "'Geist Mono', monospace",
            fontSize: 11.5,
            fontWeight: 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <i className="ph ph-lightbulb" style={{ fontSize: 13 }} />
          Vitrine is asking
        </span>
        <h1 style={{ margin: '16px 0 8px', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 40, lineHeight: 1.1, letterSpacing: '-0.03em', maxWidth: '20ch' }}>
          Five calls I can't make from your screens.
        </h1>
        <p style={{ margin: '0 0 20px', fontSize: 17, lineHeight: 1.6, color: 'var(--text-2)', maxWidth: '56ch' }}>
          All optional. Skip the lot and you get a draft in seconds — anything I decide myself is labelled as suggested, and you can change it in review.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface-2)', marginBottom: 28 }}>
          <button
            type="button"
            onClick={() => actions.submitQuestions()}
            style={{ height: 40, padding: '0 16px', border: 0, borderRadius: 10, background: 'var(--violet-gradient)', color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <i className="ph ph-fast-forward" style={{ fontSize: 16 }} />
            Skip all, draft it now
          </button>
          <button
            type="button"
            onClick={() => actions.decideForMe()}
            style={{ height: 40, padding: '0 14px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--surface)', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <i className="ph ph-magic-wand" style={{ fontSize: 16 }} />
            Decide for me
          </button>
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Or answer any of the five below</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <span style={{ flex: 'none', width: 120, height: 4, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: 'var(--violet-gradient)', transition: 'width 240ms ease-out' }} />
          </span>
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            {answered} of 5 answered
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ border: `1px solid ${borderFor(!!state.qAud)}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>Who is reading this case study?</span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, letterSpacing: '0.04em', color: 'var(--text-3)' }}>01</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {AUDIENCE_OPTIONS.map((label) => {
                const on = state.qAud === label;
                return (
                  <button key={label} type="button" onClick={() => actions.setQAud(label)} style={chip(on)}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ border: `1px solid ${borderFor(state.qProve.length > 0)}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>What should this case study prove?</span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, letterSpacing: '0.04em', color: 'var(--text-3)' }}>02 · pick any</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PROVE_OPTIONS.map((label) => {
                const on = state.qProve.includes(label);
                return (
                  <button key={label} type="button" onClick={() => actions.toggleQProve(label)} style={{ ...chip(on), height: 34, gap: 6 }}>
                    {on && <i className="ph-fill ph-check" style={{ fontSize: 12 }} />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ border: '1px solid var(--violet)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>How technical should the writing be?</span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, letterSpacing: '0.04em', color: 'var(--text-3)' }}>03</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <input
                type="range"
                min={0}
                max={4}
                step={1}
                value={state.qTech}
                onChange={(e) => actions.setQTech(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--violet)', height: 4, cursor: 'pointer' }}
              />
              <span style={{ flex: 'none', width: 168, fontFamily: "'Geist Mono', monospace", fontSize: 11.5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-2)', textAlign: 'right' }}>
                {TECH_LABELS[state.qTech]}
              </span>
            </div>
          </div>

          <div style={{ border: `1px solid ${borderFor(!!state.qPace)}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>Which pacing suits this project?</span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, letterSpacing: '0.04em', color: 'var(--text-3)' }}>04</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              {PACING_OPTIONS.map((o) => {
                const on = state.qPace === o.label;
                return (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => actions.setQPace(o.label)}
                    style={{ border: `1.5px solid ${borderFor(on)}`, borderRadius: 12, background: on ? 'var(--violet-light)' : 'transparent', padding: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}
                  >
                    <span style={{ height: 64, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, padding: 8 }}>
                      {o.bars.map((w, i) => (
                        <span key={i} style={{ height: 5, borderRadius: 2, background: i === 0 ? 'var(--text)' : 'var(--border)', width: `${w}%` }} />
                      ))}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{o.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ border: `1px solid ${borderFor(!!state.qAvoid)}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>Anything I should not claim?</span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, letterSpacing: '0.04em', color: 'var(--text-3)' }}>05 · optional</span>
            </div>
            <input
              type="text"
              value={state.qAvoid}
              onChange={(e) => actions.setQAvoid(e.target.value)}
              placeholder="e.g. don't cite numbers, the metrics are under NDA"
              style={{ height: 48, padding: '0 14px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--surface)', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 32 }}>
          <button
            type="button"
            onClick={() => actions.submitQuestions()}
            style={{ height: 52, padding: '0 26px', border: 0, borderRadius: 10, background: 'var(--violet-gradient)', color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 17, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            Draft with these answers
            <i className="ph ph-arrow-right" style={{ fontSize: 18 }} />
          </button>
          <button
            type="button"
            onClick={() => actions.decideForMe()}
            style={{ height: 48, padding: '0 18px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'transparent', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Decide for me
          </button>
        </div>
      </div>
    </main>
  );
}

function chip(on: boolean) {
  return {
    height: 38,
    padding: '0 16px',
    border: `1.5px solid ${on ? 'var(--violet)' : 'var(--border)'}`,
    borderRadius: 999,
    background: on ? 'var(--violet-light)' : 'transparent',
    color: on ? 'var(--violet-deep)' : 'var(--text-2)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 500,
    fontSize: 14,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
  } as const;
}
